import { requirePageRole } from "@/lib/guards";
import { PageHeader } from "@/components/ui";
import { PatientRegisterForm } from "@/components/actions";

export default async function NewPatientPage() {
  await requirePageRole("/admin/patients/new");
  return (
    <div>
      <PageHeader title="Register patient" description="A unique Patient Health ID is assigned automatically." />
      <div className="pm-card p-5">
        <PatientRegisterForm />
      </div>
    </div>
  );
}
