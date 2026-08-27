import { readSession } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/rbac";
import { LandingPage } from "@/components/landing-page";
import { landingAggregates } from "@/lib/aggregates";

export default async function Home() {
  const user = await readSession();
  let stats = null;
  try {
    stats = await landingAggregates();
  } catch {
    stats = null;
  }
  return <LandingPage signedIn={Boolean(user)} home={user ? ROLE_HOME[user.role] : "/login"} stats={stats} />;
}
