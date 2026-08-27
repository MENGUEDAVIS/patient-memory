import { requirePageRole } from "@/lib/guards";
import { PageHeader } from "@/components/ui";
import { PharmacyPrescribeForm } from "@/components/pharmacy-prescribe-form";

export default async function PharmacyPrescribePage() {
  await requirePageRole("/pharmacy/prescribe");
  return (
    <div>
      <PageHeader
        title="Issue a prescription"
        description="Use this after the patient has completed a consultation. The new prescription is chained to that encounter and appears on the patient record."
      />
      <div className="pm-card p-5">
        <PharmacyPrescribeForm />
      </div>
    </div>
  );
}
