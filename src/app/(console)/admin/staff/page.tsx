import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { StaffDecision } from "@/components/actions";
import { roleLabel } from "@/lib/rbac";

export default async function StaffPage() {
  const user = await requirePageRole("/admin/staff");
  const hospitalId = await hospitalScope(user);
  const memberships = await prisma.hospitalStaffMembership.findMany({
    where: { hospitalId },
    include: { professional: true, user: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="Healthcare workers" description="Professional verification is separate from hospital authorization." />
      <div className="pm-card overflow-x-auto">
        <table className="pm-table">
          <thead>
            <tr>
              <th>Name</th><th>Role</th><th>Professional ID</th><th>License</th>
              <th>Professional status</th><th>Hospital authorization</th><th></th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((row) => (
              <tr key={row.id}>
                <td>{row.professional.fullName}</td>
                <td>{roleLabel(row.role)}</td>
                <td className="tabular">{row.professional.professionalId}</td>
                <td>{row.professional.licenseNumber}</td>
                <td><StatusBadge value={row.professional.verificationStatus} /></td>
                <td><StatusBadge value={row.status} /></td>
                <td>{row.status === "PENDING" ? <StaffDecision membershipId={row.id} /> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
