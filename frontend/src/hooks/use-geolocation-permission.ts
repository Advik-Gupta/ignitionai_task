"use client";

import { useEffect, useState } from "react";

export type LocationPermission = "granted" | "prompt" | "denied" | "unknown";

export function useGeolocationPermission(): LocationPermission {
  const [permission, setPermission] = useState<LocationPermission>("unknown");

  useEffect(() => {
    if (!("permissions" in navigator)) return;

    let cancelled = false;
    let status: PermissionStatus | null = null;

    const sync = () => {
      if (status && !cancelled) setPermission(status.state);
    };

    navigator.permissions.query({ name: "geolocation" }).then(
      (result) => {
        status = result;
        sync();
        result.addEventListener("change", sync);
      },
      () => {
        if (!cancelled) setPermission("unknown");
      },
    );

    return () => {
      cancelled = true;
      status?.removeEventListener("change", sync);
    };
  }, []);

  return permission;
}
