import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, Stat } from "@/components/ui";

export default async function LabHome() {
  const user = await requirePageRole("/lab");
  const hospitalId = await hospitalScope(user);
  const [pending, processing, critical, available] = await Promise.all([
    prisma.laboratoryOrder.count({ where: { hospitalId, status: "ORDERED" } }),
    prisma.laboratoryOrder.count({ where: { hospitalId, status: { in: ["SAMPLE_COLLECTED", "PROCESSING"] } } }),
    prisma.laboratoryOrder.count({ where: { hospitalId, isCritical: true, reviewedAt: null } }),
    prisma.laboratoryOrder.count({ where: { hospitalId, status: "RESULT_AVAILABLE" } }),
  ]);
  return (
    <div>
      <PageHeader title="Laboratory" description="Pending orders, processing, and critical results." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Pending orders" value={pending} />
        <Stat label="In process" value={processing} />
        <Stat label="Results available" value={available} />
        <Stat label="Critical awaiting review" value={critical} />
      </div>
    </div>
  );
}
