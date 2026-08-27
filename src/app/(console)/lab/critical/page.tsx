import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, Alert, EmptyState } from "@/components/ui";

export default async function LabCriticalPage() {
  const user = await requirePageRole("/lab/critical");
  const hospitalId = await hospitalScope(user);
  const orders = await prisma.laboratoryOrder.findMany({
    where: { hospitalId, isCritical: true },
    include: { patient: true, result: true },
    orderBy: { resultAt: "desc" },
  });
  return (
    <div className="space-y-4">
      <PageHeader title="Critical results" />
      <Alert tone="danger" title="CRITICAL RESULT — PHYSICIAN REVIEW REQUIRED">
        Critical values notify the responsible physician and remain visible until reviewed.
      </Alert>
      <div className="pm-card overflow-x-auto">
        {orders.length === 0 ? <EmptyState title="No critical results" body="No critical laboratory results are currently recorded." /> : (
          <table className="pm-table">
            <thead><tr><th>Order</th><th>Patient</th><th>Test</th><th>Value</th><th>Reviewed</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="tabular"><Link className="underline" href={`/lab/orders/${order.publicId}`}>{order.publicId}</Link></td>
                  <td>{order.patient.publicId}</td>
                  <td>{order.testName}</td>
                  <td>{order.result?.value} {order.result?.unit}</td>
                  <td>{order.reviewedAt ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
