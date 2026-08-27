import { describe, expect, it } from "vitest";
import { resolveDatabaseUrl } from "./database-url";

describe("resolveDatabaseUrl", () => {
  it("adds pgbouncer for Neon pooler hosts and drops channel_binding", () => {
    const result = resolveDatabaseUrl(
      "postgresql://u:p@ep-x-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    );
    expect(result).toContain("pgbouncer=true");
    expect(result).not.toContain("channel_binding");
    expect(result).toContain("sslmode=require");
  });

  it("returns undefined when missing", () => {
    expect(resolveDatabaseUrl(undefined)).toBeUndefined();
  });
});
