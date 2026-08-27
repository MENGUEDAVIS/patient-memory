"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/client";

export function StartConsultation({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [department, setDepartment] = useState("Internal Medicine");
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    try {
      const result = await api<{ encounter: { publicId: string } }>("/api/encounters", {
        method: "POST",
        body: JSON.stringify({ patientPublicId: publicId, department }),
      });
      router.push("/doctor/consultations/" + result.encounter.publicId);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Field label="Department">
        <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
      </Field>
      <Button onClick={start}>Start consultation</Button>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}

export function PatientSearch({ basePath }: { basePath: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  function go(event: React.FormEvent) {
    event.preventDefault();
    router.push(`${basePath}?q=${encodeURIComponent(q)}`);
  }
  return (
    <form onSubmit={go} className="flex gap-2">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Patient ID, name or phone" />
      <Button type="submit">Search</Button>
    </form>
  );
}

export function LabResultForm({ orderPublicId }: { orderPublicId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ value: "", unit: "", referenceRange: "", interpretation: "", isCritical: false, fileName: "" });

  async function submit() {
    setError(null);
    try {
      await api("/api/laboratory/results", {
        method: "POST",
        body: JSON.stringify({ orderPublicId, ...form }),
      });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function setStatus(status: string) {
    await api("/api/laboratory/orders", { method: "PATCH", body: JSON.stringify({ orderPublicId, status }) });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? <Alert tone="danger" title="Result not saved">{error}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setStatus("SAMPLE_COLLECTED")}>Sample collected</Button>
        <Button variant="secondary" onClick={() => setStatus("PROCESSING")}>Processing</Button>
      </div>
      <Field label="Value"><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field>
      <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
      <Field label="Reference range"><Input value={form.referenceRange} onChange={(e) => setForm({ ...form, referenceRange: e.target.value })} /></Field>
      <Field label="Interpretation"><Textarea value={form.interpretation} onChange={(e) => setForm({ ...form, interpretation: e.target.value })} /></Field>
      <Field label="Attachment file name (simulated)">
        <Input value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} placeholder="troponin.pdf" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isCritical} onChange={(e) => setForm({ ...form, isCritical: e.target.checked })} />
        Mark as critical
      </label>
      <Button onClick={submit}>Enter result</Button>
    </div>
  );
}

export function ReviewLabButton({ orderPublicId }: { orderPublicId: string }) {
  const router = useRouter();
  return (
    <Button
      onClick={async () => {
        await api("/api/laboratory/review", { method: "POST", body: JSON.stringify({ orderPublicId }) });
        router.refresh();
      }}
    >
      Review result
    </Button>
  );
}

export function DispenseForm({ prescriptionPublicId, remaining }: { prescriptionPublicId: string; remaining: number }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(remaining);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Field label="Quantity">
        <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
      </Field>
      <Button
        onClick={async () => {
          setError(null);
          try {
            await api("/api/pharmacy/dispense", {
              method: "POST",
              body: JSON.stringify({ prescriptionPublicId, quantity }),
            });
            router.refresh();
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        Dispense
      </Button>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}

export function StaffDecision({ membershipId }: { membershipId: string }) {
  const router = useRouter();
  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        onClick={async () => {
          await api("/api/staff", {
            method: "POST",
            body: JSON.stringify({ membershipId, status: "APPROVED", verificationStatus: "VERIFIED" }),
          });
          router.refresh();
        }}
      >
        Approve
      </Button>
      <Button
        variant="danger"
        onClick={async () => {
          await api("/api/staff", {
            method: "POST",
            body: JSON.stringify({ membershipId, status: "REJECTED", verificationStatus: "REJECTED" }),
          });
          router.refresh();
        }}
      >
        Reject
      </Button>
    </div>
  );
}

export function InsuranceForm() {
  const [result, setResult] = useState<{ decision: string; reason: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientPublicId: "PAT-00018492",
    hospitalCode: "SLM",
    encounterPublicId: "",
    claimId: "CLM-DEMO-001",
  });
  return (
    <div className="max-w-xl space-y-3">
      <p className="text-xs text-[var(--muted)]">SIMULATED FOR MVP — no clinical details are returned.</p>
      {error ? <Alert tone="danger" title="Verification failed">{error}</Alert> : null}
      <Field label="Patient ID"><Input value={form.patientPublicId} onChange={(e) => setForm({ ...form, patientPublicId: e.target.value })} /></Field>
      <Field label="Hospital code"><Input value={form.hospitalCode} onChange={(e) => setForm({ ...form, hospitalCode: e.target.value })} /></Field>
      <Field label="Encounter ID"><Input value={form.encounterPublicId} onChange={(e) => setForm({ ...form, encounterPublicId: e.target.value })} /></Field>
      <Field label="Claim ID"><Input value={form.claimId} onChange={(e) => setForm({ ...form, claimId: e.target.value })} /></Field>
      <Button
        onClick={async () => {
          setError(null);
          try {
            const data = await api<{ decision: string; reason: string }>("/api/insurance/verify", {
              method: "POST",
              body: JSON.stringify(form),
            });
            setResult(data);
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        Verify
      </Button>
      {result ? (
        <Alert tone={result.decision === "VERIFIED" ? "success" : result.decision === "NOT_VERIFIED" ? "danger" : "warning"} title={result.decision}>
          {result.reason}
        </Alert>
      ) : null}
    </div>
  );
}

export function PatientRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    sex: "MALE",
    phone: "",
    email: "",
    addressLine: "",
    city: "",
    bloodGroup: "O+",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "Spouse",
    allergy: "",
    condition: "",
  });
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        try {
          const result = await api<{ patient: { publicId: string } }>("/api/patients", {
            method: "POST",
            body: JSON.stringify({
              ...form,
              allergies: form.allergy ? [{ substance: form.allergy, reaction: "Documented", severity: "MODERATE" }] : [],
              conditions: form.condition ? [{ name: form.condition }] : [],
            }),
          });
          router.push("/admin/patients/" + result.patient.publicId);
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      {error ? <div className="md:col-span-2"><Alert tone="danger" title="Registration failed">{error}</Alert></div> : null}
      {Object.entries({
        firstName: "First name",
        lastName: "Last name",
        dateOfBirth: "Date of birth",
        phone: "Phone",
        email: "Email",
        addressLine: "Address",
        city: "City",
        bloodGroup: "Blood group",
        emergencyName: "Emergency contact",
        emergencyPhone: "Emergency phone",
        emergencyRelation: "Relation",
        allergy: "Allergy (optional)",
        condition: "Chronic condition (optional)",
      }).map(([key, label]) => (
        <Field key={key} label={label}>
          <Input
            type={key === "dateOfBirth" ? "date" : key === "email" ? "email" : "text"}
            value={(form as Record<string, string>)[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            required={!label.includes("optional")}
          />
        </Field>
      ))}
      <Field label="Sex">
        <Select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
          <option>MALE</option>
          <option>FEMALE</option>
          <option>OTHER</option>
          <option>UNKNOWN</option>
        </Select>
      </Field>
      <div className="md:col-span-2">
        <Button type="submit">Register patient</Button>
      </div>
    </form>
  );
}

export function BillingConfigForm({
  config,
}: {
  config: { monthlyFeeUsd: number; encounterFeeUsd: number; onboardingFeeUsd: number };
}) {
  const router = useRouter();
  const [form, setForm] = useState(config);
  return (
    <div className="grid max-w-xl gap-3">
      <Field label="Monthly platform fee (USD)">
        <Input type="number" value={form.monthlyFeeUsd} onChange={(e) => setForm({ ...form, monthlyFeeUsd: Number(e.target.value) })} />
      </Field>
      <Field label="Per encounter fee (USD)">
        <Input type="number" step="0.01" value={form.encounterFeeUsd} onChange={(e) => setForm({ ...form, encounterFeeUsd: Number(e.target.value) })} />
      </Field>
      <Field label="Onboarding fee (USD)">
        <Input type="number" value={form.onboardingFeeUsd} onChange={(e) => setForm({ ...form, onboardingFeeUsd: Number(e.target.value) })} />
      </Field>
      <Button
        onClick={async () => {
          await api("/api/billing", { method: "PATCH", body: JSON.stringify(form) });
          router.refresh();
        }}
      >
        Save commercial configuration
      </Button>
    </div>
  );
}

export function AuditFilter() {
  const router = useRouter();
  const [form, setForm] = useState({ actor: "", patient: "", activity: "", department: "", from: "", to: "" });
  return (
    <form
      className="grid gap-2 md:grid-cols-6"
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        Object.entries(form).forEach(([k, v]) => {
          if (v) params.set(k, v);
        });
        const base = window.location.pathname.startsWith("/director") ? "/director/audit" : "/admin/audit";
        router.push(base + "?" + params.toString());
      }}
    >
      <Input placeholder="Doctor" value={form.actor} onChange={(e) => setForm({ ...form, actor: e.target.value })} />
      <Input placeholder="Patient" value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} />
      <Input placeholder="Activity" value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} />
      <Input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
      <Input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
      <Button type="submit">Filter</Button>
    </form>
  );
}
