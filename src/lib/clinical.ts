export const CONFLICT_MAP: Record<string, string[]> = {
  penicillin: ["amoxicillin", "ampicillin", "augmentin"],
  sulfa: ["sulfamethoxazole", "bactrim"],
  nsaid: ["ibuprofen", "naproxen", "diclofenac", "aspirin"],
  iodine: ["contrast"],
};

export function normalizeMed(value: string) {
  return value.trim().toLowerCase();
}

export function allergyConflicts(allergies: string[], medications: string[]) {
  const hits: { allergy: string; medication: string }[] = [];
  for (const allergy of allergies) {
    const key = normalizeMed(allergy);
    const meds = medications.map(normalizeMed);
    for (const med of meds) {
      if (med.includes(key) || key.includes(med)) {
        hits.push({ allergy, medication: med });
        continue;
      }
      const mapped = CONFLICT_MAP[key] ?? [];
      if (mapped.some((m) => med.includes(m))) {
        hits.push({ allergy, medication: med });
      }
    }
  }
  return hits;
}

export type ConsultationDraft = {
  chiefComplaint?: string | null;
  historyOfPresentIllness?: string | null;
  observations?: string | null;
  assessment?: string | null;
  systolicMmHg?: number | null;
  diastolicMmHg?: number | null;
  heartRate?: number | null;
  diagnosisCount: number;
};

export function consultationCompletionErrors(draft: ConsultationDraft) {
  const errors: string[] = [];
  if (!draft.chiefComplaint?.trim()) errors.push("Chief complaint is required.");
  if (!draft.historyOfPresentIllness?.trim()) errors.push("History of present illness is required.");
  if (!draft.observations?.trim()) errors.push("Clinical observations are required.");
  if (!draft.assessment?.trim()) errors.push("Assessment is required.");
  const vitals = [draft.systolicMmHg, draft.diastolicMmHg, draft.heartRate].filter((v) => v != null);
  if (vitals.length < 3) errors.push("Blood pressure and heart rate are required.");
  if (draft.diagnosisCount < 1) errors.push("At least one diagnosis is required.");
  return errors;
}

export function canAmendFinalRecord(isFinal: boolean, wantsSilentEdit: boolean) {
  return !(isFinal && wantsSilentEdit);
}
