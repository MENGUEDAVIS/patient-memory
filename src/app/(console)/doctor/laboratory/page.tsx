import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { ReviewLabButton } from "@/components/actions";

export default async function DoctorLabPage() {
  const user = await requirePageRole("/doctor/laboratory");
  const hospitalId = await hospitalScope(user);
  const orders = await prisma.laboratoryOrder.findMany({
    where: { hospitalId, result: { isNot: null } },
    include: { patient: true, result: true },
    orderBy: { resultAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <PageHeader title="Laboratory" description="Review results, including critical values." />
      <div className="pm-card overflow-x-auto">
        {orders.length === 0 ? <EmptyState title="No laboratory results" body="No laboratory results are available." /> : (
          <table className="pm-table">
            <thead><tr><th>Order</th><th>Patient</th><th>Test</th><th>Value</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="tabular">{order.publicId}</td>
                  <td>{order.patient.firstName} {order.patient.lastName}</td>
                  <td>{order.testName}{order.isCritical ? " · CRITICAL" : ""}</td>
                  <td>{order.result?.value} {order.result?.unit}</td>
                  <td><StatusBadge value={order.status} /></td>
                  <td>{order.reviewedAt ? "Reviewed" : <ReviewLabButton orderPublicId={order.publicId} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
