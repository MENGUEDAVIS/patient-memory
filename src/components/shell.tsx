"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { NAV, ROLE_HOME, roleLabel } from "@/lib/rbac";
import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/components/ui";

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<{ id: string; title: string; body: string; readAt: string | null }[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setNotes(data.notifications ?? []))
      .catch(() => undefined);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const items = NAV[user.role];
  const unread = notes.filter((n) => !n.readAt).length;

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-[var(--navy)] text-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <Shield className="h-5 w-5 text-teal-300" />
          <div>
            <p className="text-sm font-semibold tracking-wide">Patient Memory</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">Clinical trust</p>
          </div>
        </div>
        <nav className="space-y-0.5 p-3">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== ROLE_HOME[user.role] && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm",
                  active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-white/10 p-4 text-xs text-white/60">
          Your medical history should follow you — not your file.
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--line)] bg-white/95 px-4 backdrop-blur">
          <button className="rounded-md p-2 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-[var(--muted)] lg:block">
            {user.isDemo ? <span className="mr-2 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">DEMO DATA</span> : null}
            Hospital EHR & Clinical Intelligence
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="h-4 w-4 text-[var(--muted)]" />
              {unread > 0 ? <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--danger)]" /> : null}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-[var(--muted)]">{roleLabel(user.role)}</p>
            </div>
            <button onClick={logout} className="rounded-md p-2 text-[var(--muted)] hover:bg-slate-100" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        {user.isDemo ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
            DEMO DATA — synthetic records only. Demo accounts are clearly marked and must not be used with real patients.
          </div>
        ) : null}
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
