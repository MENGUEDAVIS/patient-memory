import { requirePageRole } from "@/lib/guards";
import { PageHeader } from "@/components/ui";
import { InsuranceForm } from "@/components/actions";

export default async function InsurancePage() {
  await requirePageRole("/admin/insurance");
  return (
    <div>
      <PageHeader title="Insurance verification" description="Demonstration of a future API capability. No unnecessary medical information is exposed." />
      <div className="pm-card p-5">
        <InsuranceForm />
      </div>
    </div>
  );
}
