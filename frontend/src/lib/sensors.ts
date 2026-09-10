export type SensorSupport = {
  secureContext: boolean;
  geolocation: boolean;
  motion: boolean;
  motionNeedsPermission: boolean;
  wakeLock: boolean;
};

export type MotionPermission =
  | "granted"
  | "denied"
  | "not-required"
  | "unsupported";

export type PositionFix = {
  lat: number;
  lng: number;
  speed: number | null;
  accuracy: number;
  receivedAt: number;
};

export type Vector3 = { x: number; y: number; z: number };

type MotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

const GRAVITY_FILTER_ALPHA = 0.8;

export function detectSensorSupport(): SensorSupport {
  const motion = typeof DeviceMotionEvent !== "undefined";
  return {
    secureContext: window.isSecureContext,
    geolocation: "geolocation" in navigator,
    motion,
    motionNeedsPermission:
      motion &&
      typeof (DeviceMotionEvent as MotionEventWithPermission)
        .requestPermission === "function",
    wakeLock: "wakeLock" in navigator,
  };
}

export function requestMotionPermission(): Promise<MotionPermission> {
  if (typeof DeviceMotionEvent === "undefined")
    return Promise.resolve("unsupported");

  const request = (DeviceMotionEvent as MotionEventWithPermission)
    .requestPermission;
  if (typeof request !== "function") return Promise.resolve("not-required");

  return request().then(
    (result) => (result === "granted" ? "granted" : "denied"),
    () => "denied" as const,
  );
}

export function toPositionFix(position: GeolocationPosition): PositionFix {
  const { latitude, longitude, speed, accuracy } = position.coords;
  return {
    lat: latitude,
    lng: longitude,
    speed: speed !== null && speed >= 0 ? speed : null,
    accuracy,
    receivedAt: Date.now(),
  };
}

export function describeGeolocationError(
  error: GeolocationPositionError,
): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access was denied. Allow location for this site in your browser settings, then try again.";
    case error.POSITION_UNAVAILABLE:
      return "Your device couldn't determine its location. Check that location services are turned on.";
    case error.TIMEOUT:
      return "Timed out waiting for a GPS fix. Move somewhere with a clearer view of the sky and try again.";
    default:
      return error.message || "Location is unavailable.";
  }
}

export function createLinearAccelerationReader() {
  let gravity: Vector3 | null = null;

  return (event: DeviceMotionEvent): Vector3 | null => {
    const linear = event.acceleration;
    if (linear && linear.x !== null && linear.y !== null && linear.z !== null) {
      return { x: linear.x, y: linear.y, z: linear.z };
    }

    const raw = event.accelerationIncludingGravity;
    if (!raw || raw.x === null || raw.y === null || raw.z === null) return null;

    if (!gravity) {
      gravity = { x: raw.x, y: raw.y, z: raw.z };
    } else {
      gravity = {
        x:
          GRAVITY_FILTER_ALPHA * gravity.x + (1 - GRAVITY_FILTER_ALPHA) * raw.x,
        y:
          GRAVITY_FILTER_ALPHA * gravity.y + (1 - GRAVITY_FILTER_ALPHA) * raw.y,
        z:
          GRAVITY_FILTER_ALPHA * gravity.z + (1 - GRAVITY_FILTER_ALPHA) * raw.z,
      };
    }

    return { x: raw.x - gravity.x, y: raw.y - gravity.y, z: raw.z - gravity.z };
  };
}

export function createMotionWindow() {
  let sum: Vector3 = { x: 0, y: 0, z: 0 };
  let count = 0;

  return {
    add(reading: Vector3) {
      sum = {
        x: sum.x + reading.x,
        y: sum.y + reading.y,
        z: sum.z + reading.z,
      };
      count += 1;
    },
    drain(): Vector3 | null {
      if (count === 0) return null;
      const mean = { x: sum.x / count, y: sum.y / count, z: sum.z / count };
      sum = { x: 0, y: 0, z: 0 };
      count = 0;
      return mean;
    },
  };
}
