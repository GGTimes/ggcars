import type { Prisma, PrismaClient } from '@prisma/client'
import {
  type BudgetEvent,
  type Summary,
  summarize,
  totalBudgetFromEvents,
} from './finance'
import { decimalToBigint } from './money'

export type LoadedSummary = Summary & { totalBudget: bigint }

type Db = Prisma.TransactionClient | PrismaClient

export async function loadSummary(
  db: Db,
  cycleId: string,
): Promise<LoadedSummary> {
  const entries = await db.capitalEntry.findMany({
    where: { cycleId },
    select: { kind: true, amount: true, createdAt: true },
  })
  const cars = await db.car.findMany({
    where: { cycleId },
    select: {
      purchasePrice: true,
      salePrice: true,
      companyShare: true,
      managerShare: true,
      createdAt: true,
      soldAt: true,
      costs: { select: { amount: true, createdAt: true } },
    },
  })
  const payouts = await db.payout.findMany({
    where: { cycleId },
    select: { amount: true, createdAt: true },
  })
  const events: BudgetEvent[] = []
  for (const entry of entries) {
    events.push({
      at: entry.createdAt.getTime(),
      kind: 'capital',
      amount: decimalToBigint(entry.amount),
    })
  }
  for (const car of cars) {
    events.push({
      at: car.createdAt.getTime(),
      kind: 'purchase',
      amount: decimalToBigint(car.purchasePrice),
    })
    if (car.salePrice != null && car.soldAt != null) {
      events.push({
        at: car.soldAt.getTime(),
        kind: 'sale',
        amount: decimalToBigint(car.salePrice),
      })
    }
    for (const cost of car.costs) {
      events.push({
        at: cost.createdAt.getTime(),
        kind: 'cost',
        amount: decimalToBigint(cost.amount),
      })
    }
  }
  for (const payout of payouts) {
    events.push({
      at: payout.createdAt.getTime(),
      kind: 'payout',
      amount: decimalToBigint(payout.amount),
    })
  }

  return {
    ...summarize({
      initialAmount: entries
        .filter((entry) => entry.kind === 'INITIAL')
        .reduce((sum, entry) => sum + decimalToBigint(entry.amount), 0n),
      extraAmount: entries
        .filter((entry) => entry.kind === 'EXTRA')
        .reduce((sum, entry) => sum + decimalToBigint(entry.amount), 0n),
      payouts: payouts.reduce(
        (sum, payout) => sum + decimalToBigint(payout.amount),
        0n,
      ),
      cars: cars.map((car) => ({
        purchasePrice: decimalToBigint(car.purchasePrice),
        costs: car.costs.reduce(
          (sum, cost) => sum + decimalToBigint(cost.amount),
          0n,
        ),
        salePrice:
          car.salePrice == null ? null : decimalToBigint(car.salePrice),
        companyShare:
          car.companyShare == null ? null : decimalToBigint(car.companyShare),
        managerShare:
          car.managerShare == null ? null : decimalToBigint(car.managerShare),
      })),
    }),
    totalBudget: totalBudgetFromEvents(events),
  }
}
