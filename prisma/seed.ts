import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.pausePeriod.deleteMany();
  await prisma.subscriptionTransfer.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const owner = await prisma.user.create({
    data: {
      name: "Demo Owner",
      email: "owner@tiffin.local",
      passwordHash: await bcrypt.hash("demo1234", 10),
      role: "OWNER"
    }
  });

  const seedCustomers = [
    { name: "Aarav Sharma", phone: "9876543210", planPrice: 3000 },
    { name: "Priya Mehta", phone: "9123456780", email: "priya@tiffin.local", planPrice: 2800 },
    { name: "Rohan Gupta", phone: "9988776655", planPrice: 3200 }
  ];

  const customers = [];
  for (const item of seedCustomers) {
    let accountUserId: string | null = null;
    if (item.email) {
      const account = await prisma.user.create({
        data: {
          name: item.name,
          email: item.email,
          passwordHash: await bcrypt.hash("demo1234", 10),
          role: "CUSTOMER"
        }
      });
      accountUserId = account.id;
    }
    customers.push(await prisma.customer.create({
      data: {
        ownerId: owner.id,
        accountUserId,
        name: item.name,
        phone: item.phone,
        email: item.email,
        planPrice: item.planPrice
      }
    }));
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const subscriptions = [];
  for (const customer of customers) {
    subscriptions.push(await prisma.subscription.create({
      data: {
        customerId: customer.id,
        planPrice: customer.planPrice,
        cycleStart: start,
        cycleEnd: end
      }
    }));
  }

  for (let day = 1; day <= now.getDate(); day++) {
    const date = new Date(now.getFullYear(), now.getMonth(), day);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    for (let i = 0; i < 2; i++) {
      if (i === 1 && day >= 10 && day <= 14) continue;
      await prisma.delivery.create({
        data: {
          customerId: customers[i].id,
          subscriptionId: subscriptions[i].id,
          date
        }
      });
    }
  }

  await prisma.pausePeriod.create({
    data: {
      customerId: customers[1].id,
      subscriptionId: subscriptions[1].id,
      startDate: new Date(now.getFullYear(), now.getMonth(), 10),
      endDate: new Date(now.getFullYear(), now.getMonth(), 14)
    }
  });

  console.log("Seed complete");
  console.log("Owner: owner@tiffin.local / demo1234");
  console.log("Customer: priya@tiffin.local / demo1234");
}

main().catch(console.error).finally(() => prisma.$disconnect());
