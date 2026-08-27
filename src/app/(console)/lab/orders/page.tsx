import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { formatDateTime } from "@/lib/dates";

export default async function LabOrdersPage() {
  const user = await requirePageRole("/lab/orders");
  const hospitalId = await hospitalScope(user);
  const orders = await prisma.laboratoryOrder.findMany({
    where: { hospitalId, status: { in: ["ORDERED", "SAMPLE_COLLECTED", "PROCESSING"] } },
    include: { patient: true },
    orderBy: { orderedAt: "asc" },
  });
  return (
    <div>
      <PageHeader title="Orders" />
      <div className="pm-card overflow-x-auto">
        {orders.length === 0 ? <EmptyState title="No pending orders" body="There are no laboratory orders waiting." /> : (
          <table className="pm-table">
            <thead><tr><th>Order</th><th>Patient</th><th>Test</th><th>Status</th><th>Ordered</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="tabular"><Link className="underline" href={`/lab/orders/${order.publicId}`}>{order.publicId}</Link></td>
                  <td>{order.patient.firstName} {order.patient.lastName} · {order.patient.publicId}</td>
                  <td>{order.testName}</td>
                  <td><StatusBadge value={order.status} /></td>
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
