export const PLANS = {
  CLINIC: {
    code: "CLINIC" as const,
    name: "Clinic",
    audience: "Single-site clinics and practices",
    monthlyFeeUsd: 199,
    encounterFeeUsd: 0.5,
    onboardingFeeUsd: 1500,
    features: [
      "Patient EHR and unique Patient Health ID",
      "Consultations, prescriptions and laboratory",
      "Patient portal and access history",
      "Clinical audit log",
    ],
  },
  HOSPITAL: {
    code: "HOSPITAL" as const,
    name: "Hospital",
    audience: "Hospitals running the full clinical loop",
    monthlyFeeUsd: 500,
    encounterFeeUsd: 0.3,
    onboardingFeeUsd: 5000,
    featured: true,
    features: [
      "Everything in Clinic",
      "Pharmacy dispensing chain",
      "Clinical intelligence and forecasts",
      "Insurance verification (simulated)",
      "Break-glass emergency access",
    ],
  },
  NETWORK: {
    code: "NETWORK" as const,
    name: "Network",
    audience: "Hospital groups and regional networks",
    monthlyFeeUsd: 1800,
    encounterFeeUsd: 0.18,
    onboardingFeeUsd: 15000,
    features: [
      "Everything in Hospital",
      "Priority onboarding",
      "Multi-facility commercial terms",
      "Dedicated implementation contact",
    ],
  },
};

export type PlanCode = keyof typeof PLANS;

export function getPlan(code: string) {
  return PLANS[(code as PlanCode) in PLANS ? (code as PlanCode) : "HOSPITAL"];
}

export function pharmacyMayIssuePrescription(encounterStatus: string) {
  return encounterStatus === "COMPLETED";
}
