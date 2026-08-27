import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  dateOfBirth: z.string().min(1, "Date of birth is required."),
  sex: z.enum(["MALE", "FEMALE", "OTHER", "UNKNOWN"]),
  phone: z.string().min(6, "Phone number is required."),
  email: z.string().email(),
  addressLine: z.string().min(3),
  city: z.string().min(2),
  bloodGroup: z.string().min(1),
  emergencyName: z.string().min(1),
  emergencyPhone: z.string().min(6),
  emergencyRelation: z.string().min(1),
  allergies: z
    .array(
      z.object({
        substance: z.string().min(1),
        reaction: z.string().min(1),
        severity: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"]).default("MODERATE"),
      }),
    )
    .optional(),
  conditions: z.array(z.object({ name: z.string().min(1) })).optional(),
});

export const consultationSchema = z.object({
  encounterPublicId: z.string(),
  chiefComplaint: z.string().optional(),
  historyOfPresentIllness: z.string().optional(),
  observations: z.string().optional(),
  assessment: z.string().optional(),
  systolicMmHg: z.number().int().min(50).max(260).nullable().optional(),
  diastolicMmHg: z.number().int().min(30).max(160).nullable().optional(),
  heartRate: z.number().int().min(20).max(250).nullable().optional(),
  temperatureC: z.number().min(30).max(45).nullable().optional(),
  spo2: z.number().int().min(50).max(100).nullable().optional(),
  respiratoryRate: z.number().int().min(5).max(60).nullable().optional(),
  followUpAt: z.string().nullable().optional(),
  followUpNotes: z.string().nullable().optional(),
});

export const diagnosisSchema = z.object({
  encounterPublicId: z.string(),
  description: z.string().min(2),
  code: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const hospitalRegisterSchema = z.object({
  facilityKind: z.enum(["HOSPITAL", "CLINIC"]),
  name: z.string().min(3, "Facility name is required."),
  city: z.string().min(2),
  country: z.string().min(2),
  adminFullName: z.string().min(3),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  plan: z.enum(["CLINIC", "HOSPITAL", "NETWORK"]),
});

export const prescriptionSchema = z.object({
  encounterPublicId: z.string(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        medication: z.string().min(1),
        dose: z.string().min(1),
        route: z.string().min(1),
        frequency: z.string().min(1),
        duration: z.string().min(1),
        instructions: z.string().min(1),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
});

export const labOrderSchema = z.object({
  encounterPublicId: z.string(),
  testName: z.string().min(2),
  notes: z.string().optional(),
});

export const labResultSchema = z.object({
  orderPublicId: z.string(),
  value: z.string().min(1),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  interpretation: z.string().optional(),
  isCritical: z.boolean().optional(),
  fileName: z.string().optional(),
});

export const dispenseSchema = z.object({
  prescriptionPublicId: z.string(),
  quantity: z.number().int().min(1),
  notes: z.string().optional(),
});

export const insuranceSchema = z.object({
  patientPublicId: z.string().min(1),
  hospitalCode: z.string().min(1),
  encounterPublicId: z.string().min(1),
  claimId: z.string().min(1),
});

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit authorization code."),
});

export const emergencySchema = z.object({
  reason: z.string().min(8, "A clinical reason is required for emergency access."),
});

export const billingConfigSchema = z.object({
  monthlyFeeUsd: z.number().min(0),
  encounterFeeUsd: z.number().min(0),
  onboardingFeeUsd: z.number().min(0),
});
