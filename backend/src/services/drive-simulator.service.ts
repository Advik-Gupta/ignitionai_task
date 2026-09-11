import type { DetectionPoint } from "./event-detection.service";

export type DrivingStyle = "careful" | "average" | "aggressive";

type Range = readonly [number, number];

type StyleProfile = {
  cruiseKmh: Range;
  accelerationMps2: Range;
  brakingMps2: Range;
  turnSeconds: Range;
  turnKmh: Range;
  stopSeconds: Range;
  stopChance: number;
};

type DriveInput = {
  style: DrivingStyle;
  start: Date;
  durationSeconds: number;
  origin: { lat: number; lng: number };
  seed: number;
};

const STYLE_PROFILES: Record<DrivingStyle, StyleProfile> = {
  careful: {
    cruiseKmh: [35, 55],
    accelerationMps2: [1, 1.8],
    brakingMps2: [1.2, 2.4],
    turnSeconds: [6, 9],
    turnKmh: [14, 20],
    stopSeconds: [10, 45],
    stopChance: 0.4,
  },
  average: {
    cruiseKmh: [42, 66],
    accelerationMps2: [1.5, 2.5],
    brakingMps2: [1.8, 4.2],
    turnSeconds: [3.5, 7],
    turnKmh: [18, 34],
    stopSeconds: [15, 75],
    stopChance: 0.45,
  },
  aggressive: {
    cruiseKmh: [55, 88],
    accelerationMps2: [2.5, 3.8],
    brakingMps2: [4, 7.5],
    turnSeconds: [2.5, 4],
    turnKmh: [26, 36],
    stopSeconds: [20, 95],
    stopChance: 0.5,
  },
};

const CRUISE_SECONDS: Range = [25, 90];
const GPS_SPEED_NOISE_MPS = 0.25;
const STATIONARY_SPEED_NOISE_MPS = 0.15;
const ACCEL_NOISE_MPS2 = 0.3;
const METERS_PER_DEGREE_LAT = 111_320;
const MPS_TO_KMH = 3.6;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulateDrive({
  style,
  start,
  durationSeconds,
  origin,
  seed,
}: DriveInput): DetectionPoint[] {
  const random = createRandom(seed);
  const profile = STYLE_PROFILES[style];
  const points: DetectionPoint[] = [];

  let lat = origin.lat;
  let lng = origin.lng;
  let headingDegrees = Math.floor(random() * 4) * 90;
  let speed = 0;
  let elapsed = 0;

  const between = ([min, max]: Range) => min + (max - min) * random();
  const noise = (amplitude: number) => (random() * 2 - 1) * amplitude;
  const finished = () => elapsed >= durationSeconds;

  const tick = (targetSpeed: number, turnRateDegrees: number, rate: number) => {
    const previousSpeed = speed;
    speed =
      targetSpeed > speed
        ? Math.min(targetSpeed, speed + rate)
        : Math.max(targetSpeed, speed - rate);
    headingDegrees = (headingDegrees + turnRateDegrees + 360) % 360;

    const heading = toRadians(headingDegrees);
    const meters = (previousSpeed + speed) / 2;
    lat += (meters * Math.cos(heading)) / METERS_PER_DEGREE_LAT;
    lng +=
      (meters * Math.sin(heading)) /
      (METERS_PER_DEGREE_LAT * Math.cos(toRadians(lat)));

    const moving = speed > 0.2;
    points.push({
      timestamp: new Date(start.getTime() + elapsed * 1000),
      lat,
      lng,
      speed: moving
        ? Math.max(0, speed + noise(GPS_SPEED_NOISE_MPS))
        : Math.abs(noise(STATIONARY_SPEED_NOISE_MPS)),
      accelX: speed * toRadians(turnRateDegrees) + noise(ACCEL_NOISE_MPS2),
      accelY: speed - previousSpeed + noise(ACCEL_NOISE_MPS2),
      accelZ: noise(ACCEL_NOISE_MPS2),
    });
    elapsed += 1;
  };

  const changeSpeedTo = (targetSpeed: number, rate: number) => {
    while (Math.abs(speed - targetSpeed) > 0.01 && !finished()) {
      tick(targetSpeed, 0, rate);
    }
  };

  const hold = (seconds: number, turnRateDegrees = 0) => {
    for (let second = 0; second < seconds && !finished(); second++) {
      tick(speed, turnRateDegrees, 0);
    }
  };

  while (!finished()) {
    const braking = between(profile.brakingMps2);
    changeSpeedTo(
      between(profile.cruiseKmh) / MPS_TO_KMH,
      between(profile.accelerationMps2),
    );
    hold(Math.round(between(CRUISE_SECONDS)));

    if (random() < profile.stopChance) {
      changeSpeedTo(0, braking);
      hold(Math.round(between(profile.stopSeconds)));
    } else {
      changeSpeedTo(between(profile.turnKmh) / MPS_TO_KMH, braking);
      const turnSeconds = Math.max(1, Math.round(between(profile.turnSeconds)));
      const direction = random() < 0.5 ? -1 : 1;
      hold(turnSeconds, (direction * 90) / turnSeconds);
    }
  }

  return points;
}
