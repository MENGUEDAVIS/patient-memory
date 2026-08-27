import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError, requirePerm, requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import { recordTimeline } from "@/lib/timeline";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/csrf";
import { z } from "zod";

const schema = z.object({ orderPublicId: z.string() });

export const POST = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "lab:review");
  const hospitalId = await hospitalScope(user);
  const body = schema.parse(await request.json());
  const order = await prisma.laboratoryOrder.findFirst({
    where: { publicId: body.orderPublicId, hospitalId },
    include: { result: true },
  });
  if (!order?.result) throw new HttpError(404, "No laboratory result is available for review.");
  await prisma.laboratoryOrder.update({
    where: { id: order.id },
    data: { status: "REVIEWED", reviewedAt: new Date(), reviewedById: user.id },
  });
  await recordTimeline({
    encounterId: order.encounterId,
    patientId: order.patientId,
    actorName: user.fullName,
    actorRole: user.role,
    activity: "LAB_RESULT_VIEWED",
    department: "Laboratory",
    summary: "Doctor reviewed result",
  });
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    patientId: order.patientId,
    encounterId: order.encounterId,
    activity: "LAB_RESULT_VIEWED",
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  return NextResponse.json({ ok: true });
});
