"use client";

import { useCallback, useEffect, useState } from "react";

export type ResourceState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; error: unknown };

export function useApiResource<T>(load: () => Promise<T>) {
  const [state, setState] = useState<ResourceState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => {
        if (!cancelled) setState({ status: "ready", data });
      },
      (error: unknown) => {
        if (!cancelled) setState({ status: "error", error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [load, attempt]);

  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((current) => current + 1);
  }, []);

  return { state, reload };
}
