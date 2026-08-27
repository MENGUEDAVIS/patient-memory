import { randomBytes } from "crypto";

export function padNumericId(prefix: string, n: number, width = 8) {
  return `${prefix}-${String(n).padStart(width, "0")}`;
}

export function nextPublicId(prefix: string, last?: string | null) {
  const n = last ? Number(last.split("-")[1] || 0) + 1 : 1;
  return padNumericId(prefix, Number.isFinite(n) ? n : 1);
}

export function randomPublicId(prefix: string, width = 8) {
  const n = parseInt(randomBytes(4).toString("hex"), 16) % 10 ** width;
  return padNumericId(prefix, n === 0 ? 1 : n, width);
}

export function yearsBetween(dob: Date, now = new Date()) {
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

export function sixDigitOtp() {
  const n = (parseInt(randomBytes(3).toString("hex"), 16) % 900000) + 100000;
  return String(n);
}
