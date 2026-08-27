import { Suspense } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { RegisterForm } from "@/components/register-form";
import { PLANS } from "@/lib/plans";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const selected = plan && plan in PLANS ? plan : "HOSPITAL";
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-5 w-5 text-[var(--teal)]" />
            BilAn
          </Link>
          <Link href="/login" className="text-sm text-[var(--muted)] hover:underline">
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="pm-label">Facility onboarding</p>
        <h1 className="mt-2 text-3xl font-semibold">Register a hospital or clinic</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Creates a BilAn workspace, an administrator account, and the commercial bundle you select. DEMO DATA is not
          copied into a new facility.
        </p>
        <div className="mt-8 pm-card p-6">
          <Suspense>
            <RegisterForm defaultPlan={selected} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
