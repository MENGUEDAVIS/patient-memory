import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, Card } from "@/components/ui";

export default async function SettingsPage() {
  const user = await requirePageRole("/admin/settings");
  const hospitalId = await hospitalScope(user);
  const [hospital, retention] = await Promise.all([
    prisma.hospital.findUnique({ where: { id: hospitalId } }),
    prisma.retentionPolicy.findUnique({ where: { hospitalId } }),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Hospital configuration and data retention. Legal compliance is not claimed for a specific jurisdiction." />
      <Card>
        <p className="pm-label">Hospital</p>
        <p className="mt-2 text-lg font-medium">{hospital?.name}</p>
        <p className="text-sm text-[var(--muted)]">{hospital?.code} · {hospital?.city}, {hospital?.country}</p>
      </Card>
      <Card>
        <p className="pm-label">Data retention</p>
        <p className="mt-2 text-sm">Audit retention: {retention?.auditRetentionDays ?? 2555} days</p>
        <p className="text-sm">Export enabled: {retention?.exportEnabled ? "Yes" : "No"}</p>
      </Card>
      <Card>
        <p className="pm-label">Secrets</p>
        <p className="mt-2 text-sm">AI, payment and SMS providers are configured through environment variables and are not hardcoded.</p>
      </Card>
    </div>
  );
}
