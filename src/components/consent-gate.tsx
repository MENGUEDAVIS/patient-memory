"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";
import { api } from "@/lib/client";

export function ConsentGate({
  publicId,
  name,
}: {
  publicId: string;
  name: string;
}) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [simulated, setSimulated] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestAccess() {
    setLoading(true);
    setError(null);
    try {
      const result = await api<{ otp?: string }>("/api/patients/" + publicId + "/access", {
        method: "POST",
        body: JSON.stringify({ action: "request" }),
      });
      setSimulated(result.otp ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      await api("/api/patients/" + publicId + "/access", {
        method: "POST",
        body: JSON.stringify({ action: "confirm", otp }),
      });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function emergency() {
    setLoading(true);
    setError(null);
    try {
      await api("/api/patients/" + publicId + "/access", {
        method: "POST",
        body: JSON.stringify({ action: "emergency", reason }),
      });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Alert tone="warning" title="Patient authorization required.">
        Access to {name} ({publicId}) depends on an authenticated clinician, an approved hospital affiliation, and patient authorization. Payment is not used as a medical authorization mechanism.
      </Alert>
      {error ? <Alert tone="danger" title="Authorization failed">{error}</Alert> : null}
      <div className="pm-card space-y-3 p-5">
        <p className="pm-label">Simulated patient notification</p>
        <p className="text-sm text-[var(--muted)]">SIMULATED FOR MVP — the OTP is shown here instead of SMS.</p>
        {simulated ? (
          <p className="text-3xl font-semibold tabular tracking-[0.3em]">{simulated}</p>
        ) : (
          <Button onClick={requestAccess} disabled={loading}>
            Request patient authorization
          </Button>
        )}
        <Field label="Authorization code">
          <Input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} placeholder="482913" />
        </Field>
        <Button onClick={confirm} disabled={loading || otp.length !== 6}>
          Confirm access
        </Button>
      </div>
      <div className="pm-card space-y-3 p-5">
        <p className="font-medium">Emergency access (break glass)</p>
        <p className="text-sm text-[var(--muted)]">Requires a reason, the authenticated user, and always creates an audit event.</p>
        <Field label="Clinical reason">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Imminent clinical risk…" />
        </Field>
        <Button variant="danger" onClick={emergency} disabled={loading || reason.trim().length < 8}>
          Break glass
        </Button>
      </div>
    </div>
  );
}
