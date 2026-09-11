const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env.local.",
  );
}

export const NETWORK_ERROR_STATUS = 0;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function networkErrorMessage(): string {
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  return offline
    ? "You're offline. Reconnect to the internet and try again."
    : "Can't reach the server. Check your connection and try again.";
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    throw new ApiError(networkErrorMessage(), NETWORK_ERROR_STATUS);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new ApiError(
      body?.error ?? `The server returned an error (${response.status}).`,
      response.status,
    );
  }

  return (await response.json()) as T;
}
