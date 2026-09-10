export const SPEED_LIMIT_KMH = 60;

export const DETECTION = {
  maxSampleGapSeconds: 3,
  harshBraking: {
    minDecelerationMps2: 3,
    severeDecelerationMps2: 8,
    minSpeedMps: 3,
  },
  sharpTurn: {
    minLateralAccelMps2: 3.5,
    severeLateralAccelMps2: 7,
    minSpeedMps: 3,
  },
  overSpeeding: {
    limitKmh: SPEED_LIMIT_KMH,
    severeSpeedKmh: SPEED_LIMIT_KMH + 40,
    minDurationSeconds: 2,
  },
  idle: {
    maxSpeedMps: 1,
    minDurationSeconds: 60,
    severeDurationSeconds: 300,
  },
} as const;
