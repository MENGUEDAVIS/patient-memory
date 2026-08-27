import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, Card, Badge } from "@/components/ui";
import { VolumeChart, PharmacyChart } from "@/components/charts";
import { severityTone } from "@/components/status";
import {
  activityAnomalies,
  copilotBriefing,
  hospitalRisks,
  operationalRecommendations,
  pharmacyForecast,
  volumeForecast,
} from "@/lib/intelligence";

export default async function IntelligencePage() {
  const user = await requirePageRole("/admin/intelligence");
  const hospitalId = await hospitalScope(user);
  const [copilot, risks, volume, pharmacy, recs, anomalies] = await Promise.all([
    copilotBriefing(hospitalId),
    hospitalRisks(hospitalId),
    volumeForecast(hospitalId),
    pharmacyForecast(hospitalId),
    operationalRecommendations(hospitalId),
    activityAnomalies(hospitalId),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical and Operational Decision Support"
        description="Signals, predictions and recommendations that require human review. This is not an AI doctor and does not diagnose or prescribe."
      />
      <Card>
        <p className="pm-label">What should I know today?</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <p><strong>Clinical.</strong> {copilot.clinical}</p>
          <p><strong>Operations.</strong> {copilot.operations}</p>
          <p><strong>Documentation.</strong> {copilot.documentation}</p>
          <p><strong>Pharmacy.</strong> {copilot.pharmacy}</p>
        </div>
        <p className="mt-3"><strong>Recommendation.</strong> {copilot.recommendation}</p>
      </Card>
      <Card>
        <p className="pm-label mb-3">Risk detection</p>
        <table className="pm-table">
          <thead><tr><th>Risk</th><th>Severity</th><th>Patient</th><th>Reason</th><th>Recommended action</th></tr></thead>
          <tbody>
            {risks.slice(0, 20).map((risk, i) => (
              <tr key={i}>
                <td>{risk.risk}</td>
                <td><Badge tone={severityTone(risk.severity)}>{risk.severity}</Badge></td>
                <td className="tabular">{risk.patientPublicId}<br /><span className="text-[var(--muted)]">{risk.patientName}</span></td>
                <td>{risk.reason}</td>
                <td>{risk.recommendedAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="pm-label mb-2">Patient demand forecast</p>
          {volume.forecast.insufficient ? (
            <p>{volume.forecast.message}</p>
          ) : (
            <p className="mb-3 text-sm">
              Expected outpatient volume tomorrow: {volume.forecast.low}–{volume.forecast.high} patients.
              Trend {volume.forecast.trend}, confidence {volume.forecast.confidence}.
            </p>
          )}
          <VolumeChart data={volume.history.slice(-30)} />
        </Card>
        <Card>
          <p className="pm-label mb-2">Pharmacy demand forecast</p>
          {pharmacy.insufficient ? <p>{pharmacy.message}</p> : <PharmacyChart data={pharmacy.medications} />}
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="pm-label mb-3">Operational recommendations</p>
          {recs.map((rec, i) => (
            <div key={i} className="mb-4 text-sm">
              <p><strong>Observation.</strong> {rec.observation}</p>
              <p><strong>Data.</strong> {rec.data}</p>
              <p><strong>Insight.</strong> {rec.insight}</p>
              <p><strong>Recommendation.</strong> {rec.recommendation}</p>
            </div>
          ))}
        </Card>
        <Card>
          <p className="pm-label mb-3">Activity review</p>
          {anomalies.length === 0 ? <p className="text-sm text-[var(--muted)]">No review items from current rules.</p> : anomalies.map((item, i) => (
            <div key={i} className="mb-4 text-sm">
              <p className="font-semibold text-amber-800">{item.title}</p>
              <p>{item.observation}</p>
              <p className="text-[var(--muted)]">{item.dataSummary}</p>
              <p>{item.recommendation}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
