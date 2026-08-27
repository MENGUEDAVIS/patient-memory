import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import Link from "next/link";
import { PageHeader, Stat } from "@/components/ui";

export default async function PharmacyHome() {
  const user = await requirePageRole("/pharmacy");
  const hospitalId = await hospitalScope(user);
  const [active, partial, dispensed] = await Promise.all([
    prisma.prescription.count({ where: { hospitalId, status: "ACTIVE" } }),
    prisma.prescription.count({ where: { hospitalId, status: "PARTIALLY_DISPENSED" } }),
    prisma.prescription.count({ where: { hospitalId, status: "DISPENSED" } }),
  ]);
  return (
    <div>
      <PageHeader
        title="Pharmacy"
        description="Dispense doctor prescriptions, or add a pharmacy prescription after a completed consultation."
        actions={
          <Link className="inline-flex h-9 items-center rounded-md bg-[var(--navy)] px-3 text-sm text-white" href="/pharmacy/prescribe">
            Issue prescription
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Active prescriptions" value={active} />
        <Stat label="Partially dispensed" value={partial} />
        <Stat label="Dispensed" value={dispensed} />
      </div>
    </div>
  );
}
