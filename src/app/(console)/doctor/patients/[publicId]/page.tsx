import { requirePageRole } from "@/lib/guards";
import { hasValidAccess, hospitalScope } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { ConsentGate } from "@/components/consent-gate";
import { PatientRecord } from "@/components/patient-record";
import { PageHeader } from "@/components/ui";
import { writeAccessLog, writeAudit } from "@/lib/audit";
import { notFound } from "next/navigation";

export default async function DoctorPatientPage({ params }: { params: Promise<{ publicId: string }> }) {
  const user = await requirePageRole("/doctor/patients");
  const hospitalId = await hospitalScope(user);
  const { publicId } = await params;
  const patient = await prisma.patient.findFirst({ where: { publicId, hospitalId } });
  if (!patient) notFound();
  const access = await hasValidAccess(user, patient.id, hospitalId);
  if (!access.ok) {
    return (
      <div>
        <PageHeader title="Patient snapshot" description={`${patient.firstName} ${patient.lastName} · ${patient.publicId}`} />
        <ConsentGate publicId={publicId} name={`${patient.firstName} ${patient.lastName}`} />
      </div>
    );
  }
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    patientId: patient.id,
    activity: "PATIENT_RECORD_VIEWED",
    reason: access.emergency ? "Emergency access" : undefined,
  });
  await writeAccessLog({
    userId: user.id,
    hospitalId,
    patientId: patient.id,
    activity: "PATIENT_RECORD_VIEWED",
    emergency: access.emergency,
  });
  return (
    <div>
      <PageHeader title="Patient EHR" />
      <PatientRecord publicId={publicId} hospitalId={hospitalId} canStart emergency={access.emergency} />
    </div>
  );
}
