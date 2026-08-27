function allowedOrigins(request: Request) {
  const origins = new Set<string>();
  if (process.env.APP_ORIGIN) origins.add(process.env.APP_ORIGIN.replace(/\/$/, ""));
  if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) {
    origins.add(`${proto}://${host}`);
    origins.add(`https://${host}`);
    origins.add(`http://${host}`);
  }
  origins.add("http://localhost:3000");
  return origins;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  if (!allowedOrigins(request).has(origin)) {
    throw new Error("CSRF_ORIGIN_MISMATCH");
  }
}

export function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
