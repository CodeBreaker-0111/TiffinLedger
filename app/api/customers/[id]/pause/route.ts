import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { startOfDay } from "@/lib/billing";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getSessionUserId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findFirst({ where: { id, ownerId } });
  if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  if (customer.status === "PAUSED") return NextResponse.json({ error: "Customer is already paused." }, { status: 409 });

  const now = startOfDay(new Date());
  await prisma.$transaction([
    prisma.customer.update({ where: { id }, data: { status: "PAUSED" } }),
    prisma.pausePeriod.create({ data: { customerId: id, startDate: now } }),
    prisma.delivery.deleteMany({ where: { customerId: id, date: now } })
  ]);

  return NextResponse.json({ ok: true, status: "PAUSED" });
}
