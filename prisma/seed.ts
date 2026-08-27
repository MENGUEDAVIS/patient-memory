import {
  AffiliationStatus,
  EncounterStatus,
  InvoiceStatus,
  LabOrderStatus,
  PrescriptionStatus,
  PrismaClient,
  Role,
  Severity,
  Sex,
  VerificationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(18492);

function pick<T>(items: T[]) {
  return items[Math.floor(rand() * items.length)];
}

function pad(prefix: string, n: number, width = 8) {
  return `${prefix}-${String(n).padStart(width, "0")}`;
}

function daysAgo(n: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const FIRST = [
  "Amina", "Samuel", "Marie", "Paul", "Fatou", "Jean", "Grace", "Ibrahim", "Chloe", "Daniel",
  "Esther", "Kwame", "Nadia", "Olivier", "Patricia", "Rashid", "Sophie", "Thomas", "Uche", "Viviane",
  "Alain", "Binta", "Cyril", "Delphine", "Emile", "Florence", "Georges", "Helene", "Issa", "Julie",
];
const LAST = [
  "Nkomo", "Diallo", "Mensah", "Okonkwo", "Traore", "Kamga", "Boateng", "Mwangi", "Ndongo", "Sow",
  "Fofana", "Abebe", "Kouassi", "Mbeki", "Toure", "Diop", "Ngono", "Bello", "Hassan", "Pierre",
];
const CITIES = ["Douala", "Yaoundé", "Limbe", "Buea", "Kribi"];
const BLOOD = ["O+", "O-", "A+", "A-", "B+", "B+", "AB+", "O+"];
const ALLERGIES = [
  { substance: "Penicillin", reaction: "Rash", severity: Severity.HIGH },
  { substance: "NSAIDs", reaction: "Gastric pain", severity: Severity.MODERATE },
  { substance: "Sulfa", reaction: "Hives", severity: Severity.HIGH },
  { substance: "Latex", reaction: "Contact dermatitis", severity: Severity.LOW },
];
const CONDITIONS = ["Hypertension", "Type 2 diabetes", "Asthma", "Sickle cell trait", "Osteoarthritis"];
const TESTS = ["Full blood count", "Troponin I", "HbA1c", "Malaria smear", "Creatinine", "Lipid panel", "TSH"];
const MEDS = [
  { medication: "Metformin", dose: "500 mg", route: "Oral", frequency: "BID", duration: "30 days", instructions: "Take with meals", quantity: 60 },
  { medication: "Lisinopril", dose: "10 mg", route: "Oral", frequency: "Daily", duration: "30 days", instructions: "Monitor blood pressure", quantity: 30 },
  { medication: "Amoxicillin", dose: "500 mg", route: "Oral", frequency: "TID", duration: "7 days", instructions: "Complete the course", quantity: 21 },
  { medication: "Paracetamol", dose: "1 g", route: "Oral", frequency: "TID PRN", duration: "5 days", instructions: "Do not exceed 4 g/day", quantity: 15 },
  { medication: "Amlodipine", dose: "5 mg", route: "Oral", frequency: "Daily", duration: "30 days", instructions: "Take in the morning", quantity: 30 },
  { medication: "Salbutamol", dose: "100 mcg", route: "Inhaled", frequency: "PRN", duration: "30 days", instructions: "2 puffs as needed", quantity: 1 },
];
const DIAGNOSES = [
  { code: "I10", description: "Essential hypertension" },
  { code: "E11", description: "Type 2 diabetes mellitus" },
  { code: "J06.9", description: "Acute upper respiratory infection" },
  { code: "R50.9", description: "Fever, unspecified" },
  { code: "M54.5", description: "Low back pain" },
  { code: "A01.0", description: "Typhoid fever" },
  { code: "N39.0", description: "Urinary tract infection" },
  { code: "J45.9", description: "Asthma, unspecified" },
];
const DEPARTMENTS = ["Outpatient", "Internal Medicine", "Emergency", "Cardiology", "Laboratory", "Pharmacy"];

async function main() {
  console.log("Seeding Patient Memory demo data…");
  await prisma.timelineEvent.deleteMany();
  await prisma.recordAmendment.deleteMany();
  await prisma.pharmacyDispensing.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.laboratoryResult.deleteMany();
  await prisma.laboratoryOrder.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.clinicalNote.deleteMany();
  await prisma.vitalSigns.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.billingRecord.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.insuranceVerification.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.accessLog.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aiInsight.deleteMany();
  await prisma.forecast.deleteMany();
  await prisma.dailyVolume.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.patientAllergy.deleteMany();
  await prisma.patientCondition.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.hospitalStaffMembership.deleteMany();
  await prisma.healthcareProfessional.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.retentionPolicy.deleteMany();
  await prisma.hospitalBillingConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hospital.deleteMany();

  const slm = await prisma.hospital.create({
    data: {
      publicId: "HOS-SLM",
      name: "St. Luke Memorial Hospital",
      code: "SLM",
      city: "Douala",
      country: "CM",
    },
  });
  const rgh = await prisma.hospital.create({
    data: {
      publicId: "HOS-CUH",
      name: "Central University Hospital",
      code: "CUH",
      city: "Yaoundé",
      country: "CM",
    },
  });
  const hvc = await prisma.hospital.create({
    data: {
      publicId: "HOS-AMC",
      name: "Atlantic Medical Center",
      code: "AMC",
      city: "Limbe",
      country: "CM",
    },
  });
  const hospitals = [slm, rgh, hvc];

  for (const hospital of hospitals) {
    await prisma.hospitalBillingConfig.create({
      data: {
        hospitalId: hospital.id,
        monthlyFeeUsd: 500,
        encounterFeeUsd: 0.3,
        onboardingFeeUsd: 5000,
      },
    });
    await prisma.retentionPolicy.create({
      data: { hospitalId: hospital.id, auditRetentionDays: 2555, exportEnabled: true },
    });
  }

  const password = async (plain: string) => bcrypt.hash(plain, 12);

  const demoUsers = [
    {
      email: "admin@demo-hospital.com",
      password: "DemoAdmin123!",
      role: Role.HOSPITAL_ADMINISTRATOR,
      fullName: "Claire Mbarga",
      hospitalId: slm.id,
      professional: {
        professionalId: "LIC-ADM-001",
        qualification: "MHA",
        licenseNumber: "ADM-CM-4401",
        licenseIssuer: "Ministry of Public Health",
        professionalRole: Role.HOSPITAL_ADMINISTRATOR,
        department: "Administration",
      },
    },
    {
      email: "director@demo-hospital.com",
      password: "DemoDirector123!",
      role: Role.MEDICAL_DIRECTOR,
      fullName: "Dr. Pierre Essomba",
      hospitalId: slm.id,
      professional: {
        professionalId: "LIC-DIR-001",
        qualification: "MD, MPH",
        licenseNumber: "MD-CM-2104",
        licenseIssuer: "Order of Physicians",
        professionalRole: Role.MEDICAL_DIRECTOR,
        department: "Medical Direction",
      },
    },
    {
      email: "doctor@demo-hospital.com",
      password: "DemoDoctor123!",
      role: Role.DOCTOR,
      fullName: "Dr. Amina Diallo",
      hospitalId: slm.id,
      professional: {
        professionalId: "LIC-DOC-001",
        qualification: "MD, Internal Medicine",
        licenseNumber: "MD-CM-8841",
        licenseIssuer: "Order of Physicians",
        professionalRole: Role.DOCTOR,
        department: "Internal Medicine",
      },
    },
    {
      email: "lab@demo-hospital.com",
      password: "DemoLab123!",
      role: Role.LABORATORY_OPERATOR,
      fullName: "Sarah Smith",
      hospitalId: slm.id,
      professional: {
        professionalId: "LIC-LAB-001",
        qualification: "BSc Biomedical Science",
        licenseNumber: "LAB-CM-1190",
        licenseIssuer: "Allied Health Board",
        professionalRole: Role.LABORATORY_OPERATOR,
        department: "Laboratory",
      },
    },
    {
      email: "pharmacy@demo-hospital.com",
      password: "DemoPharmacy123!",
      role: Role.PHARMACIST,
      fullName: "Kwame Mensah",
      hospitalId: slm.id,
      professional: {
        professionalId: "LIC-PH-001",
        qualification: "PharmD",
        licenseNumber: "PH-CM-5520",
        licenseIssuer: "Pharmacy Council",
        professionalRole: Role.PHARMACIST,
        department: "Pharmacy",
      },
    },
  ];

  const createdDemo: Record<string, { userId: string; professionalId: string }> = {};
  for (const item of demoUsers) {
    const hash = await password(item.password);
    const user = await prisma.user.create({
      data: {
        email: item.email,
        passwordHash: hash,
        role: item.role,
        fullName: item.fullName,
        isDemo: true,
        hospitalId: item.hospitalId,
        professional: {
          create: {
            fullName: item.fullName,
            professionalRole: item.professional.professionalRole,
            professionalId: item.professional.professionalId,
            qualification: item.professional.qualification,
            licenseNumber: item.professional.licenseNumber,
            licenseIssuer: item.professional.licenseIssuer,
            identificationStatus: "ON_FILE",
            verificationStatus: VerificationStatus.VERIFIED,
          },
        },
      },
      include: { professional: true },
    });
    const professional = user.professional!;
    await prisma.hospitalStaffMembership.create({
      data: {
        hospitalId: item.hospitalId,
        professionalId: professional.id,
        userId: user.id,
        role: item.role,
        department: item.professional.department,
        status: AffiliationStatus.APPROVED,
        approvedAt: new Date(),
      },
    });
    createdDemo[item.email] = { userId: user.id, professionalId: professional.id };
  }

  const extraStaff: {
    hospitalId: string;
    role: Role;
    department: string;
    qualification: string;
  }[] = [
    { hospitalId: slm.id, role: Role.DOCTOR, department: "Cardiology", qualification: "MD, Cardiology" },
    { hospitalId: slm.id, role: Role.DOCTOR, department: "Emergency", qualification: "MD, Emergency Medicine" },
    { hospitalId: slm.id, role: Role.DOCTOR, department: "Outpatient", qualification: "MD" },
    { hospitalId: slm.id, role: Role.LABORATORY_OPERATOR, department: "Laboratory", qualification: "BSc Lab Science" },
    { hospitalId: slm.id, role: Role.PHARMACIST, department: "Pharmacy", qualification: "BPharm" },
    { hospitalId: rgh.id, role: Role.HOSPITAL_ADMINISTRATOR, department: "Administration", qualification: "MHA" },
    { hospitalId: rgh.id, role: Role.DOCTOR, department: "Internal Medicine", qualification: "MD" },
    { hospitalId: rgh.id, role: Role.DOCTOR, department: "Outpatient", qualification: "MD" },
    { hospitalId: rgh.id, role: Role.LABORATORY_OPERATOR, department: "Laboratory", qualification: "BSc" },
    { hospitalId: rgh.id, role: Role.PHARMACIST, department: "Pharmacy", qualification: "PharmD" },
    { hospitalId: hvc.id, role: Role.HOSPITAL_ADMINISTRATOR, department: "Administration", qualification: "MBA" },
    { hospitalId: hvc.id, role: Role.DOCTOR, department: "Outpatient", qualification: "MD" },
    { hospitalId: hvc.id, role: Role.DOCTOR, department: "Emergency", qualification: "MD" },
    { hospitalId: hvc.id, role: Role.LABORATORY_OPERATOR, department: "Laboratory", qualification: "BSc" },
    { hospitalId: hvc.id, role: Role.PHARMACIST, department: "Pharmacy", qualification: "BPharm" },
  ];

  const staffByHospital = new Map<string, { userId: string; professionalId: string; role: Role; name: string; department: string }[]>();
  staffByHospital.set(slm.id, [
    {
      userId: createdDemo["admin@demo-hospital.com"].userId,
      professionalId: createdDemo["admin@demo-hospital.com"].professionalId,
      role: Role.HOSPITAL_ADMINISTRATOR,
      name: "Claire Mbarga",
      department: "Administration",
    },
    {
      userId: createdDemo["director@demo-hospital.com"].userId,
      professionalId: createdDemo["director@demo-hospital.com"].professionalId,
      role: Role.MEDICAL_DIRECTOR,
      name: "Dr. Pierre Essomba",
      department: "Medical Direction",
    },
    {
      userId: createdDemo["doctor@demo-hospital.com"].userId,
      professionalId: createdDemo["doctor@demo-hospital.com"].professionalId,
      role: Role.DOCTOR,
      name: "Dr. Amina Diallo",
      department: "Internal Medicine",
    },
    {
      userId: createdDemo["lab@demo-hospital.com"].userId,
      professionalId: createdDemo["lab@demo-hospital.com"].professionalId,
      role: Role.LABORATORY_OPERATOR,
      name: "Sarah Smith",
      department: "Laboratory",
    },
    {
      userId: createdDemo["pharmacy@demo-hospital.com"].userId,
      professionalId: createdDemo["pharmacy@demo-hospital.com"].professionalId,
      role: Role.PHARMACIST,
      name: "Kwame Mensah",
      department: "Pharmacy",
    },
  ]);

  let staffIndex = 0;
  for (const extra of extraStaff) {
    staffIndex += 1;
    const first = FIRST[staffIndex % FIRST.length];
    const last = LAST[staffIndex % LAST.length];
    const fullName = extra.role === Role.DOCTOR ? `Dr. ${first} ${last}` : `${first} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${staffIndex}@${extra.hospitalId === slm.id ? "st-luke" : extra.hospitalId === rgh.id ? "cuh" : "amc"}.demo`;
    const hash = await password("DemoStaff123!");
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        role: extra.role,
        fullName,
        isDemo: true,
        hospitalId: extra.hospitalId,
        professional: {
          create: {
            fullName,
            professionalRole: extra.role,
            professionalId: `LIC-X-${String(staffIndex).padStart(3, "0")}`,
            qualification: extra.qualification,
            licenseNumber: `LIC-${staffIndex + 2000}`,
            licenseIssuer: "National Licensing Board",
            verificationStatus: VerificationStatus.VERIFIED,
          },
        },
      },
      include: { professional: true },
    });
    await prisma.hospitalStaffMembership.create({
      data: {
        hospitalId: extra.hospitalId,
        professionalId: user.professional!.id,
        userId: user.id,
        role: extra.role,
        department: extra.department,
        status: AffiliationStatus.APPROVED,
        approvedAt: new Date(),
      },
    });
    const list = staffByHospital.get(extra.hospitalId) ?? [];
    list.push({
      userId: user.id,
      professionalId: user.professional!.id,
      role: extra.role,
      name: fullName,
      department: extra.department,
    });
    staffByHospital.set(extra.hospitalId, list);
  }

  const pending = await prisma.user.create({
    data: {
      email: "pending.doctor@st-luke.demo",
      passwordHash: await password("DemoStaff123!"),
      role: Role.DOCTOR,
      fullName: "Dr. Joseph Atangana",
      isDemo: true,
      hospitalId: slm.id,
      professional: {
        create: {
          fullName: "Dr. Joseph Atangana",
          professionalRole: Role.DOCTOR,
          professionalId: "LIC-PEND-001",
          qualification: "MD",
          licenseNumber: "MD-CM-9901",
          licenseIssuer: "Order of Physicians",
          verificationStatus: VerificationStatus.PENDING,
        },
      },
    },
    include: { professional: true },
  });
  await prisma.hospitalStaffMembership.create({
    data: {
      hospitalId: slm.id,
      professionalId: pending.professional!.id,
      userId: pending.id,
      role: Role.DOCTOR,
      department: "Outpatient",
      status: AffiliationStatus.PENDING,
    },
  });

  const johnUser = await prisma.user.create({
    data: {
      email: "patient@demo-hospital.com",
      passwordHash: await password("DemoPatient123!"),
      role: Role.PATIENT,
      fullName: "John Doe",
      isDemo: true,
      hospitalId: slm.id,
    },
  });

  const john = await prisma.patient.create({
    data: {
      publicId: "PAT-00018492",
      hospitalId: slm.id,
      userId: johnUser.id,
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: new Date("1972-03-14"),
      sex: Sex.MALE,
      phone: "+237699184920",
      email: "patient@demo-hospital.com",
      addressLine: "18 Avenue de la Liberté",
      city: "Douala",
      bloodGroup: "O+",
      emergencyName: "Mary Doe",
      emergencyPhone: "+237699184921",
      emergencyRelation: "Spouse",
      allergies: {
        create: {
          substance: "Penicillin",
          reaction: "Anaphylaxis",
          severity: Severity.CRITICAL,
          active: true,
        },
      },
      conditions: {
        create: [
          { name: "Type 2 diabetes", status: "CHRONIC", onsetDate: new Date("2018-06-01") },
          { name: "Hypertension", status: "CHRONIC", onsetDate: new Date("2016-01-12") },
        ],
      },
      procedures: {
        create: {
          hospitalId: slm.id,
          name: "12-lead ECG",
          performedAt: daysAgo(280, 11, 10),
          notes: "ST depression in lateral leads; referred to cardiology.",
        },
      },
    },
  });

  const patients = [john];
  let patientSeq = 10001;
  for (let i = 0; i < 99; i += 1) {
    const hospital = i < 70 ? slm : i < 88 ? rgh : hvc;
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 3) % LAST.length];
    const sex = i % 3 === 0 ? Sex.FEMALE : Sex.MALE;
    const dob = new Date(1955 + (i % 50), i % 12, (i % 27) + 1);
    const patient = await prisma.patient.create({
      data: {
        publicId: pad("PAT", patientSeq),
        hospitalId: hospital.id,
        firstName: first,
        lastName: last,
        dateOfBirth: dob,
        sex,
        phone: `+2376${String(700000000 + i).slice(0, 8)}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@patients.demo`,
        addressLine: `${10 + i} Rue des Hôpitaux`,
        city: pick(CITIES),
        bloodGroup: pick(BLOOD),
        emergencyName: `${pick(FIRST)} ${last}`,
        emergencyPhone: `+2376${String(800000000 + i).slice(0, 8)}`,
        emergencyRelation: pick(["Spouse", "Parent", "Sibling", "Adult child"]),
      },
    });
    patientSeq += 1;
    if (rand() > 0.55) {
      const allergy = pick(ALLERGIES);
      await prisma.patientAllergy.create({ data: { patientId: patient.id, ...allergy } });
    }
    if (rand() > 0.4) {
      await prisma.patientCondition.create({
        data: { patientId: patient.id, name: pick(CONDITIONS), status: "CHRONIC" },
      });
    }
    patients.push(patient);
  }

  const demoDoctor = createdDemo["doctor@demo-hospital.com"];
  const demoLab = createdDemo["lab@demo-hospital.com"];
  const demoPharm = createdDemo["pharmacy@demo-hospital.com"];
  const demoAdmin = createdDemo["admin@demo-hospital.com"];

  const doctorsByHospital = new Map<string, { professionalId: string; userId: string; name: string; department: string }[]>();
  for (const hospital of hospitals) {
    const docs = (staffByHospital.get(hospital.id) ?? []).filter((s) => s.role === Role.DOCTOR);
    doctorsByHospital.set(hospital.id, docs);
  }

  let encounterSeq = 1;
  let rxSeq = 1;
  let labSeq = 1;
  let billed = 0;
  const volume = new Map<string, number>();

  async function addVolume(hospitalId: string, at: Date) {
    const key = `${hospitalId}:${at.toISOString().slice(0, 10)}`;
    volume.set(key, (volume.get(key) ?? 0) + 1);
  }

  async function makeEncounter(opts: {
    patient: (typeof patients)[number];
    daysAgo: number;
    hour: number;
    minute: number;
    clinician: { professionalId: string; userId: string; name: string; department: string };
    status: EncounterStatus;
    complaint: string;
    diagnosis?: { code: string; description: string };
    med?: (typeof MEDS)[number];
    lab?: { testName: string; critical?: boolean; value?: string; unit?: string; reviewed?: boolean };
    followUpDays?: number;
    bill?: boolean;
    actorRole?: Role;
  }) {
    const startedAt = daysAgo(opts.daysAgo, opts.hour, opts.minute);
    const department = opts.clinician.department || "Outpatient";
    const encounter = await prisma.encounter.create({
      data: {
        publicId: pad("ENC", encounterSeq),
        hospitalId: opts.patient.hospitalId,
        patientId: opts.patient.id,
        clinicianId: opts.clinician.professionalId,
        department,
        status: opts.status,
        startedAt,
        completedAt: opts.status === "COMPLETED" ? new Date(startedAt.getTime() + 45 * 60000) : null,
        followUpAt: opts.followUpDays ? daysAgo(opts.daysAgo - opts.followUpDays, 9) : null,
        followUpNotes: opts.followUpDays ? "Return if symptoms persist or worsen." : null,
        clinicalNote: {
          create: {
            chiefComplaint: opts.complaint,
            historyOfPresentIllness: `${opts.complaint} evolving over several days.`,
            observations: "Patient examined. Vital signs recorded.",
            assessment: opts.diagnosis?.description ?? "Clinical assessment documented.",
            isFinal: opts.status === "COMPLETED",
          },
        },
        vitalSigns: {
          create: {
            systolicMmHg: 118 + Math.floor(rand() * 40),
            diastolicMmHg: 70 + Math.floor(rand() * 20),
            heartRate: 68 + Math.floor(rand() * 40),
            temperatureC: 36.4 + rand(),
            spo2: 95 + Math.floor(rand() * 5),
            respiratoryRate: 14 + Math.floor(rand() * 6),
            recordedAt: new Date(startedAt.getTime() + 5 * 60000),
          },
        },
      },
    });
    encounterSeq += 1;
    await addVolume(opts.patient.hospitalId, startedAt);

    await prisma.timelineEvent.createMany({
      data: [
        {
          encounterId: encounter.id,
          patientId: opts.patient.id,
          actorName: opts.clinician.name,
          actorRole: Role.DOCTOR,
          activity: "CONSULTATION_STARTED",
          department,
          summary: "Consultation started",
          createdAt: startedAt,
        },
        {
          encounterId: encounter.id,
          patientId: opts.patient.id,
          actorName: opts.clinician.name,
          actorRole: Role.DOCTOR,
          activity: "CLINICAL_OBSERVATIONS_RECORDED",
          department,
          summary: "Clinical observations recorded",
          createdAt: new Date(startedAt.getTime() + 7 * 60000),
        },
      ],
    });

    if (opts.diagnosis) {
      await prisma.diagnosis.create({
        data: {
          encounterId: encounter.id,
          patientId: opts.patient.id,
          code: opts.diagnosis.code,
          description: opts.diagnosis.description,
          isPrimary: true,
        },
      });
      await prisma.timelineEvent.create({
        data: {
          encounterId: encounter.id,
          patientId: opts.patient.id,
          actorName: opts.clinician.name,
          actorRole: Role.DOCTOR,
          activity: "DIAGNOSIS_CREATED",
          department,
          summary: `Diagnosis recorded: ${opts.diagnosis.description}`,
          createdAt: new Date(startedAt.getTime() + 12 * 60000),
        },
      });
    }

    if (opts.med) {
      const rx = await prisma.prescription.create({
        data: {
          publicId: pad("RX", rxSeq),
          encounterId: encounter.id,
          patientId: opts.patient.id,
          hospitalId: opts.patient.hospitalId,
          status: opts.status === "COMPLETED" ? PrescriptionStatus.DISPENSED : PrescriptionStatus.ACTIVE,
          issuedAt: new Date(startedAt.getTime() + 20 * 60000),
          notes: "Take as prescribed.",
          items: { create: { ...opts.med, dispensedQty: opts.status === "COMPLETED" ? opts.med.quantity : 0 } },
        },
      });
      rxSeq += 1;
      await prisma.timelineEvent.create({
        data: {
          encounterId: encounter.id,
          patientId: opts.patient.id,
          actorName: opts.clinician.name,
          actorRole: Role.DOCTOR,
          activity: "PRESCRIPTION_CREATED",
          department,
          summary: `Prescription issued: ${opts.med.medication}`,
          createdAt: new Date(startedAt.getTime() + 20 * 60000),
        },
      });
      if (opts.status === "COMPLETED") {
        const pharmacist = (staffByHospital.get(opts.patient.hospitalId) ?? []).find((s) => s.role === Role.PHARMACIST);
        if (pharmacist) {
          await prisma.pharmacyDispensing.create({
            data: {
              prescriptionId: rx.id,
              pharmacistId: pharmacist.userId,
              quantity: opts.med.quantity,
              dispensedAt: new Date(startedAt.getTime() + 35 * 60000),
              notes: "Dispensed in full.",
            },
          });
          await prisma.timelineEvent.create({
            data: {
              encounterId: encounter.id,
              patientId: opts.patient.id,
              actorName: pharmacist.name,
              actorRole: Role.PHARMACIST,
              activity: "MEDICATION_DISPENSED",
              department: "Pharmacy",
              summary: `Medication dispensed: ${opts.med.medication}`,
              createdAt: new Date(startedAt.getTime() + 35 * 60000),
            },
          });
        }
      }
    }

    if (opts.lab) {
      const labStaff = (staffByHospital.get(opts.patient.hospitalId) ?? []).find((s) => s.role === Role.LABORATORY_OPERATOR);
      const order = await prisma.laboratoryOrder.create({
        data: {
          publicId: pad("LAB", labSeq),
          encounterId: encounter.id,
          patientId: opts.patient.id,
          hospitalId: opts.patient.hospitalId,
          testName: opts.lab.testName,
          status: opts.lab.value ? (opts.lab.reviewed ? LabOrderStatus.REVIEWED : LabOrderStatus.RESULT_AVAILABLE) : LabOrderStatus.ORDERED,
          isCritical: Boolean(opts.lab.critical),
          orderedAt: new Date(startedAt.getTime() + 15 * 60000),
          collectedAt: opts.lab.value ? new Date(startedAt.getTime() + 40 * 60000) : null,
          processedAt: opts.lab.value ? new Date(startedAt.getTime() + 70 * 60000) : null,
          resultAt: opts.lab.value ? new Date(startedAt.getTime() + 90 * 60000) : null,
          reviewedAt: opts.lab.reviewed ? new Date(startedAt.getTime() + 110 * 60000) : null,
          reviewedById: opts.lab.reviewed ? opts.clinician.userId : null,
          notes: opts.lab.critical ? "CRITICAL RESULT — PHYSICIAN REVIEW REQUIRED" : null,
        },
      });
      labSeq += 1;
      await prisma.timelineEvent.create({
        data: {
          encounterId: encounter.id,
          patientId: opts.patient.id,
          actorName: opts.clinician.name,
          actorRole: Role.DOCTOR,
          activity: "LAB_ORDER_CREATED",
          department,
          summary: `Laboratory test ordered: ${opts.lab.testName}`,
          createdAt: new Date(startedAt.getTime() + 15 * 60000),
        },
      });
      if (opts.lab.value && labStaff) {
        await prisma.laboratoryResult.create({
          data: {
            orderId: order.id,
            value: opts.lab.value,
            unit: opts.lab.unit ?? "",
            referenceRange: "See local reference",
            interpretation: opts.lab.critical ? "Critical — notify physician" : "Within expected range for context",
            isCritical: Boolean(opts.lab.critical),
            fileName: `${order.publicId}.pdf`,
            enteredById: labStaff.userId,
            enteredAt: new Date(startedAt.getTime() + 90 * 60000),
          },
        });
        await prisma.timelineEvent.createMany({
          data: [
            {
              encounterId: encounter.id,
              patientId: opts.patient.id,
              actorName: labStaff.name,
              actorRole: Role.LABORATORY_OPERATOR,
              activity: "LAB_RESULT_CREATED",
              department: "Laboratory",
              summary: `Laboratory result uploaded: ${opts.lab.testName}`,
              createdAt: new Date(startedAt.getTime() + 90 * 60000),
            },
          ],
        });
        if (opts.lab.reviewed) {
          await prisma.timelineEvent.create({
            data: {
              encounterId: encounter.id,
              patientId: opts.patient.id,
              actorName: opts.clinician.name,
              actorRole: Role.DOCTOR,
              activity: "LAB_RESULT_VIEWED",
              department,
              summary: "Doctor reviewed result",
              createdAt: new Date(startedAt.getTime() + 110 * 60000),
            },
          });
        } else if (opts.lab.critical) {
          await prisma.notification.create({
            data: {
              userId: opts.clinician.userId,
              hospitalId: opts.patient.hospitalId,
              patientId: opts.patient.id,
              title: "CRITICAL RESULT — PHYSICIAN REVIEW REQUIRED",
              body: `${opts.lab.testName} for ${opts.patient.firstName} ${opts.patient.lastName} requires review.`,
              kind: "CRITICAL_LAB",
            },
          });
        }
      }
    }

    if (opts.bill && opts.status === "COMPLETED") {
      await prisma.billingRecord.create({
        data: {
          publicId: pad("INV", billed + 1),
          hospitalId: opts.patient.hospitalId,
          patientId: opts.patient.id,
          encounterId: encounter.id,
          amountUsd: 0.3,
          status: InvoiceStatus.ISSUED,
          billedAt: new Date(startedAt.getTime() + 50 * 60000),
        },
      });
      billed += 1;
    }

    await prisma.auditEvent.create({
      data: {
        publicId: pad("AUD", encounterSeq + 8000),
        activity: "CONSULTATION_STARTED",
        actorId: opts.clinician.userId,
        actorName: opts.clinician.name,
        actorRole: Role.DOCTOR,
        hospitalId: opts.patient.hospitalId,
        patientId: opts.patient.id,
        encounterId: encounter.id,
        department,
        createdAt: startedAt,
      },
    });
    await prisma.accessLog.create({
      data: {
        patientId: opts.patient.id,
        userId: opts.clinician.userId,
        hospitalId: opts.patient.hospitalId,
        encounterId: encounter.id,
        activity: "PATIENT_RECORD_VIEWED",
        createdAt: new Date(startedAt.getTime() - 2 * 60000),
      },
    });
    return encounter;
  }

  await makeEncounter({
    patient: john,
    daysAgo: 280,
    hour: 10,
    minute: 42,
    clinician: { professionalId: demoDoctor.professionalId, userId: demoDoctor.userId, name: "Dr. Amina Diallo", department: "Cardiology" },
    status: EncounterStatus.COMPLETED,
    complaint: "Chest pressure radiating to the left arm",
    diagnosis: { code: "I20.0", description: "Unstable angina" },
    med: { medication: "Aspirin", dose: "75 mg", route: "Oral", frequency: "Daily", duration: "90 days", instructions: "Take after food", quantity: 90 },
    lab: { testName: "Troponin I", critical: true, value: "0.08", unit: "ng/mL", reviewed: true },
    bill: true,
  });
  await makeEncounter({
    patient: john,
    daysAgo: 90,
    hour: 9,
    minute: 10,
    clinician: { professionalId: demoDoctor.professionalId, userId: demoDoctor.userId, name: "Dr. Amina Diallo", department: "Internal Medicine" },
    status: EncounterStatus.COMPLETED,
    complaint: "Routine diabetes follow-up",
    diagnosis: { code: "E11", description: "Type 2 diabetes mellitus" },
    med: MEDS[0],
    lab: { testName: "HbA1c", value: "7.4", unit: "%", reviewed: true },
    bill: true,
  });
  await makeEncounter({
    patient: john,
    daysAgo: 21,
    hour: 14,
    minute: 5,
    clinician: { professionalId: demoDoctor.professionalId, userId: demoDoctor.userId, name: "Dr. Amina Diallo", department: "Internal Medicine" },
    status: EncounterStatus.COMPLETED,
    complaint: "Headache and elevated home blood pressure readings",
    diagnosis: { code: "I10", description: "Essential hypertension" },
    med: MEDS[1],
    followUpDays: -7,
    bill: true,
  });

  await prisma.prescription.create({
    data: {
      publicId: pad("RX", rxSeq),
      encounterId: (await prisma.encounter.findFirstOrThrow({ where: { patientId: john.id }, orderBy: { startedAt: "desc" } })).id,
      patientId: john.id,
      hospitalId: slm.id,
      status: PrescriptionStatus.ACTIVE,
      notes: "Current long-term therapy",
      items: {
        create: [
          { ...MEDS[0], dispensedQty: 0 },
          { ...MEDS[1], dispensedQty: 0 },
        ],
      },
    },
  });
  rxSeq += 1;

  for (let i = 0; i < 310; i += 1) {
    const patient = patients[1 + (i % (patients.length - 1))];
    const docs = doctorsByHospital.get(patient.hospitalId) ?? [];
    const clinician = docs[i % Math.max(docs.length, 1)] ?? {
      professionalId: demoDoctor.professionalId,
      userId: demoDoctor.userId,
      name: "Dr. Amina Diallo",
      department: "Outpatient",
    };
    const day = 2 + (i % 88);
    const weekdayBoost = [1, 2, 3].includes(daysAgo(day).getDay()) ? 8 : 11;
    const status =
      i % 37 === 0 ? EncounterStatus.IN_PROGRESS : i % 41 === 0 ? EncounterStatus.CANCELLED : EncounterStatus.COMPLETED;
    const diagnosis = pick(DIAGNOSES);
    await makeEncounter({
      patient,
      daysAgo: day,
      hour: weekdayBoost + (i % 6),
      minute: (i * 7) % 60,
      clinician,
      status,
      complaint: diagnosis.description,
      diagnosis: status === EncounterStatus.CANCELLED ? undefined : diagnosis,
      med: i % 2 === 0 ? pick(MEDS) : undefined,
      lab:
        i % 3 === 0
          ? {
              testName: pick(TESTS),
              critical: i % 29 === 0,
              value: i % 5 === 0 ? undefined : String((rand() * 10).toFixed(1)),
              unit: "U",
              reviewed: i % 29 !== 0,
            }
          : undefined,
      followUpDays: i % 23 === 0 ? -3 : undefined,
      bill: status === EncounterStatus.COMPLETED && i % 11 !== 0,
    });
  }

  const dailyRows = [...volume.entries()].map(([key, encounters]) => {
    const [hospitalId, day] = key.split(":");
    return { hospitalId, day: new Date(`${day}T00:00:00.000Z`), encounters };
  });
  if (dailyRows.length) {
    await prisma.dailyVolume.createMany({ data: dailyRows });
  }

  for (const hospital of hospitals) {
    const rows = dailyRows.filter((r) => r.hospitalId === hospital.id).sort((a, b) => a.day.getTime() - b.day.getTime());
    if (rows.length >= 14) {
      const last7 = rows.slice(-7);
      const mean = last7.reduce((s, r) => s + r.encounters, 0) / last7.length;
      await prisma.forecast.create({
        data: {
          hospitalId: hospital.id,
          kind: "PATIENT_VOLUME",
          targetDate: daysAgo(-1),
          metric: "encounters",
          low: Math.max(0, Math.round(mean * 0.85)),
          high: Math.round(mean * 1.15),
          point: Math.round(mean),
          confidence: "MEDIUM",
          method: "7-day moving average ±1.5σ",
          note: "Deterministic forecast from hospital encounter history.",
        },
      });
    }
  }

  await prisma.notification.create({
    data: {
      userId: demoDoctor.userId,
      hospitalId: slm.id,
      patientId: john.id,
      title: "Follow-up reminder",
      body: "John Doe (PAT-00018492) has an overdue hypertension follow-up.",
      kind: "FOLLOW_UP",
    },
  });
  await prisma.notification.create({
    data: {
      userId: demoAdmin.userId,
      hospitalId: slm.id,
      title: "DEMO DATA",
      body: "This environment is populated with synthetic demo data only. No real patient information is present.",
      kind: "ADMIN",
    },
  });
  void demoLab;
  void demoPharm;
  void DEPARTMENTS;

  const encounterCount = await prisma.encounter.count();
  const patientCount = await prisma.patient.count();
  const staffCount = await prisma.healthcareProfessional.count();
  console.log(`Seed complete: ${hospitals.length} hospitals, ${staffCount} professionals, ${patientCount} patients, ${encounterCount} encounters.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
