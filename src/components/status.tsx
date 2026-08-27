import { Badge } from "@/components/ui";

export function statusTone(status: string) {
  const value = status.toUpperCase();
  if (["COMPLETED", "DISPENSED", "REVIEWED", "VERIFIED", "APPROVED", "PAID", "ACTIVE"].includes(value)) return "success" as const;
  if (["PENDING", "DRAFT", "IN_PROGRESS", "ORDERED", "PROCESSING", "SAMPLE_COLLECTED", "RESULT_AVAILABLE", "PARTIALLY_DISPENSED", "REQUIRES_REVIEW", "MOCK"].includes(value)) {
    return "warning" as const;
  }
  if (["CRITICAL", "CANCELLED", "REJECTED", "SUSPENDED", "FAILED", "NOT_VERIFIED", "VOID"].includes(value)) return "danger" as const;
  return "neutral" as const;
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge tone={statusTone(value)}>{value.replace(/_/g, " ")}</Badge>;
}

export function severityTone(value: string) {
  if (value === "CRITICAL") return "danger" as const;
  if (value === "HIGH") return "warning" as const;
  if (value === "MODERATE") return "info" as const;
  return "neutral" as const;
}
