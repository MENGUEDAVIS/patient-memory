import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, Stat, Card } from "@/components/ui";
import { copilotBriefing } from "@/lib/intelligence";
import { startOfDay } from "@/lib/dates";

export default async function DirectorHome() {
  const user = await requirePageRole("/director");
  const hospitalId = await hospitalScope(user);
  const today = startOfDay();
  const [consultations, incomplete, critical, copilot] = await Promise.all([
    prisma.encounter.count({ where: { hospitalId, startedAt: { gte: today } } }),
    prisma.encounter.count({ where: { hospitalId, status: { in: ["DRAFT", "IN_PROGRESS"] } } }),
    prisma.laboratoryOrder.count({
      where: { hospitalId, isCritical: true, reviewedAt: null, result: { isNot: null } },
    }),
    copilotBriefing(hospitalId),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Medical director" description="Clinical accountability and decision support." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Consultations today" value={consultations} />
        <Stat label="Incomplete records" value={incomplete} />
        <Stat label="Critical results" value={critical} />
      </div>
      <Card>
        <p className="pm-label">What should I know today?</p>
        <p className="mt-3 text-sm">{copilot.clinical}</p>
        <p className="text-sm">{copilot.documentation}</p>
        <p className="mt-2 text-sm"><strong>Recommendation.</strong> {copilot.recommendation}</p>
      </Card>
    </div>
  );
}
