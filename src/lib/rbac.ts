import { Role } from "@prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  HOSPITAL_ADMINISTRATOR: "/admin",
  MEDICAL_DIRECTOR: "/director",
  DOCTOR: "/doctor",
  LABORATORY_OPERATOR: "/lab",
  PHARMACIST: "/pharmacy",
  PATIENT: "/me",
};

export const NAV: Record<Role, { href: string; label: string }[]> = {
  HOSPITAL_ADMINISTRATOR: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/patients", label: "Patients" },
    { href: "/admin/clinical", label: "Clinical Activity" },
    { href: "/admin/staff", label: "Healthcare Workers" },
    { href: "/admin/laboratory", label: "Laboratory" },
    { href: "/admin/pharmacy", label: "Pharmacy" },
    { href: "/admin/intelligence", label: "AI Intelligence" },
    { href: "/admin/audit", label: "Audit Logs" },
    { href: "/admin/billing", label: "Billing" },
    { href: "/admin/insurance", label: "Insurance" },
    { href: "/admin/settings", label: "Settings" },
  ],
  MEDICAL_DIRECTOR: [
    { href: "/director", label: "Dashboard" },
    { href: "/director/clinical", label: "Clinical Activity" },
    { href: "/director/staff", label: "Healthcare Workers" },
    { href: "/director/intelligence", label: "AI Intelligence" },
    { href: "/director/audit", label: "Audit Logs" },
  ],
  DOCTOR: [
    { href: "/doctor", label: "Dashboard" },
    { href: "/doctor/patients", label: "My Patients" },
    { href: "/doctor/consultations", label: "Consultations" },
    { href: "/doctor/laboratory", label: "Laboratory" },
    { href: "/doctor/prescriptions", label: "Prescriptions" },
    { href: "/doctor/tasks", label: "Tasks" },
  ],
  LABORATORY_OPERATOR: [
    { href: "/lab", label: "Dashboard" },
    { href: "/lab/orders", label: "Orders" },
    { href: "/lab/results", label: "Results" },
    { href: "/lab/critical", label: "Critical Results" },
  ],
  PHARMACIST: [
    { href: "/pharmacy", label: "Dashboard" },
    { href: "/pharmacy/prescriptions", label: "Prescriptions" },
    { href: "/pharmacy/prescribe", label: "Issue prescription" },
    { href: "/pharmacy/dispensing", label: "Dispensing" },
  ],
  PATIENT: [
    { href: "/me", label: "My Health" },
    { href: "/me/consultations", label: "My Consultations" },
    { href: "/me/prescriptions", label: "Prescriptions" },
    { href: "/me/laboratory", label: "Laboratory" },
    { href: "/me/access", label: "Access History" },
  ],
};

export type Permission =
  | "patients:search"
  | "patients:write"
  | "ehr:read"
  | "clinical:write"
  | "lab:view"
  | "lab:enter"
  | "lab:review"
  | "pharmacy:view"
  | "pharmacy:dispense"
  | "pharmacy:prescribe"
  | "audit:read"
  | "billing:manage"
  | "insurance:verify"
  | "staff:manage"
  | "intelligence:read"
  | "settings:manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  HOSPITAL_ADMINISTRATOR: [
    "patients:search",
    "patients:write",
    "ehr:read",
    "lab:view",
    "pharmacy:view",
    "audit:read",
    "billing:manage",
    "insurance:verify",
    "staff:manage",
    "intelligence:read",
    "settings:manage",
  ],
  MEDICAL_DIRECTOR: [
    "patients:search",
    "ehr:read",
    "lab:view",
    "pharmacy:view",
    "audit:read",
    "insurance:verify",
    "staff:manage",
    "intelligence:read",
  ],
  DOCTOR: [
    "patients:search",
    "ehr:read",
    "clinical:write",
    "lab:view",
    "lab:review",
    "pharmacy:view",
  ],
  LABORATORY_OPERATOR: ["patients:search", "lab:view", "lab:enter"],
  PHARMACIST: ["patients:search", "pharmacy:view", "pharmacy:dispense", "pharmacy:prescribe"],
  PATIENT: ["ehr:read"],
};

export function hasPermission(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

const STAFF_ROLES: Role[] = [
  "HOSPITAL_ADMINISTRATOR",
  "MEDICAL_DIRECTOR",
  "DOCTOR",
  "LABORATORY_OPERATOR",
  "PHARMACIST",
];

export function isStaff(role: Role) {
  return STAFF_ROLES.includes(role);
}

export function canSearchPatients(role: Role) {
  return hasPermission(role, "patients:search");
}

export function canWriteClinical(role: Role) {
  return hasPermission(role, "clinical:write");
}

export function canManageLab(role: Role) {
  return hasPermission(role, "lab:view");
}

export function canEnterLabResults(role: Role) {
  return hasPermission(role, "lab:enter");
}

export function canDispense(role: Role) {
  return hasPermission(role, "pharmacy:dispense");
}

export function canViewAudit(role: Role) {
  return hasPermission(role, "audit:read");
}

export function canManageBilling(role: Role) {
  return hasPermission(role, "billing:manage");
}

export function canVerifyInsurance(role: Role) {
  return hasPermission(role, "insurance:verify");
}

export function canReviewLab(role: Role) {
  return hasPermission(role, "lab:review");
}

export function pathAllowed(role: Role, pathname: string) {
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/login" || pathname === "/" || pathname === "/register") return true;
  const home = ROLE_HOME[role];
  const prefix = home.split("/")[1];
  return pathname === home || pathname.startsWith(`/${prefix}/`);
}

export function roleLabel(role: Role) {
  switch (role) {
    case "HOSPITAL_ADMINISTRATOR":
      return "Hospital Administrator";
    case "MEDICAL_DIRECTOR":
      return "Medical Director";
    case "DOCTOR":
      return "Doctor";
    case "LABORATORY_OPERATOR":
      return "Laboratory Operator";
    case "PHARMACIST":
      return "Pharmacist";
    case "PATIENT":
      return "Patient";
  }
}
