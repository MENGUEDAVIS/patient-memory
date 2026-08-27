import { redirect } from "next/navigation";
import { readSession, type SessionUser } from "@/lib/auth/session";
import { pathAllowed, ROLE_HOME } from "@/lib/rbac";

export async function requirePageUser(): Promise<SessionUser> {
  const user = await readSession();
  if (!user) redirect("/login");
  return user;
}

export async function requirePageRole(pathname: string): Promise<SessionUser> {
  const user = await requirePageUser();
  if (pathAllowed(user.role, pathname)) return user;
  if (user.role === "MEDICAL_DIRECTOR" && pathname.startsWith("/admin/")) return user;
  redirect(ROLE_HOME[user.role]);
}
