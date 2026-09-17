import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBill } from "@/lib/billing";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getSessionUserId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await prisma.customer.findFirst({ where: { id, ownerId }, select: { id: true } });
  if (!owned) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const month = new URL(req.url).searchParams.get("month") || new Date().toISOString().slice(0, 7);
  try {
    const bill = await getBill(id, month);
    return NextResponse.json(bill);
  } catch {
    return NextResponse.json({ error: "Month must be in YYYY-MM format." }, { status: 400 });
  }
}
