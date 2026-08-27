import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { formatDateTime } from "@/lib/dates";

export default async function AdminLabPage() {
  const user = await requirePageRole("/admin/laboratory");
  const hospitalId = await hospitalScope(user);
  const orders = await prisma.laboratoryOrder.findMany({
    where: { hospitalId },
    include: { patient: true, result: true },
    orderBy: { orderedAt: "desc" },
    take: 80,
  });
  return (
    <div>
      <PageHeader title="Laboratory" />
      <div className="pm-card overflow-x-auto">
        {orders.length === 0 ? <EmptyState title="No laboratory orders" body="No laboratory tests have been ordered." /> : (
          <table className="pm-table">
            <thead><tr><th>Order</th><th>Patient</th><th>Test</th><th>Status</th><th>Critical</th><th>Ordered</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="tabular">{order.publicId}</td>
                  <td>{order.patient.firstName} {order.patient.lastName}</td>
                  <td>{order.testName}</td>
                  <td><StatusBadge value={order.status} /></td>
                  <td>{order.isCritical ? <StatusBadge value="CRITICAL" /> : "—"}</td>
                  <td>{formatDateTime(order.orderedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
