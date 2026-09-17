import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, isWeekday } from "@/lib/dates";
import { ensureDelivery } from "@/lib/billing";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const subscription = await prisma.subscription.findFirst({
    where: { OR: [{ id }, { customerId: id }], customer: { ownerId: session.userId }, status: "PAUSED" },
    orderBy: { cycleStart: "desc" }
  });
  if (!subscription) return NextResponse.json({ error: "Paused subscription not found." }, { status: 404 });
  const customerId = subscription.customerId;
  const pause = await prisma.pausePeriod.findFirst({ where: { customerId, endDate: null }, orderBy: { startDate: "desc" } });
  if (!pause) return NextResponse.json({ error: "Open pause not found." }, { status: 409 });
  const date = startOfDay(new Date());
  await prisma.$transaction([
    prisma.customer.update({ where: { id: customerId }, data: { status: "ACTIVE" } }),
    prisma.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE" } }),
    prisma.pausePeriod.update({ where: { id: pause.id }, data: { endDate: date } })
  ]);
  if (isWeekday(date)) await ensureDelivery(customerId, subscription.id, date);
  return NextResponse.json({ ok: true, status: "ACTIVE", subscriptionId: subscription.id, customerId });
}
