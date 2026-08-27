import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { ConsultationForm } from "@/components/consultation-form";
import { PageHeader } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function ConsultationPage({ params }: { params: Promise<{ publicId: string }> }) {
  const user = await requirePageRole("/doctor/consultations");
  const hospitalId = await hospitalScope(user);
  const { publicId } = await params;
  const encounter = await prisma.encounter.findFirst({
    where: { publicId, hospitalId },
    include: {
      patient: true,
      clinicalNote: true,
      vitalSigns: true,
      diagnoses: true,
      prescriptions: { include: { items: true } },
      labOrders: true,
    },
  });
  if (!encounter) notFound();
  return (
    <div>
      <PageHeader
        title={`Encounter ${encounter.publicId}`}
        description={`${encounter.patient.firstName} ${encounter.patient.lastName} · ${encounter.department}`}
      />
      <ConsultationForm
        encounter={{
          ...encounter,
          followUpAt: encounter.followUpAt?.toISOString() ?? null,
          labOrders: encounter.labOrders,
        }}
      />
    </div>
  );
}
