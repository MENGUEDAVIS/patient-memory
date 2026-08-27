import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { requirePerm, requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import { billingConfigSchema } from "@/lib/schemas";
import { startOfDay } from "@/lib/dates";

export const GET = apiHandler(async () => {
  const user = await requireSession();
  await requirePerm(user, "billing:manage");
  const hospitalId = await hospitalScope(user);
  const monthStart = new Date(startOfDay());
  monthStart.setDate(1);
  const [config, records, encounters] = await Promise.all([
    prisma.hospitalBillingConfig.findUnique({ where: { hospitalId } }),
    prisma.billingRecord.findMany({
      where: { hospitalId, billedAt: { gte: monthStart } },
      include: { patient: true, encounter: true },
      orderBy: { billedAt: "desc" },
      take: 50,
    }),
    prisma.encounter.count({ where: { hospitalId, status: "COMPLETED", completedAt: { gte: monthStart } } }),
  ]);
  const encounterRevenue = records.reduce((sum, row) => sum + Number(row.amountUsd), 0);
  const subscription = Number(config?.monthlyFeeUsd ?? 500);
  return NextResponse.json({
    config,
    month: {
      encounters,
      billableEncounters: records.length,
      subscriptionRevenue: subscription,
      encounterRevenue,
      totalPlatformRevenue: subscription + encounterRevenue,
    },
    records,
  });
});

export const PATCH = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "settings:manage");
  const hospitalId = await hospitalScope(user);
  const body = billingConfigSchema.parse(await request.json());
  const config = await prisma.hospitalBillingConfig.upsert({
    where: { hospitalId },
    update: body,
    create: { hospitalId, ...body },
  });
  return NextResponse.json({ config });
});
