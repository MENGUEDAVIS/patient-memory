import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { requireSelfPatient } from "@/lib/self-patient";
import { PageHeader, EmptyState, Alert } from "@/components/ui";
import { formatDateTime } from "@/lib/dates";
import { roleLabel } from "@/lib/rbac";

export default async function MeAccess() {
  const user = await requirePageRole("/me/access");
  const patient = await requireSelfPatient(user);
  const logs = await prisma.accessLog.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const users = await prisma.user.findMany({ where: { id: { in: logs.map((l) => l.userId) } } });
  return (
    <div className="space-y-4">
      <PageHeader
        title="Who accessed my record?"
        description="Every opening of your clinical record is listed here: who, when, and what they did."
      />
      <Alert tone="info" title="You always have access to your own dossier.">
        Clinicians need your authorization (or a logged emergency break-glass) before they can open it.
      </Alert>
      <div className="pm-card overflow-x-auto">
        {logs.length === 0 ? (
          <EmptyState title="No access events" body="No access history is recorded yet." />
        ) : (
          <table className="pm-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Role</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const actor = users.find((u) => u.id === log.userId);
                return (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>{actor?.fullName ?? "Unknown"}</td>
                    <td>{actor ? roleLabel(actor.role) : "—"}</td>
                    <td>
                      {log.activity.replace(/_/g, " ")}
                      {log.emergency ? " (emergency)" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
