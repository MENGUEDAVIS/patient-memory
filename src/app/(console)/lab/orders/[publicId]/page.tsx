import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, Card } from "@/components/ui";
import { LabResultForm } from "@/components/actions";
import { notFound } from "next/navigation";

export default async function LabOrderPage({ params }: { params: Promise<{ publicId: string }> }) {
  const user = await requirePageRole("/lab/orders");
  const hospitalId = await hospitalScope(user);
  const { publicId } = await params;
  const order = await prisma.laboratoryOrder.findFirst({
    where: { publicId, hospitalId },
    include: { patient: true, result: true },
  });
  if (!order) notFound();
  return (
    <div className="space-y-4">
      <PageHeader title={order.publicId} description={`${order.testName} · ${order.patient.publicId}`} />
      {order.isCritical ? (
        <div className="rounded-md bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          CRITICAL RESULT — PHYSICIAN REVIEW REQUIRED
        </div>
      ) : null}
      <Card>
        {order.result ? (
          <p>Result already entered: {order.result.value} {order.result.unit}</p>
        ) : (
          <LabResultForm orderPublicId={order.publicId} />
        )}
      </Card>
    </div>
  );
}
