"use client";

import { useCallback, useSyncExternalStore } from "react";

export const DRIVER_NAME_MAX_LENGTH = 40;

const STORAGE_KEY = "driver-scorecard:driver-name";
const listeners = new Set<() => void>();
let unsavedName = "";

function readName(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? unsavedName;
  } catch {
    return unsavedName;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useDriverName() {
  const name = useSyncExternalStore(subscribe, readName, () => "");

  const setName = useCallback((value: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      unsavedName = value;
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [name, setName] as const;
}
