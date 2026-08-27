import { describe, expect, it } from "vitest";
import { getPlan, pharmacyMayIssuePrescription } from "./plans";

describe("plans", () => {
  it("returns the hospital bundle by default", () => {
    expect(getPlan("unknown").code).toBe("HOSPITAL");
    expect(getPlan("CLINIC").monthlyFeeUsd).toBe(199);
  });

  it("allows pharmacy prescriptions only after a completed consultation", () => {
    expect(pharmacyMayIssuePrescription("COMPLETED")).toBe(true);
    expect(pharmacyMayIssuePrescription("IN_PROGRESS")).toBe(false);
    expect(pharmacyMayIssuePrescription("DRAFT")).toBe(false);
  });
});
