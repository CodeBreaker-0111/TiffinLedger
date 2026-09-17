import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const outbox = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: { select: { name: true, phone: true } } }
  });
  return NextResponse.json({ outbox });
}
