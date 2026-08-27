import { requirePageUser } from "@/lib/guards";
import { AppShell } from "@/components/shell";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  return <AppShell user={user}>{children}</AppShell>;
}
