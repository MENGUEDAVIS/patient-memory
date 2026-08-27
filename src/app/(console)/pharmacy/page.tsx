import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
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
      <PageHeader title="Pharmacy" description="Prescription to dispensing chain. Inventory is out of MVP scope." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Active prescriptions" value={active} />
        <Stat label="Partially dispensed" value={partial} />
        <Stat label="Dispensed" value={dispensed} />
      </div>
    </div>
  );
}
