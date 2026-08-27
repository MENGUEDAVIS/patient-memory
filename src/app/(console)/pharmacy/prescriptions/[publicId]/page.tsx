import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, Card } from "@/components/ui";
import { DispenseForm } from "@/components/actions";
import { writeAudit } from "@/lib/audit";
import { notFound } from "next/navigation";

export default async function PharmacyRxDetail({ params }: { params: Promise<{ publicId: string }> }) {
  const user = await requirePageRole("/pharmacy/prescriptions");
  const hospitalId = await hospitalScope(user);
  const { publicId } = await params;
  const rx = await prisma.prescription.findFirst({
    where: { publicId, hospitalId },
    include: { patient: { include: { allergies: true } }, items: true, dispensings: true },
  });
  if (!rx) notFound();
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    patientId: rx.patientId,
    encounterId: rx.encounterId,
    activity: "PHARMACY_RECORD_VIEWED",
  });
  const remaining = rx.items.reduce((sum, item) => sum + (item.quantity - item.dispensedQty), 0);
  return (
    <div className="space-y-4">
      <PageHeader title={rx.publicId} description={`${rx.patient.firstName} ${rx.patient.lastName}`} />
      <Card>
        <p className="pm-label">Allergies</p>
        <p className="mt-1 text-sm">{rx.patient.allergies.map((a) => a.substance).join(", ") || "None recorded"}</p>
        <ul className="mt-4 space-y-1 text-sm">
          {rx.items.map((item) => (
            <li key={item.id}>{item.medication} · {item.dose} · {item.route} · {item.frequency} · qty {item.dispensedQty}/{item.quantity}</li>
          ))}
        </ul>
      </Card>
      {remaining > 0 ? <DispenseForm prescriptionPublicId={rx.publicId} remaining={remaining} /> : <p>Fully dispensed.</p>}
    </div>
  );
}
