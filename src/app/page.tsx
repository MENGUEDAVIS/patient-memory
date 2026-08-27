import { readSession } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/rbac";
import { LandingPage } from "@/components/landing-page";

export default async function Home() {
  const user = await readSession();
  return <LandingPage signedIn={Boolean(user)} home={user ? ROLE_HOME[user.role] : "/login"} />;
}
