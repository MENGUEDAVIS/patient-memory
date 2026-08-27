import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { requireSelfPatient } from "@/lib/self-patient";
import { PageHeader, EmptyState, Card } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { formatDateTime } from "@/lib/dates";

export default async function MeRx() {
  const user = await requirePageRole("/me/prescriptions");
  const patient = await requireSelfPatient(user);
  const prescriptions = await prisma.prescription.findMany({
    where: { patientId: patient.id },
    include: { items: true, dispensings: true },
    orderBy: { issuedAt: "desc" },
  });
  return (
    <div className="space-y-4">
      <PageHeader title="My prescriptions" description="Active medicines and the dispensing chain attached to your record." />
      {prescriptions.length === 0 ? (
        <EmptyState title="No prescriptions" body="No prescriptions are available." />
      ) : (
        prescriptions.map((rx) => (
          <Card key={rx.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium tabular">{rx.publicId}</p>
              <StatusBadge value={rx.status} />
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">Issued {formatDateTime(rx.issuedAt)}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {rx.items.map((item) => (
                <li key={item.id}>
                  {item.medication} · {item.dose} · {item.route} · {item.frequency} · {item.duration}
                  <span className="block text-[var(--muted)]">{item.instructions}</span>
                </li>
              ))}
            </ul>
            {rx.dispensings.length ? (
              <p className="mt-3 text-sm text-[var(--muted)]">
                Dispensed {rx.dispensings.map((d) => `${d.quantity} units on ${formatDateTime(d.dispensedAt)}`).join("; ")}
              </p>
            ) : (
              <p className="mt-3 text-sm text-[var(--muted)]">Not yet dispensed.</p>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
