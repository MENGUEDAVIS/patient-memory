"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { api } from "@/lib/client";
import { useState } from "react";

export function PatientAuthorize({ consentId, requesterName }: { consentId: string; requesterName: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function decide(decision: "APPROVE" | "DENY") {
    setBusy(true);
    setError(null);
    try {
      await api("/api/me/authorizations", {
        method: "POST",
        body: JSON.stringify({ consentId, decision }),
      });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button disabled={busy} onClick={() => decide("APPROVE")}>
        Authorize {requesterName}
      </Button>
      <Button disabled={busy} variant="secondary" onClick={() => decide("DENY")}>
        Deny
      </Button>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
