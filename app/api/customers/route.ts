import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^[0-9+\-\s]{7,20}$/),
  planPrice: z.number().int().positive()
});

export async function GET(req: Request) {
  const ownerId = await getSessionUserId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const status = url.searchParams.get("status") || "ALL";
  const sort = url.searchParams.get("sort") || "name";
  const order = url.searchParams.get("order") === "desc" ? "desc" : "asc";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 8)));

  const where: any = {
    ownerId,
    ...(status !== "ALL" ? { status } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] } : {})
  };

  const allowedSort = ["name", "planPrice", "status", "createdAt"];
  const orderBy = allowedSort.includes(sort) ? { [sort]: order } : { name: "asc" };

  const [customers, total, active, paused] = await Promise.all([
    prisma.customer.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.customer.count({ where }),
    prisma.customer.count({ where: { ownerId, status: "ACTIVE" } }),
    prisma.customer.count({ where: { ownerId, status: "PAUSED" } })
  ]);

  return NextResponse.json({
    customers,
    stats: { total, active, paused },
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) }
  });
}

export async function POST(req: Request) {
  const ownerId = await getSessionUserId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Name, phone and a positive plan price are required." }, { status: 400 });

  try {
    const customer = await prisma.customer.create({ data: { ...parsed.data, ownerId } });
    return NextResponse.json(customer, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A customer with this phone already exists." }, { status: 409 });
  }
}
