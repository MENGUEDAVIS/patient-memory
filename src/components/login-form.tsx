"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Field, Input } from "@/components/ui";
import { api } from "@/lib/client";

const ACCOUNTS = [
  { email: "admin@demo-hospital.com", password: "DemoAdmin123!", role: "Administrator" },
  { email: "doctor@demo-hospital.com", password: "DemoDoctor123!", role: "Doctor" },
  { email: "lab@demo-hospital.com", password: "DemoLab123!", role: "Laboratory" },
  { email: "pharmacy@demo-hospital.com", password: "DemoPharmacy123!", role: "Pharmacist" },
  { email: "patient@demo-hospital.com", password: "DemoPatient123!", role: "Patient (John Doe)" },
];

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("doctor@demo-hospital.com");
  const [password, setPassword] = useState("DemoDoctor123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api<{ redirect: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push(params.get("next") || result.redirect);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {error ? <Alert tone="danger" title="Sign-in failed">{error}</Alert> : null}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        </Field>
        <Field label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </Field>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div>
        <p className="pm-label mb-2">Demo accounts</p>
        <div className="space-y-1">
          {ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-50"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
              }}
            >
              <span>{account.role}</span>
              <span className="text-xs text-[var(--muted)]">{account.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
