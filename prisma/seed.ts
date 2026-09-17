import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@tiffin.local" },
    update: {},
    create: {
      name: "Tiffin Owner",
      email: "owner@tiffin.local",
      passwordHash
    }
  });

  await prisma.customer.deleteMany({ where: { ownerId: owner.id } });

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        ownerId: owner.id,
        name: "Aarav Sharma",
        phone: "9876543210",
        planPrice: 3000
      }
    }),
    prisma.customer.create({
      data: {
        ownerId: owner.id,
        name: "Priya Mehta",
        phone: "9123456780",
        planPrice: 2800
      }
    }),
    prisma.customer.create({
      data: {
        ownerId: owner.id,
        name: "Rohan Gupta",
        phone: "9988776655",
        planPrice: 3200,
        status: "PAUSED"
      }
    })
  ]);

  const weekdays = [];
  for (let d = 1; d <= today.getDate(); d++) {
    const date = new Date(today.getFullYear(), today.getMonth(), d);
    const day = date.getDay();
    if (day !== 0 && day !== 6) weekdays.push(date);
  }

  await prisma.delivery.createMany({
    data: weekdays.map((date) => ({
      customerId: customers[0].id,
      date
    })),
    skipDuplicates: true
  });

  const pauseStart = new Date(today.getFullYear(), today.getMonth(), 10);
  const pauseEnd = new Date(today.getFullYear(), today.getMonth(), 14);
  await prisma.pausePeriod.create({
    data: {
      customerId: customers[1].id,
      startDate: pauseStart,
      endDate: pauseEnd
    }
  });

  await prisma.delivery.createMany({
    data: weekdays
      .filter((date) => date < pauseStart || date > pauseEnd)
      .map((date) => ({ customerId: customers[1].id, date })),
    skipDuplicates: true
  });

  await prisma.pausePeriod.create({
    data: {
      customerId: customers[2].id,
      startDate: new Date(today.getFullYear(), today.getMonth(), 5),
      endDate: null
    }
  });

  await prisma.delivery.createMany({
    data: weekdays
      .filter((date) => date < new Date(today.getFullYear(), today.getMonth(), 5))
      .map((date) => ({ customerId: customers[2].id, date })),
    skipDuplicates: true
  });

  console.log("Seed complete.");
  console.log("Login: owner@tiffin.local / demo1234");
  void monthStart;
}

main().finally(() => prisma.$disconnect());
