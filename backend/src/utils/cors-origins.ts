function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "").toLowerCase();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseAllowedOrigins(value: string): string[] {
  return value.split(",").map(normalizeOrigin).filter(Boolean);
}

export function createOriginMatcher(allowedOrigins: string[]) {
  const matchers = allowedOrigins.map((allowed) => {
    if (!allowed.includes("*")) {
      return (origin: string) => origin === allowed;
    }
    const pattern = new RegExp(
      `^${allowed.split("*").map(escapeRegex).join("[a-z0-9-]+")}$`,
    );
    return (origin: string) => pattern.test(origin);
  });

  return (origin: string): boolean => {
    const normalized = normalizeOrigin(origin);
    return matchers.some((matches) => matches(normalized));
  };
}
