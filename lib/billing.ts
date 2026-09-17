import { prisma } from "@/lib/prisma";

export function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function endOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

export function monthBounds(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
    throw new Error("Month must be YYYY-MM");
  }
  return {
    start: new Date(year, monthNumber - 1, 1),
    end: new Date(year, monthNumber, 0, 23, 59, 59, 999),
    daysInMonth: new Date(year, monthNumber, 0).getDate()
  };
}

export async function getBill(customerId: string, month: string) {
  const { start, end, daysInMonth } = monthBounds(month);

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      pauses: {
        where: {
          startDate: { lte: end },
          OR: [{ endDate: null }, { endDate: { gte: start } }]
        },
        orderBy: { startDate: "asc" }
      },
      deliveries: {
        where: { date: { gte: start, lte: end }, served: true },
        orderBy: { date: "asc" }
      }
    }
  });

  if (!customer) return null;

  const weekdays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), i + 1);
    return d.getDay() !== 0 && d.getDay() !== 6 ? d : null;
  }).filter(Boolean) as Date[];

  const servedDates = new Set(
    customer.deliveries.map((d) => startOfDay(d.date).getTime())
  );

  const deliveredDays = servedDates.size;
  const plannedWeekdays = weekdays.length;
  const dailyRate = plannedWeekdays ? customer.planPrice / plannedWeekdays : 0;
  const amount = Math.round(dailyRate * deliveredDays);

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      planPrice: customer.planPrice,
      status: customer.status
    },
    month,
    plannedWeekdays,
    deliveredDays,
    pausedDays: Math.max(0, plannedWeekdays - deliveredDays),
    dailyRate: Number(dailyRate.toFixed(2)),
    amount,
    deliveryDates: customer.deliveries.map((d) => d.date.toISOString().slice(0, 10)),
    pauses: customer.pauses.map((p) => ({
      startDate: p.startDate.toISOString().slice(0, 10),
      endDate: p.endDate ? p.endDate.toISOString().slice(0, 10) : null
    }))
  };
}

export async function ensureTodayDelivery(customerId: string) {
  const now = new Date();
  const day = now.getDay();
  if (day === 0 || day === 6) return;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer || customer.status === "PAUSED") return;

  await prisma.delivery.upsert({
    where: {
      customerId_date: {
        customerId,
        date: startOfDay(now)
      }
    },
    update: { served: true },
    create: { customerId, date: startOfDay(now), served: true }
  });
}
