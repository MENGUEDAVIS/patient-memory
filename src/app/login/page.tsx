import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { readSession } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/rbac";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const user = await readSession();
  if (user) redirect(ROLE_HOME[user.role]);
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-[var(--navy)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-teal-300" />
          <span className="text-lg font-semibold">Patient Memory</span>
        </div>
        <div className="max-w-lg space-y-4">
          <p className="text-sm uppercase tracking-[0.18em] text-teal-200">Hospital EHR & Clinical Intelligence</p>
          <h1 className="text-4xl font-semibold leading-tight">Your medical history should follow you — not your file.</h1>
          <p className="text-white/70">
            We give hospitals a complete digital memory of every patient and a transparent record of every clinical
            interaction—reducing clinical risk while protecting revenue and accountability.
          </p>
        </div>
        <p className="text-xs text-white/40">DEMO DATA only. Never use real patient information in this environment.</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div>
            <p className="pm-label">Sign in</p>
            <h2 className="mt-1 text-2xl font-semibold">Clinical workspace</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Role-based access. All sensitive actions are audited.</p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
