"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, Input } from "@/components/ui";
import { api } from "@/lib/client";

type Encounter = {
  publicId: string;
  department: string;
  startedAt: string;
  clinician: { fullName: string };
};

export function PharmacyPrescribeForm() {
  const router = useRouter();
  const [patientPublicId, setPatientPublicId] = useState("PAT-00018492");
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [encounterPublicId, setEncounterPublicId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rx, setRx] = useState({
    medication: "",
    dose: "",
    route: "Oral",
    frequency: "",
    duration: "",
    instructions: "",
    quantity: 30,
  });

  async function loadEncounters() {
    setError(null);
    setMessage(null);
    try {
      const result = await api<{ encounters: Encounter[] }>(
        `/api/encounters?status=COMPLETED&patientPublicId=${encodeURIComponent(patientPublicId.trim())}`,
      );
      setEncounters(result.encounters);
      setEncounterPublicId(result.encounters[0]?.publicId ?? "");
      if (result.encounters.length === 0) {
        setError("No completed consultation was found for that patient. The patient must go through consultation first.");
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function submit() {
    setError(null);
    setMessage(null);
    try {
      const result = await api<{ conflicts?: { allergy: string; medication: string }[] }>("/api/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          encounterPublicId,
          notes: "Pharmacy-issued after completed consultation",
          items: [rx],
        }),
      });
      if (result.conflicts?.length) {
        setError(
          "Allergy conflict flagged: " +
            result.conflicts.map((c) => `${c.medication} vs ${c.allergy}`).join("; ") +
            ". The prescription was still recorded and requires review.",
        );
      } else {
        setMessage("Prescription added to the completed consultation.");
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <Alert tone="danger" title="Cannot issue prescription">{error}</Alert> : null}
      {message ? <Alert tone="success" title={message} /> : null}
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Patient ID">
          <Input value={patientPublicId} onChange={(e) => setPatientPublicId(e.target.value)} placeholder="PAT-00018492" />
        </Field>
        <Button type="button" variant="secondary" onClick={loadEncounters}>
          Load completed consultations
        </Button>
      </div>
      {encounters.length > 0 ? (
        <Field label="Completed consultation">
          <select
            className="h-9 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm"
            value={encounterPublicId}
            onChange={(e) => setEncounterPublicId(e.target.value)}
          >
            {encounters.map((item) => (
              <option key={item.publicId} value={item.publicId}>
                {item.publicId} · {item.department} · {item.clinician.fullName}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Medication">
          <Input value={rx.medication} onChange={(e) => setRx({ ...rx, medication: e.target.value })} />
        </Field>
        <Field label="Dose">
          <Input value={rx.dose} onChange={(e) => setRx({ ...rx, dose: e.target.value })} />
        </Field>
        <Field label="Route">
          <Input value={rx.route} onChange={(e) => setRx({ ...rx, route: e.target.value })} />
        </Field>
        <Field label="Frequency">
          <Input value={rx.frequency} onChange={(e) => setRx({ ...rx, frequency: e.target.value })} />
        </Field>
        <Field label="Duration">
          <Input value={rx.duration} onChange={(e) => setRx({ ...rx, duration: e.target.value })} />
        </Field>
        <Field label="Quantity">
          <Input type="number" value={rx.quantity} onChange={(e) => setRx({ ...rx, quantity: Number(e.target.value) })} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Instructions">
            <Input value={rx.instructions} onChange={(e) => setRx({ ...rx, instructions: e.target.value })} />
          </Field>
        </div>
      </div>
      <Button type="button" onClick={submit} disabled={!encounterPublicId}>
        Add prescription to consultation
      </Button>
    </div>
  );
}
