import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { ensureTodayDelivery, startOfDay } from "@/lib/billing";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getSessionUserId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findFirst({ where: { id, ownerId } });
  if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  if (customer.status === "ACTIVE") return NextResponse.json({ error: "Customer is already active." }, { status: 409 });

  const openPause = await prisma.pausePeriod.findFirst({
    where: { customerId: id, endDate: null },
    orderBy: { startDate: "desc" }
  });
  if (!openPause) return NextResponse.json({ error: "No open pause found." }, { status: 409 });

  await prisma.$transaction([
    prisma.customer.update({ where: { id }, data: { status: "ACTIVE" } }),
    prisma.pausePeriod.update({ where: { id: openPause.id }, data: { endDate: startOfDay(new Date()) } })
  ]);

  await ensureTodayDelivery(id);
  return NextResponse.json({ ok: true, status: "ACTIVE" });
}
