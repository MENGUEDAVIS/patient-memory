import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { requireSession } from "@/lib/api";
import { z } from "zod";

export const GET = apiHandler(async () => {
  const user = await requireSession();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ notifications });
});

export const PATCH = apiHandler(async (request) => {
  const user = await requireSession();
  const body = z.object({ id: z.string() }).parse(await request.json());
  await prisma.notification.updateMany({
    where: { id: body.id, userId: user.id },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
});
