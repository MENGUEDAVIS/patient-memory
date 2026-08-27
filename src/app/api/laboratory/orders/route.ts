import { NextResponse } from "next/server";
import { LabOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError, requirePerm, requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import { labOrderSchema } from "@/lib/schemas";
import { nextPublicId } from "@/lib/ids";
import { recordTimeline } from "@/lib/timeline";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/csrf";
import { z } from "zod";

export const GET = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "lab:view");
  const hospitalId = await hospitalScope(user);
  const url = new URL(request.url);
  const status = url.searchParams.get("status") as LabOrderStatus | null;
  const critical = url.searchParams.get("critical") === "1";
  const orders = await prisma.laboratoryOrder.findMany({
    where: {
      hospitalId,
      status: status || undefined,
      isCritical: critical ? true : undefined,
    },
    include: { patient: true, result: true, encounter: true },
    orderBy: { orderedAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ orders });
});

export const POST = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "clinical:write");
  const hospitalId = await hospitalScope(user);
  const body = labOrderSchema.parse(await request.json());
  const encounter = await prisma.encounter.findFirst({
    where: { publicId: body.encounterPublicId, hospitalId },
    include: { clinicalNote: true },
  });
  if (!encounter) throw new HttpError(404, "Encounter was not found.");
  const last = await prisma.laboratoryOrder.findFirst({ orderBy: { publicId: "desc" }, select: { publicId: true } });
  const order = await prisma.laboratoryOrder.create({
    data: {
      publicId: nextPublicId("LAB", last?.publicId),
      encounterId: encounter.id,
      patientId: encounter.patientId,
      hospitalId,
      testName: body.testName,
      notes: body.notes,
    },
  });
  await recordTimeline({
    encounterId: encounter.id,
    patientId: encounter.patientId,
    actorName: user.fullName,
    actorRole: user.role,
    activity: "LAB_ORDER_CREATED",
    department: encounter.department,
    summary: `Laboratory test ordered: ${body.testName}`,
  });
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    patientId: encounter.patientId,
    encounterId: encounter.id,
    activity: "LAB_ORDER_CREATED",
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  return NextResponse.json({ order }, { status: 201 });
});

const statusSchema = z.object({
  orderPublicId: z.string(),
  status: z.enum(["ORDERED", "SAMPLE_COLLECTED", "PROCESSING", "RESULT_AVAILABLE", "REVIEWED"]),
});

export const PATCH = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "lab:enter");
  const hospitalId = await hospitalScope(user);
  const body = statusSchema.parse(await request.json());
  const order = await prisma.laboratoryOrder.findFirst({
    where: { publicId: body.orderPublicId, hospitalId },
  });
  if (!order) throw new HttpError(404, "Laboratory order was not found.");
  const now = new Date();
  const orderUpdate: {
    status: LabOrderStatus;
    collectedAt?: Date;
    processedAt?: Date;
  } = { status: body.status };
  if (body.status === "SAMPLE_COLLECTED") orderUpdate.collectedAt = now;
  if (body.status === "PROCESSING") orderUpdate.processedAt = now;
  const updated = await prisma.laboratoryOrder.update({
    where: { id: order.id },
    data: orderUpdate,
  });
  await recordTimeline({
    encounterId: order.encounterId,
    patientId: order.patientId,
    actorName: user.fullName,
    actorRole: user.role,
    activity: "LAB_STATUS_UPDATED",
    department: "Laboratory",
    summary: `Laboratory status: ${body.status.replace(/_/g, " ").toLowerCase()}`,
  });
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    patientId: order.patientId,
    encounterId: order.encounterId,
    activity: "LAB_STATUS_UPDATED",
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  return NextResponse.json({ order: updated });
});
