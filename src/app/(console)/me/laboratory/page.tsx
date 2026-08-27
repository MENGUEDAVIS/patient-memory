import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { requireSelfPatient } from "@/lib/self-patient";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { formatDateTime } from "@/lib/dates";

export default async function MeLab() {
  const user = await requirePageRole("/me/laboratory");
  const patient = await requireSelfPatient(user);
  const orders = await prisma.laboratoryOrder.findMany({
    where: { patientId: patient.id },
    include: { result: true },
    orderBy: { orderedAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="My laboratory results" description="Orders and results attached to your record." />
      <div className="pm-card overflow-x-auto">
        {orders.length === 0 ? (
          <EmptyState title="No laboratory results" body="No laboratory results are available for this patient." />
        ) : (
          <table className="pm-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Test</th>
                <th>Result</th>
                <th>Interpretation</th>
                <th>Status</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="tabular">{order.publicId}</td>
                  <td>
                    {order.testName}
                    {order.isCritical ? <span className="ml-2 text-xs font-semibold text-[var(--danger)]">CRITICAL</span> : null}
                  </td>
                  <td>{order.result ? `${order.result.value} ${order.result.unit ?? ""}` : "Pending"}</td>
                  <td>{order.result?.interpretation ?? "—"}</td>
                  <td>
                    <StatusBadge value={order.status} />
                  </td>
                  <td>{formatDateTime(order.resultAt ?? order.orderedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
