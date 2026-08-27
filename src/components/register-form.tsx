"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import { api } from "@/lib/client";
import { PLANS, type PlanCode } from "@/lib/plans";

export function RegisterForm({ defaultPlan }: { defaultPlan: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    facilityKind: "HOSPITAL",
    name: "",
    city: "",
    country: "CM",
    adminFullName: "",
    adminEmail: "",
    adminPassword: "",
    plan: (defaultPlan in PLANS ? defaultPlan : "HOSPITAL") as PlanCode,
  });

  const plan = PLANS[form.plan];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api<{ redirect: string }>("/api/hospitals/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      router.push(result.redirect);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      {error ? (
        <div className="md:col-span-2">
          <Alert tone="danger" title="Registration failed">
            {error}
          </Alert>
        </div>
      ) : null}
      <Field label="Facility type">
        <Select value={form.facilityKind} onChange={(e) => setForm({ ...form, facilityKind: e.target.value })}>
          <option value="HOSPITAL">Hospital</option>
          <option value="CLINIC">Clinic</option>
        </Select>
      </Field>
      <Field label="Commercial bundle">
        <Select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as PlanCode })}>
          {Object.values(PLANS).map((item) => (
            <option key={item.code} value={item.code}>
              {item.name} — ${item.monthlyFeeUsd}/mo
            </option>
          ))}
        </Select>
      </Field>
      <div className="md:col-span-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-[var(--muted)]">
        {plan.name}: ${plan.onboardingFeeUsd.toLocaleString()} onboarding · ${plan.monthlyFeeUsd}/month · $
        {plan.encounterFeeUsd.toFixed(2)} per encounter.
      </div>
      <Field label="Facility name">
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="St. Luke Memorial Hospital" />
      </Field>
      <Field label="City">
        <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
      </Field>
      <Field label="Country">
        <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
      </Field>
      <Field label="Administrator name">
        <Input value={form.adminFullName} onChange={(e) => setForm({ ...form, adminFullName: e.target.value })} required />
      </Field>
      <Field label="Administrator email">
        <Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} required />
      </Field>
      <Field label="Password">
        <Input type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} required minLength={8} />
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating workspace…" : "Create facility workspace"}
        </Button>
      </div>
    </form>
  );
}
