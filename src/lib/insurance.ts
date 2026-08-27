export type InsuranceInput = {
  patientPublicId: string;
  hospitalCode: string;
  encounterPublicId: string;
  claimId: string;
  encounterExists: boolean;
  encounterHospitalCode: string | null;
  encounterPatientPublicId: string | null;
  encounterStatus: string | null;
};

export function verifyInsurance(input: InsuranceInput) {
  if (!input.claimId.trim() || !input.patientPublicId.trim() || !input.encounterPublicId.trim()) {
    return "REQUIRES_REVIEW" as const;
  }
  if (!input.encounterExists) return "NOT_VERIFIED" as const;
  if (input.encounterHospitalCode !== input.hospitalCode) return "NOT_VERIFIED" as const;
  if (input.encounterPatientPublicId !== input.patientPublicId) return "NOT_VERIFIED" as const;
  if (input.encounterStatus !== "COMPLETED") return "REQUIRES_REVIEW" as const;
  return "VERIFIED" as const;
}
