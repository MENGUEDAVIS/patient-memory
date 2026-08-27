import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";

export default async function LabResultsPage() {
  const user = await requirePageRole("/lab/results");
  const hospitalId = await hospitalScope(user);
  const orders = await prisma.laboratoryOrder.findMany({
    where: { hospitalId, result: { isNot: null } },
    include: { patient: true, result: true },
    orderBy: { resultAt: "desc" },
    take: 80,
  });
  return (
    <div>
      <PageHeader title="Results" />
      <div className="pm-card overflow-x-auto">
        {orders.length === 0 ? <EmptyState title="No laboratory results" body="No laboratory results are available." /> : (
          <table className="pm-table">
            <thead><tr><th>Order</th><th>Patient</th><th>Test</th><th>Value</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="tabular">{order.publicId}</td>
                  <td>{order.patient.publicId}</td>
                  <td>{order.testName}</td>
                  <td>{order.result?.value} {order.result?.unit}</td>
                  <td><StatusBadge value={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
