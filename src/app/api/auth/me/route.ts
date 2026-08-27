import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api";
import { apiHandler } from "@/lib/handler";
import { ROLE_HOME, roleLabel } from "@/lib/rbac";

export const GET = apiHandler(async () => {
  const user = await requireSession();
  return NextResponse.json({
    user: { ...user, roleLabel: roleLabel(user.role), home: ROLE_HOME[user.role] },
  });
});
