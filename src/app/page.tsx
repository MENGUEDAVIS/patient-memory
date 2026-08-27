import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/rbac";

export default async function Home() {
  const user = await readSession();
  if (user) redirect(ROLE_HOME[user.role]);
  redirect("/login");
}
