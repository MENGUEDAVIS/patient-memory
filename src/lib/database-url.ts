export function resolveDatabaseUrl(raw = process.env.DATABASE_URL) {
  if (!raw) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return raw;
  }
  parsed.searchParams.delete("channel_binding");
  if (!parsed.searchParams.get("sslmode")) {
    parsed.searchParams.set("sslmode", "require");
  }
  if (parsed.hostname.includes("-pooler") && parsed.searchParams.get("pgbouncer") !== "true") {
    parsed.searchParams.set("pgbouncer", "true");
  }
  if (!parsed.searchParams.get("connect_timeout")) {
    parsed.searchParams.set("connect_timeout", "15");
  }
  if (process.env.VERCEL && !parsed.searchParams.get("connection_limit")) {
    parsed.searchParams.set("connection_limit", "1");
  }
  return parsed.toString();
}
