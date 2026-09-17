import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/dates";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const subscription = await prisma.subscription.findFirst({
    where: { OR: [{ id }, { customerId: id }], customer: { ownerId: session.userId }, status: "ACTIVE" },
    orderBy: { cycleStart: "desc" }
  });
  if (!subscription) return NextResponse.json({ error: "Active subscription not found." }, { status: 404 });
  const customerId = subscription.customerId;
  const date = startOfDay(new Date());
  await prisma.$transaction([
    prisma.customer.update({ where: { id: customerId }, data: { status: "PAUSED" } }),
    prisma.subscription.update({ where: { id: subscription.id }, data: { status: "PAUSED" } }),
    prisma.pausePeriod.create({ data: { customerId, subscriptionId: subscription.id, startDate: date } }),
    prisma.delivery.deleteMany({ where: { customerId, date } })
  ]);
  return NextResponse.json({ ok: true, status: "PAUSED", subscriptionId: subscription.id, customerId });
}
