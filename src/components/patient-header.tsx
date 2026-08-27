import { yearsBetween } from "@/lib/ids";
import { Badge } from "@/components/ui";
import { StatusBadge } from "@/components/status";

type Patient = {
  publicId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string;
  sex: string;
  bloodGroup: string;
  allergies: { substance: string; severity: string; active: boolean }[];
};

export function PatientHeader({ patient, emergency }: { patient: Patient; emergency?: boolean }) {
  const age = yearsBetween(new Date(patient.dateOfBirth));
  const allergies = patient.allergies.filter((a) => a.active);
  return (
    <div className="pm-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="pm-label">Patient header</p>
          <h2 className="mt-1 text-2xl font-semibold">
            {patient.firstName} {patient.lastName}
          </h2>
          <p className="tabular text-sm text-[var(--muted)]">{patient.publicId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {emergency ? <Badge tone="danger">EMERGENCY ACCESS</Badge> : null}
          <Badge>{age} yrs</Badge>
          <Badge>{patient.sex}</Badge>
          <Badge tone="info">{patient.bloodGroup}</Badge>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {allergies.length === 0 ? (
          <span className="text-sm text-[var(--muted)]">No recorded allergies.</span>
        ) : (
          allergies.map((allergy) => (
            <span key={allergy.substance} className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-sm text-rose-800">
              {allergy.substance}
              <StatusBadge value={allergy.severity} />
            </span>
          ))
        )}
      </div>
      {allergies.some((a) => a.severity === "CRITICAL") ? (
        <p className="mt-3 text-sm font-semibold text-[var(--danger)]">Critical alert: documented anaphylaxis risk.</p>
      ) : null}
    </div>
  );
}
