import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, Stat } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { BillingConfigForm } from "@/components/actions";
import { startOfDay, formatDateTime } from "@/lib/dates";

export default async function BillingPage() {
  const user = await requirePageRole("/admin/billing");
  const hospitalId = await hospitalScope(user);
  const monthStart = new Date(startOfDay());
  monthStart.setDate(1);
  const [config, records, encounters] = await Promise.all([
    prisma.hospitalBillingConfig.findUnique({ where: { hospitalId } }),
    prisma.billingRecord.findMany({
      where: { hospitalId, billedAt: { gte: monthStart } },
      include: { patient: true, encounter: true },
      orderBy: { billedAt: "desc" },
      take: 40,
    }),
    prisma.encounter.count({ where: { hospitalId, status: "COMPLETED", completedAt: { gte: monthStart } } }),
  ]);
  const encounterRevenue = records.reduce((sum, row) => sum + Number(row.amountUsd), 0);
  const subscription = Number(config?.monthlyFeeUsd ?? 500);
  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Lightweight commercial module. This is not a full accounting system." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Encounters" value={encounters} />
        <Stat label="Billable encounters" value={records.length} />
        <Stat label="Subscription revenue" value={`$${subscription.toFixed(2)}`} />
        <Stat label="Total platform revenue" value={`$${(subscription + encounterRevenue).toFixed(2)}`} hint={`Encounter revenue $${encounterRevenue.toFixed(2)}`} />
      </div>
      <div className="pm-card p-5">
        <p className="pm-label mb-3">Commercial configuration</p>
        <BillingConfigForm
          config={{
            monthlyFeeUsd: Number(config?.monthlyFeeUsd ?? 500),
            encounterFeeUsd: Number(config?.encounterFeeUsd ?? 0.3),
            onboardingFeeUsd: Number(config?.onboardingFeeUsd ?? 5000),
          }}
        />
      </div>
      <div className="pm-card overflow-x-auto">
        <table className="pm-table">
          <thead><tr><th>Invoice</th><th>Encounter</th><th>Patient</th><th>Amount</th><th>Status</th><th>Billed</th></tr></thead>
          <tbody>
            {records.map((row) => (
              <tr key={row.id}>
                <td className="tabular">{row.publicId}</td>
                <td className="tabular">{row.encounter.publicId}</td>
                <td>{row.patient.firstName} {row.patient.lastName}</td>
                <td>${Number(row.amountUsd).toFixed(2)}</td>
                <td><StatusBadge value={row.status} /></td>
                <td>{formatDateTime(row.billedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
