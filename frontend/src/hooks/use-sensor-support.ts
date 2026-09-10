"use client";

import { useSyncExternalStore } from "react";
import { detectSensorSupport, type SensorSupport } from "@/lib/sensors";

let cached: SensorSupport | null = null;

function getSnapshot(): SensorSupport {
  cached ??= detectSensorSupport();
  return cached;
}

function subscribe() {
  return () => {};
}

export function useSensorSupport(): SensorSupport | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
