"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";
import { api } from "@/lib/client";

type Encounter = {
  publicId: string;
  department: string;
  status: string;
  followUpAt: string | null;
  followUpNotes: string | null;
  clinicalNote: {
    chiefComplaint: string | null;
    historyOfPresentIllness: string | null;
    observations: string | null;
    assessment: string | null;
    isFinal: boolean;
  } | null;
  vitalSigns: {
    systolicMmHg: number | null;
    diastolicMmHg: number | null;
    heartRate: number | null;
    temperatureC: number | null;
    spo2: number | null;
    respiratoryRate: number | null;
  } | null;
  diagnoses: { id: string; description: string; code: string | null }[];
  prescriptions: { publicId: string; items: { medication: string }[] }[];
  labOrders: { publicId: string; testName: string; status: string }[];
};

export function ConsultationForm({ encounter }: { encounter: Encounter }) {
  const router = useRouter();
  const note = encounter.clinicalNote;
  const vitals = encounter.vitalSigns;
  const locked = Boolean(note?.isFinal);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    chiefComplaint: note?.chiefComplaint ?? "",
    historyOfPresentIllness: note?.historyOfPresentIllness ?? "",
    observations: note?.observations ?? "",
    assessment: note?.assessment ?? "",
    systolicMmHg: vitals?.systolicMmHg ?? "",
    diastolicMmHg: vitals?.diastolicMmHg ?? "",
    heartRate: vitals?.heartRate ?? "",
    temperatureC: vitals?.temperatureC ?? "",
    spo2: vitals?.spo2 ?? "",
    respiratoryRate: vitals?.respiratoryRate ?? "",
    followUpAt: encounter.followUpAt ? encounter.followUpAt.slice(0, 16) : "",
    followUpNotes: encounter.followUpNotes ?? "",
  });
  const [diagnosis, setDiagnosis] = useState({ description: "", code: "" });
  const [rx, setRx] = useState({
    medication: "",
    dose: "",
    route: "Oral",
    frequency: "",
    duration: "",
    instructions: "",
    quantity: 30,
  });
  const [testName, setTestName] = useState("");
  const [amend, setAmend] = useState({ field: "observations", next: "", reason: "" });

  function num(value: string | number) {
    if (value === "" || value == null) return null;
    return Number(value);
  }

  async function saveDraft() {
    setError(null);
    await api("/api/encounters/" + encounter.publicId, {
      method: "PATCH",
      body: JSON.stringify({
        encounterPublicId: encounter.publicId,
        ...form,
        systolicMmHg: num(form.systolicMmHg),
        diastolicMmHg: num(form.diastolicMmHg),
        heartRate: num(form.heartRate),
        temperatureC: num(form.temperatureC),
        spo2: num(form.spo2),
        respiratoryRate: num(form.respiratoryRate),
        followUpAt: form.followUpAt || null,
      }),
    });
    setMessage("Draft saved.");
    router.refresh();
  }

  async function finalize() {
    setError(null);
    try {
      await saveDraft();
      await api("/api/encounters/" + encounter.publicId + "?intent=finalize", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setMessage("Consultation finalized.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function addDiagnosis() {
    setError(null);
    try {
      await api("/api/diagnoses", {
        method: "POST",
        body: JSON.stringify({ encounterPublicId: encounter.publicId, ...diagnosis }),
      });
      setDiagnosis({ description: "", code: "" });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function addRx() {
    setError(null);
    try {
      const result = await api<{ conflicts: { allergy: string; medication: string }[] }>("/api/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          encounterPublicId: encounter.publicId,
          items: [rx],
        }),
      });
      if (result.conflicts?.length) {
        setError(
          "Allergy conflict flagged: " +
            result.conflicts.map((c) => `${c.medication} vs ${c.allergy}`).join("; ") +
            ". The prescription was recorded and requires human review.",
        );
      }
      setRx({ ...rx, medication: "", dose: "", frequency: "", duration: "", instructions: "" });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function addLab() {
    setError(null);
    try {
      await api("/api/laboratory/orders", {
        method: "POST",
        body: JSON.stringify({ encounterPublicId: encounter.publicId, testName }),
      });
      setTestName("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function submitAmend() {
    setError(null);
    try {
      await api("/api/encounters/" + encounter.publicId + "?intent=amend", {
        method: "POST",
        body: JSON.stringify(amend),
      });
      setMessage("Amendment recorded.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      {error ? <Alert tone="danger" title="Unable to update consultation">{error}</Alert> : null}
      {message ? <Alert tone="success" title={message} /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Chief complaint">
          <Textarea disabled={locked} value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })} />
        </Field>
        <Field label="History of present illness">
          <Textarea disabled={locked} value={form.historyOfPresentIllness} onChange={(e) => setForm({ ...form, historyOfPresentIllness: e.target.value })} />
        </Field>
        <Field label="Clinical observations">
          <Textarea disabled={locked} value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
        </Field>
        <Field label="Assessment">
          <Textarea disabled={locked} value={form.assessment} onChange={(e) => setForm({ ...form, assessment: e.target.value })} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Systolic"><Input disabled={locked} type="number" value={form.systolicMmHg} onChange={(e) => setForm({ ...form, systolicMmHg: e.target.value })} /></Field>
        <Field label="Diastolic"><Input disabled={locked} type="number" value={form.diastolicMmHg} onChange={(e) => setForm({ ...form, diastolicMmHg: e.target.value })} /></Field>
        <Field label="Heart rate"><Input disabled={locked} type="number" value={form.heartRate} onChange={(e) => setForm({ ...form, heartRate: e.target.value })} /></Field>
        <Field label="Temp °C"><Input disabled={locked} type="number" step="0.1" value={form.temperatureC} onChange={(e) => setForm({ ...form, temperatureC: e.target.value })} /></Field>
        <Field label="SpO2"><Input disabled={locked} type="number" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} /></Field>
        <Field label="RR"><Input disabled={locked} type="number" value={form.respiratoryRate} onChange={(e) => setForm({ ...form, respiratoryRate: e.target.value })} /></Field>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Follow-up">
          <Input disabled={locked} type="datetime-local" value={form.followUpAt} onChange={(e) => setForm({ ...form, followUpAt: e.target.value })} />
        </Field>
        <Field label="Follow-up instructions">
          <Input disabled={locked} value={form.followUpNotes} onChange={(e) => setForm({ ...form, followUpNotes: e.target.value })} />
        </Field>
      </div>
      {!locked ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              try {
                await saveDraft();
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            Save draft
          </Button>
          <Button type="button" onClick={finalize}>Finalize consultation</Button>
        </div>
      ) : (
        <Alert tone="info" title="This record is finalized.">
          Silent modification is not allowed. Use an amendment with a documented reason.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="pm-card space-y-3 p-4">
          <p className="font-medium">Diagnosis</p>
          {encounter.diagnoses.map((item) => (
            <p key={item.id} className="text-sm">{item.code ? `${item.code} — ` : ""}{item.description}</p>
          ))}
          {!locked ? (
            <>
              <Input placeholder="Description" value={diagnosis.description} onChange={(e) => setDiagnosis({ ...diagnosis, description: e.target.value })} />
              <Input placeholder="Code (optional)" value={diagnosis.code} onChange={(e) => setDiagnosis({ ...diagnosis, code: e.target.value })} />
              <Button type="button" variant="secondary" onClick={addDiagnosis}>Record diagnosis</Button>
            </>
          ) : null}
        </div>
        <div className="pm-card space-y-3 p-4">
          <p className="font-medium">Prescription</p>
          {encounter.prescriptions.map((item) => (
            <p key={item.publicId} className="text-sm">{item.publicId}: {item.items.map((i) => i.medication).join(", ")}</p>
          ))}
          {!locked ? (
            <>
              <Input placeholder="Medication" value={rx.medication} onChange={(e) => setRx({ ...rx, medication: e.target.value })} />
              <Input placeholder="Dose" value={rx.dose} onChange={(e) => setRx({ ...rx, dose: e.target.value })} />
              <Input placeholder="Frequency" value={rx.frequency} onChange={(e) => setRx({ ...rx, frequency: e.target.value })} />
              <Input placeholder="Duration" value={rx.duration} onChange={(e) => setRx({ ...rx, duration: e.target.value })} />
              <Input placeholder="Instructions" value={rx.instructions} onChange={(e) => setRx({ ...rx, instructions: e.target.value })} />
              <Button type="button" variant="secondary" onClick={addRx}>Issue prescription</Button>
            </>
          ) : null}
        </div>
        <div className="pm-card space-y-3 p-4">
          <p className="font-medium">Laboratory orders</p>
          {encounter.labOrders.map((item) => (
            <p key={item.publicId} className="text-sm">{item.publicId}: {item.testName} ({item.status.replace(/_/g, " ")})</p>
          ))}
          {!locked ? (
            <>
              <Input placeholder="Test name" value={testName} onChange={(e) => setTestName(e.target.value)} />
              <Button type="button" variant="secondary" onClick={addLab}>Order test</Button>
            </>
          ) : null}
        </div>
      </div>

      {locked ? (
        <div className="pm-card space-y-3 p-4">
          <p className="font-medium">Amendment</p>
          <Field label="Field">
            <Input value={amend.field} onChange={(e) => setAmend({ ...amend, field: e.target.value })} />
          </Field>
          <Field label="Corrected value">
            <Textarea value={amend.next} onChange={(e) => setAmend({ ...amend, next: e.target.value })} />
          </Field>
          <Field label="Reason">
            <Textarea value={amend.reason} onChange={(e) => setAmend({ ...amend, reason: e.target.value })} />
          </Field>
          <Button type="button" variant="secondary" onClick={submitAmend}>Record amendment</Button>
        </div>
      ) : null}
    </div>
  );
}
