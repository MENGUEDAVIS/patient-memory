import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, Stat, Card } from "@/components/ui";
import { DonutChart, MixBarChart, VolumeChart } from "@/components/charts";
import { copilotBriefing } from "@/lib/intelligence";
import { hospitalAggregates } from "@/lib/aggregates";
import { startOfDay, addDays } from "@/lib/dates";

export default async function AdminDashboard() {
  const user = await requirePageRole("/admin");
  const hospitalId = await hospitalScope(user);
  const today = startOfDay();
  const [
    patients,
    consultations,
    activeDoctors,
    labs,
    prescriptions,
    completed,
    incomplete,
    critical,
    weekly,
    monthly,
    copilot,
    aggregates,
  ] = await Promise.all([
    prisma.patient.count({ where: { hospitalId } }),
    prisma.encounter.count({ where: { hospitalId, startedAt: { gte: today } } }),
    prisma.hospitalStaffMembership.count({ where: { hospitalId, role: "DOCTOR", status: "APPROVED" } }),
    prisma.laboratoryOrder.count({ where: { hospitalId, orderedAt: { gte: today } } }),
    prisma.prescription.count({ where: { hospitalId, issuedAt: { gte: today } } }),
    prisma.encounter.count({ where: { hospitalId, status: "COMPLETED", completedAt: { gte: today } } }),
    prisma.encounter.count({ where: { hospitalId, status: { in: ["DRAFT", "IN_PROGRESS"] } } }),
    prisma.laboratoryOrder.count({ where: { hospitalId, isCritical: true, reviewedAt: null, result: { isNot: null } } }),
    prisma.encounter.count({ where: { hospitalId, startedAt: { gte: addDays(today, -7) } } }),
    prisma.encounter.count({ where: { hospitalId, startedAt: { gte: addDays(today, -30) } } }),
    copilotBriefing(hospitalId),
    hospitalAggregates(hospitalId),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Hospital administrator"
        title="Executive dashboard"
        description="Today's clinical activity, accountability signals, and patient flow."
      />
      <div className="mb-6 pm-card p-5">
        <p className="pm-label">What should I know today?</p>
        <p className="mt-1 text-xs text-[var(--muted)]">Clinical and Operational Decision Support — requires human review.</p>
        <dl className="mt-4 grid gap-3 md:grid-cols-2">
          <div><dt className="pm-label">Clinical</dt><dd>{copilot.clinical}</dd></div>
          <div><dt className="pm-label">Operations</dt><dd>{copilot.operations}</dd></div>
          <div><dt className="pm-label">Documentation</dt><dd>{copilot.documentation}</dd></div>
          <div><dt className="pm-label">Pharmacy</dt><dd>{copilot.pharmacy}</dd></div>
        </dl>
        <p className="mt-4 text-sm"><span className="font-semibold">Recommendation: </span>{copilot.recommendation}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total patients" value={patients} />
        <Stat label="Consultations today" value={consultations} />
        <Stat label="Active doctors" value={activeDoctors} />
        <Stat label="Laboratory tests today" value={labs} />
        <Stat label="Prescriptions today" value={prescriptions} />
        <Stat label="Completed encounters" value={completed} />
        <Stat label="Incomplete encounters" value={incomplete} />
        <Stat label="Critical results awaiting review" value={critical} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="pm-label mb-3">Patient flow (30 days)</p>
          <VolumeChart data={aggregates.volume} />
        </Card>
        <Card>
          <p className="pm-label">Volume</p>
          <p className="mt-3 text-sm">Weekly: <strong>{weekly}</strong></p>
          <p className="text-sm">Monthly: <strong>{monthly}</strong></p>
          <p className="pm-label mt-4">Encounter status</p>
          <DonutChart data={aggregates.status} />
        </Card>
      </div>
      <Card className="mt-4">
        <p className="pm-label mb-3">Activity mix (30 days)</p>
        <p className="mb-3 text-sm text-[var(--muted)]">Aggregated consultations, laboratory orders, prescriptions and record access events.</p>
        <MixBarChart data={aggregates.mix} />
      </Card>
    </div>
  );
}
