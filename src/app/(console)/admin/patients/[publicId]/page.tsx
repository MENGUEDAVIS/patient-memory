import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { writeAccessLog, writeAudit } from "@/lib/audit";
import { PatientRecord } from "@/components/patient-record";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AdminPatientPage({ params }: { params: Promise<{ publicId: string }> }) {
  const user = await requirePageRole("/admin/patients");
  const hospitalId = await hospitalScope(user);
  const { publicId } = await params;
  const patient = await prisma.patient.findFirst({ where: { publicId, hospitalId } });
  if (!patient) notFound();
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    patientId: patient.id,
    activity: "PATIENT_RECORD_VIEWED",
  });
  await writeAccessLog({ userId: user.id, hospitalId, patientId: patient.id, activity: "PATIENT_RECORD_VIEWED" });
  return (
    <div>
      <PageHeader title="Patient EHR" description={`${patient.firstName} ${patient.lastName}`} />
      <PatientRecord publicId={publicId} hospitalId={hospitalId} />
    </div>
  );
}
