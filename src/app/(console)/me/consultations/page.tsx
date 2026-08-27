import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { formatDateTime } from "@/lib/dates";
import { redirect } from "next/navigation";

export default async function MeConsultations() {
  const user = await requirePageRole("/me/consultations");
  const patient = await prisma.patient.findFirst({ where: { userId: user.id } });
  if (!patient) redirect("/login");
  const encounters = await prisma.encounter.findMany({
    where: { patientId: patient.id },
    include: { clinician: true, diagnoses: true },
    orderBy: { startedAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="My consultations" />
      <div className="pm-card overflow-x-auto">
        {encounters.length === 0 ? <EmptyState title="No consultations" body="No consultations are on file." /> : (
          <table className="pm-table">
            <thead><tr><th>When</th><th>Clinician</th><th>Diagnosis</th><th>Status</th><th>Follow-up</th></tr></thead>
            <tbody>
              {encounters.map((item) => (
                <tr key={item.id}>
                  <td>{formatDateTime(item.startedAt)}</td>
                  <td>{item.clinician.fullName}</td>
                  <td>{item.diagnoses[0]?.description ?? "—"}</td>
                  <td><StatusBadge value={item.status} /></td>
                  <td>{item.followUpNotes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
