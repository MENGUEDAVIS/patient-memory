import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { requireSelfPatient } from "@/lib/self-patient";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { formatDateTime } from "@/lib/dates";

export default async function MeConsultations() {
  const user = await requirePageRole("/me/consultations");
  const patient = await requireSelfPatient(user);
  const encounters = await prisma.encounter.findMany({
    where: { patientId: patient.id },
    include: { clinician: true, diagnoses: true },
    orderBy: { startedAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="My consultations" description="Open any encounter to see notes, diagnoses and follow-up." />
      <div className="pm-card overflow-x-auto">
        {encounters.length === 0 ? (
          <EmptyState title="No consultations" body="No consultations are on file." />
        ) : (
          <table className="pm-table">
            <thead>
              <tr>
                <th>Encounter</th>
                <th>When</th>
                <th>Clinician</th>
                <th>Diagnosis</th>
                <th>Status</th>
                <th>Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {encounters.map((item) => (
                <tr key={item.id}>
                  <td className="tabular">
                    <Link className="underline" href={`/me/consultations/${item.publicId}`}>
                      {item.publicId}
                    </Link>
                  </td>
                  <td>{formatDateTime(item.startedAt)}</td>
                  <td>{item.clinician.fullName}</td>
                  <td>{item.diagnoses[0]?.description ?? "—"}</td>
                  <td>
                    <StatusBadge value={item.status} />
                  </td>
                  <td>{item.followUpNotes ?? (item.followUpAt ? formatDateTime(item.followUpAt) : "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
