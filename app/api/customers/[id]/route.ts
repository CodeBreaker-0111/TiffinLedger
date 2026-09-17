import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const where = session.role === "OWNER"
    ? { id, ownerId: session.userId }
    : { id, accountUserId: session.userId };
  const customer = await prisma.customer.findFirst({
    where,
    include: {
      subscriptions: true,
      pauses: true,
      deliveries: { orderBy: { date: "desc" } }
    }
  });
  if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  return NextResponse.json(customer);
}
