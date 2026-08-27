import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { redirect } from "next/navigation";

export default async function MeLab() {
  const user = await requirePageRole("/me/laboratory");
  const patient = await prisma.patient.findFirst({ where: { userId: user.id } });
  if (!patient) redirect("/login");
  const orders = await prisma.laboratoryOrder.findMany({
    where: { patientId: patient.id },
    include: { result: true },
    orderBy: { orderedAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="Laboratory" />
      <div className="pm-card overflow-x-auto">
        {orders.length === 0 ? <EmptyState title="No laboratory results" body="No laboratory results are available for this patient." /> : (
          <table className="pm-table">
            <thead><tr><th>Order</th><th>Test</th><th>Result</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="tabular">{order.publicId}</td>
                  <td>{order.testName}</td>
                  <td>{order.result ? `${order.result.value} ${order.result.unit ?? ""}` : "Pending"}</td>
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
