import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, EmptyState } from "@/components/ui";
import { PatientSearch } from "@/components/actions";
import { yearsBetween } from "@/lib/ids";

export default async function AdminPatients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requirePageRole("/admin/patients");
  const hospitalId = await hospitalScope(user);
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const patients = await prisma.patient.findMany({
    where: query
      ? {
          hospitalId,
          OR: [
            { publicId: { contains: query, mode: "insensitive" } },
            { phone: { contains: query.replace(/\s/g, "") } },
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
          ],
        }
      : { hospitalId },
    include: { allergies: { where: { active: true } } },
    orderBy: { lastName: "asc" },
    take: 80,
  });
  return (
    <div>
      <PageHeader
        title="Patients"
        description="Search by Patient ID, phone number or name."
        actions={<Link className="inline-flex h-9 items-center rounded-md bg-[var(--navy)] px-3 text-sm text-white" href="/admin/patients/new">Register patient</Link>}
      />
      <PatientSearch basePath="/admin/patients" />
      <div className="mt-4 pm-card overflow-x-auto">
        {patients.length === 0 ? (
          <EmptyState title="No patients found" body="No patient records match that search." />
        ) : (
          <table className="pm-table">
            <thead>
              <tr><th>Patient ID</th><th>Name</th><th>Age</th><th>Phone</th><th>Allergies</th></tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td className="tabular"><Link className="underline" href={`/admin/patients/${patient.publicId}`}>{patient.publicId}</Link></td>
                  <td>{patient.firstName} {patient.lastName}</td>
                  <td>{yearsBetween(patient.dateOfBirth)}</td>
                  <td>{patient.phone}</td>
                  <td>{patient.allergies.map((a) => a.substance).join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
