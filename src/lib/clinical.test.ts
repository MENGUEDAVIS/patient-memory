import { describe, expect, it } from "vitest";
import { consultationCompletionErrors } from "./clinical";
import { conflictingMedications, duplicateActiveMedications } from "./allergy-conflict";
import { movingAverageForecast } from "./forecast";
import { verifyInsurance } from "./insurance";
import { nextPublicId, padNumericId } from "./ids";
import { hasPermission, pathAllowed } from "./rbac";

describe("consultation completion", () => {
  it("requires clinical fields before finalize", () => {
    const errors = consultationCompletionErrors({ diagnosisCount: 0 });
    expect(errors.length).toBeGreaterThan(0);
    expect(
      consultationCompletionErrors({
        chiefComplaint: "Chest pain",
        historyOfPresentIllness: "2 days of pressure",
        observations: "Diaphoretic",
        assessment: "ACS until proven otherwise",
        systolicMmHg: 150,
        diastolicMmHg: 92,
        heartRate: 98,
        diagnosisCount: 1,
      }),
    ).toEqual([]);
  });
});

describe("allergy conflicts", () => {
  it("flags penicillin vs amoxicillin", () => {
    const hits = conflictingMedications(["penicillin"], ["Amoxicillin 500mg"]);
    expect(hits).toHaveLength(1);
  });

  it("detects duplicate active medications", () => {
    expect(duplicateActiveMedications(["Metformin", "metformin", "Lisinopril"])).toContain("metformin");
  });
});

describe("forecast", () => {
  it("reports insufficient data below the window", () => {
    const result = movingAverageForecast(
      Array.from({ length: 5 }, (_, i) => ({ day: `2026-01-0${i + 1}`, value: 10 })),
    );
    expect(result.insufficient).toBe(true);
  });

  it("returns a bounded forecast with enough history", () => {
    const history = Array.from({ length: 21 }, (_, i) => ({
      day: `2026-01-${String(i + 1).padStart(2, "0")}`,
      value: 40 + (i % 3),
    }));
    const result = movingAverageForecast(history);
    expect(result.insufficient).toBe(false);
    expect(result.mean).toBeGreaterThan(0);
    expect(result.low).toBeLessThanOrEqual(result.high ?? 0);
  });
});

describe("insurance verification", () => {
  it("verifies a completed matching encounter", () => {
    expect(
      verifyInsurance({
        patientPublicId: "PAT-00018492",
        hospitalCode: "SLM",
        encounterPublicId: "ENC-00000001",
        claimId: "CLM-1",
        encounterExists: true,
        encounterHospitalCode: "SLM",
        encounterPatientPublicId: "PAT-00018492",
        encounterStatus: "COMPLETED",
      }),
    ).toBe("VERIFIED");
  });

  it("rejects a hospital mismatch", () => {
    expect(
      verifyInsurance({
        patientPublicId: "PAT-00018492",
        hospitalCode: "SLM",
        encounterPublicId: "ENC-00000001",
        claimId: "CLM-1",
        encounterExists: true,
        encounterHospitalCode: "RGH",
        encounterPatientPublicId: "PAT-00018492",
        encounterStatus: "COMPLETED",
      }),
    ).toBe("NOT_VERIFIED");
  });
});

describe("identifiers and rbac", () => {
  it("increments public ids", () => {
    expect(padNumericId("PAT", 18492)).toBe("PAT-00018492");
    expect(nextPublicId("ENC", "ENC-00000009")).toBe("ENC-00000010");
  });

  it("scopes doctor routes", () => {
    expect(pathAllowed("DOCTOR", "/doctor/patients")).toBe(true);
    expect(pathAllowed("DOCTOR", "/admin")).toBe(false);
    expect(hasPermission("PHARMACIST", "pharmacy:dispense")).toBe(true);
    expect(hasPermission("DOCTOR", "audit:read")).toBe(false);
  });
});
