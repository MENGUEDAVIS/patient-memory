import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC = new Set(["/", "/login"]);

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) return null;
  return new TextEncoder().encode(value);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/health") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }
  if (PUBLIC.has(pathname)) return NextResponse.next();

  const token = request.cookies.get("pm_session")?.value;
  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const key = secret();
  if (!key) return NextResponse.next();
  try {
    const { payload } = await jwtVerify(token, key);
    const role = String(payload.role ?? "");
    const home =
      role === "HOSPITAL_ADMINISTRATOR"
        ? "admin"
        : role === "MEDICAL_DIRECTOR"
          ? "director"
          : role === "DOCTOR"
            ? "doctor"
            : role === "LABORATORY_OPERATOR"
              ? "lab"
              : role === "PHARMACIST"
                ? "pharmacy"
                : role === "PATIENT"
                  ? "me"
                  : "";
    const first = pathname.split("/")[1];
    const protectedRoots = ["admin", "director", "doctor", "lab", "pharmacy", "me"];
    if (home && protectedRoots.includes(first) && first !== home) {
      return NextResponse.redirect(new URL(`/${home}`, request.url));
    }
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
