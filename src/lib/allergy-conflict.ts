const ALLERGEN_MEDICATION_MAP: Record<string, string[]> = {
  penicillin: ["amoxicillin", "ampicillin", "piperacillin", "penicillin"],
  amoxicillin: ["amoxicillin", "ampicillin", "penicillin"],
  sulfa: ["sulfamethoxazole", "sulfadiazine", "co-trimoxazole"],
  nsaid: ["ibuprofen", "naproxen", "aspirin", "diclofenac"],
  aspirin: ["aspirin", "ibuprofen"],
  codeine: ["codeine", "hydrocodone"],
  latex: [],
};

export function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

export function conflictingMedications(allergies: string[], medications: string[]) {
  const hits: { allergy: string; medication: string }[] = [];
  for (const allergy of allergies) {
    const key = normalizeToken(allergy);
    const related = ALLERGEN_MEDICATION_MAP[key] ?? [key];
    for (const med of medications) {
      const medNorm = normalizeToken(med);
      if (related.some((token) => medNorm.includes(token) || token.includes(medNorm))) {
        hits.push({ allergy, medication: med });
      }
    }
  }
  return hits;
}

export function duplicateActiveMedications(medications: string[]) {
  const seen = new Map<string, number>();
  for (const med of medications) {
    const key = normalizeToken(med);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, count]) => count > 1).map(([medication]) => medication);
}
