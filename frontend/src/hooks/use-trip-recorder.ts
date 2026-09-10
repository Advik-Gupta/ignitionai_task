"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  createLinearAccelerationReader,
  createMotionWindow,
  describeGeolocationError,
  requestMotionPermission,
  toPositionFix,
  type MotionPermission,
  type PositionFix,
} from "@/lib/sensors";
import {
  endTrip,
  getTrip,
  startTrip,
  uploadPoints,
  type Trip,
  type TripPointPayload,
} from "@/lib/trip-api";

const SAMPLE_INTERVAL_MS = 1000;
const UPLOAD_INTERVAL_MS = 5000;
const MAX_POINTS_PER_UPLOAD = 500;
const MAX_POINTS_PER_KEEPALIVE_UPLOAD = 200;
const GPS_STALE_AFTER_MS = 5000;
const FIRST_FIX_TIMEOUT_MS = 30_000;
const MOTION_DETECT_WINDOW_MS = 3000;

const ACTIVE_TRIP_STORAGE_KEY = "driver-scorecard:active-trip";

export type MotionStatus = "waiting" | "active" | "unavailable" | "denied";
export type ScreenLockStatus = "held" | "unavailable";

export type LiveStats = {
  elapsedSeconds: number;
  fix: PositionFix | null;
  gpsLost: boolean;
  gpsError: string | null;
  motion: MotionStatus;
  screenLock: ScreenLockStatus;
  uploadedCount: number;
  pendingCount: number;
  uploadError: string | null;
};

export type RecorderPhase =
  | { name: "checking" }
  | { name: "idle"; error: string | null }
  | { name: "interrupted"; trip: Trip; error: string | null }
  | { name: "starting" }
  | { name: "recording"; trip: Trip }
  | {
      name: "ending";
      trip: Trip;
      from: "recording" | "interrupted";
      error: string | null;
    }
  | { name: "finished"; trip: Trip };

type Session = {
  trip: Trip | null;
  startedAt: number;
  watchId: number | null;
  fix: PositionFix | null;
  gpsError: string | null;
  motionWindow: ReturnType<typeof createMotionWindow>;
  motionStatus: MotionStatus;
  wakeLock: WakeLockSentinel | null;
  screenLock: ScreenLockStatus;
  buffer: TripPointPayload[];
  uploadedCount: number;
  uploadError: string | null;
  upload: Promise<boolean> | null;
  teardown: Array<() => void>;
};

const INITIAL_STATS: LiveStats = {
  elapsedSeconds: 0,
  fix: null,
  gpsLost: false,
  gpsError: null,
  motion: "waiting",
  screenLock: "held",
  uploadedCount: 0,
  pendingCount: 0,
  uploadError: null,
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readStoredTripId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_TRIP_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeTripId(id: string | null) {
  try {
    if (id) window.localStorage.setItem(ACTIVE_TRIP_STORAGE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_TRIP_STORAGE_KEY);
  } catch {
    // no storage just means no resume prompt next time
  }
}

function createSession(): Session {
  return {
    trip: null,
    startedAt: Date.now(),
    watchId: null,
    fix: null,
    gpsError: null,
    motionWindow: createMotionWindow(),
    motionStatus: "waiting",
    wakeLock: null,
    screenLock: "held",
    buffer: [],
    uploadedCount: 0,
    uploadError: null,
    upload: null,
    teardown: [],
  };
}

function readLiveStats(session: Session): LiveStats {
  const now = Date.now();
  return {
    elapsedSeconds: session.trip ? (now - session.startedAt) / 1000 : 0,
    fix: session.fix,
    gpsLost: !session.fix || now - session.fix.receivedAt > GPS_STALE_AFTER_MS,
    gpsError: session.gpsError,
    motion: session.motionStatus,
    screenLock: session.screenLock,
    uploadedCount: session.uploadedCount,
    pendingCount: session.buffer.length,
    uploadError: session.uploadError,
  };
}

function watchPosition(session: Session): Promise<PositionFix> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(
        new Error(
          "Timed out waiting for a GPS fix. Move somewhere with a clearer view of the sky and try again.",
        ),
      );
    }, FIRST_FIX_TIMEOUT_MS);

    session.watchId = navigator.geolocation.watchPosition(
      (position) => {
        session.fix = toPositionFix(position);
        session.gpsError = null;
        window.clearTimeout(timeout);
        resolve(session.fix);
      },
      (error) => {
        window.clearTimeout(timeout);
        reject(new Error(describeGeolocationError(error)));
        if (error.code === error.PERMISSION_DENIED) {
          session.gpsError = describeGeolocationError(error);
        }
      },
      { enableHighAccuracy: true, maximumAge: 0 },
    );
  });
}

function listenForMotion(session: Session, permission: MotionPermission) {
  if (permission === "denied") {
    session.motionStatus = "denied";
    return;
  }
  if (permission === "unsupported") {
    session.motionStatus = "unavailable";
    return;
  }

  const read = createLinearAccelerationReader();
  const onMotion = (event: DeviceMotionEvent) => {
    const reading = read(event);
    if (!reading) return;
    session.motionStatus = "active";
    session.motionWindow.add(reading);
  };

  const detect = window.setTimeout(() => {
    if (session.motionStatus === "waiting")
      session.motionStatus = "unavailable";
  }, MOTION_DETECT_WINDOW_MS);

  window.addEventListener("devicemotion", onMotion);
  session.teardown.push(() => {
    window.removeEventListener("devicemotion", onMotion);
    window.clearTimeout(detect);
  });
}

async function holdScreenAwake(session: Session) {
  if (!("wakeLock" in navigator)) {
    session.screenLock = "unavailable";
    return;
  }
  try {
    session.wakeLock = await navigator.wakeLock.request("screen");
    session.screenLock = "held";
  } catch {
    session.screenLock = "unavailable";
  }
}

function takeSample(session: Session) {
  const now = Date.now();
  const accel = session.motionWindow.drain();
  const fix = session.fix;

  if (!fix || now - fix.receivedAt > GPS_STALE_AFTER_MS) return;

  session.buffer.push({
    timestamp: now,
    lat: fix.lat,
    lng: fix.lng,
    speed: fix.speed,
    accelX: accel?.x ?? null,
    accelY: accel?.y ?? null,
    accelZ: accel?.z ?? null,
  });
}

function uploadBuffered(session: Session, keepalive = false): Promise<boolean> {
  if (session.upload) return session.upload;
  if (!session.trip || session.buffer.length === 0)
    return Promise.resolve(true);

  const batch = session.buffer.slice(
    0,
    keepalive ? MAX_POINTS_PER_KEEPALIVE_UPLOAD : MAX_POINTS_PER_UPLOAD,
  );

  session.upload = uploadPoints(session.trip.id, batch, { keepalive })
    .then(
      () => {
        session.buffer.splice(0, batch.length);
        session.uploadedCount += batch.length;
        session.uploadError = null;
        return true;
      },
      (error: unknown) => {
        session.uploadError = errorMessage(error);
        return false;
      },
    )
    .finally(() => {
      session.upload = null;
    });

  return session.upload;
}

async function uploadEverything(session: Session): Promise<boolean> {
  for (;;) {
    if (session.upload) await session.upload;
    if (session.buffer.length === 0) return true;
    if (!(await uploadBuffered(session))) return false;
  }
}

function stopSensors(session: Session) {
  if (session.watchId !== null) {
    navigator.geolocation.clearWatch(session.watchId);
    session.watchId = null;
  }
  session.teardown.forEach((fn) => fn());
  session.teardown = [];
  void session.wakeLock?.release();
  session.wakeLock = null;
}

async function closeTrip(tripId: string): Promise<Trip> {
  try {
    return await endTrip(tripId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      return (await getTrip(tripId)).trip;
    }
    throw error;
  }
}

export type StartOptions = {
  existing?: Trip;
  driverName?: string | null;
};

export function useTripRecorder() {
  const [phase, setPhase] = useState<RecorderPhase>({ name: "checking" });
  const [stats, setStats] = useState<LiveStats>(INITIAL_STATS);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function findUnfinishedTrip(): Promise<RecorderPhase> {
      const storedId = readStoredTripId();
      if (!storedId) return { name: "idle", error: null };

      try {
        const { trip } = await getTrip(storedId);
        if (trip.status === "active")
          return { name: "interrupted", trip, error: null };
        storeTripId(null);
        return { name: "idle", error: null };
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.status === 404 || error.status === 400)
        ) {
          storeTripId(null);
          return { name: "idle", error: null };
        }
        return {
          name: "idle",
          error: `Couldn't reach the server: ${errorMessage(error)}`,
        };
      }
    }

    void findUnfinishedTrip().then((next) => {
      if (!cancelled) setPhase(next);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (!session) return;
      stopSensors(session);
      void uploadBuffered(session, true);
      sessionRef.current = null;
    };
  }, []);

  const start = useCallback(({ existing, driverName = null }: StartOptions = {}) => {
    const motionPermission = requestMotionPermission();
    const session = createSession();
    sessionRef.current = session;
    setPhase({ name: "starting" });
    setStats(INITIAL_STATS);

    void (async () => {
      try {
        const [permission] = await Promise.all([
          motionPermission,
          watchPosition(session),
        ]);
        await holdScreenAwake(session);
        if (sessionRef.current !== session) {
          stopSensors(session);
          return;
        }

        const trip = existing ?? (await startTrip(driverName));
        if (sessionRef.current !== session) {
          stopSensors(session);
          return;
        }

        session.trip = trip;
        session.startedAt = new Date(trip.startTime).getTime();
        session.uploadedCount = trip.rawPointCount;
        storeTripId(trip.id);

        listenForMotion(session, permission);

        const sampler = window.setInterval(() => {
          takeSample(session);
          setStats(readLiveStats(session));
        }, SAMPLE_INTERVAL_MS);
        const uploader = window.setInterval(() => {
          void uploadBuffered(session).then(() =>
            setStats(readLiveStats(session)),
          );
        }, UPLOAD_INTERVAL_MS);

        const onVisibilityChange = () => {
          if (document.visibilityState === "hidden") {
            void uploadBuffered(session, true);
          } else if (!session.wakeLock || session.wakeLock.released) {
            void holdScreenAwake(session);
          }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);

        session.teardown.push(() => {
          window.clearInterval(sampler);
          window.clearInterval(uploader);
          document.removeEventListener("visibilitychange", onVisibilityChange);
        });

        setStats(readLiveStats(session));
        setPhase({ name: "recording", trip });
      } catch (error) {
        stopSensors(session);
        if (sessionRef.current !== session) return;
        sessionRef.current = null;
        setPhase(
          existing
            ? {
                name: "interrupted",
                trip: existing,
                error: errorMessage(error),
              }
            : { name: "idle", error: errorMessage(error) },
        );
      }
    })();
  }, []);

  const finish = useCallback(async (trip: Trip) => {
    const session = sessionRef.current;
    const from = session ? "recording" : "interrupted";
    setPhase({ name: "ending", trip, from, error: null });

    if (session) {
      stopSensors(session);
      const uploaded = await uploadEverything(session);
      setStats(readLiveStats(session));
      if (!uploaded) {
        const count = session.buffer.length;
        setPhase({
          name: "ending",
          trip,
          from,
          error: `${count} ${count === 1 ? "reading" : "readings"} haven't uploaded (${session.uploadError}). Check your connection and try again.`,
        });
        return;
      }
    }

    try {
      const ended = await closeTrip(trip.id);
      sessionRef.current = null;
      storeTripId(null);
      setPhase({ name: "finished", trip: ended });
    } catch (error) {
      setPhase({
        name: "ending",
        trip,
        from,
        error: `Couldn't end the trip: ${errorMessage(error)}`,
      });
    }
  }, []);

  const reset = useCallback(() => {
    setStats(INITIAL_STATS);
    setPhase({ name: "idle", error: null });
  }, []);

  return { phase, stats, start, finish, reset };
}
