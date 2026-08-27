import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, EmptyState } from "@/components/ui";
import { AuditFilter } from "@/components/actions";
import { formatDateTime } from "@/lib/dates";
import { roleLabel } from "@/lib/rbac";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string; patient?: string; activity?: string; department?: string; from?: string; to?: string }>;
}) {
  const user = await requirePageRole("/admin/audit");
  const hospitalId = await hospitalScope(user);
  const filters = await searchParams;
  const where: Prisma.AuditEventWhereInput = { hospitalId };
  if (filters.actor) where.actorName = { contains: filters.actor };
  if (filters.activity) where.activity = { contains: filters.activity };
  if (filters.department) where.department = { contains: filters.department };
  if (filters.patient) {
    where.patient = {
      OR: [
        { publicId: { contains: filters.patient } },
        { lastName: { contains: filters.patient } },
      ],
    };
  }
  if (filters.from || filters.to) {
    where.createdAt = { gte: filters.from ? new Date(filters.from) : undefined, lte: filters.to ? new Date(filters.to) : undefined };
  }
  const events = await prisma.auditEvent.findMany({
    where,
    include: { patient: true, encounter: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div className="space-y-4">
      <PageHeader title="Clinical Accountability" description="Who accessed a record, when, and what they did." />
      <AuditFilter />
      <div className="pm-card overflow-x-auto">
        {events.length === 0 ? <EmptyState title="No audit events" body="No audit events match the selected filters." /> : (
          <table className="pm-table">
            <thead>
              <tr><th>Event</th><th>Who</th><th>When</th><th>What</th><th>Patient</th><th>Encounter</th><th>Dept</th></tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="tabular">{event.publicId}</td>
                  <td>{event.actorName}<br /><span className="text-xs text-[var(--muted)]">{roleLabel(event.actorRole)}</span></td>
                  <td>{formatDateTime(event.createdAt)}</td>
                  <td>{event.activity.replace(/_/g, " ")}</td>
                  <td className="tabular">{event.patient?.publicId ?? "—"}</td>
                  <td className="tabular">{event.encounter?.publicId ?? "—"}</td>
                  <td>{event.department ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
