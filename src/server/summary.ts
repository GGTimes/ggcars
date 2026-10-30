import type { Prisma, PrismaClient } from '@prisma/client'
import {
  type BudgetEvent,
  type PartnerInput,
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
    select: {
      kind: true,
      amount: true,
      createdAt: true,
      partnerId: true,
      partner: {
        select: {
          id: true,
          name: true,
          user: { select: { id: true, role: true } },
        },
      },
    },
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
      capitalShares: {
        select: {
          amount: true,
          partnerId: true,
          partner: {
            select: {
              id: true,
              name: true,
              user: { select: { id: true, role: true } },
            },
          },
        },
      },
    },
  })
  const payouts = await db.payout.findMany({
    where: { cycleId },
    select: {
      amount: true,
      createdAt: true,
      partnerId: true,
      partner: { select: { user: { select: { role: true } } } },
    },
  })
  const partners = new Map<string, PartnerInput>()
  const ensurePartner = (
    partner: {
      id: string
      name: string
      user: { id: string; role: 'OWNER' | 'MANAGER' | 'PARTNER' } | null
    },
    partnerId: string,
  ) => {
    const current = partners.get(partnerId)
    if (current) return current
    const created: PartnerInput = {
      id: partner.id,
      name: partner.name,
      isManager: partner.user?.role === 'MANAGER',
      userId: partner.user?.id ?? null,
      capital: 0n,
      profitShare: 0n,
      paid: 0n,
    }
    partners.set(partnerId, created)
    return created
  }
  const events: BudgetEvent[] = []
  for (const entry of entries) {
    const amount = decimalToBigint(entry.amount)
    events.push({
      at: entry.createdAt.getTime(),
      kind: 'capital',
      amount,
    })
    if (entry.partnerId && entry.partner) {
      ensurePartner(entry.partner, entry.partnerId).capital += amount
    }
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
    for (const share of car.capitalShares) {
      if (!share.partner) continue
      ensurePartner(share.partner, share.partnerId).profitShare +=
        decimalToBigint(share.amount)
    }
  }
  let managerPayouts = 0n
  for (const payout of payouts) {
    const amount = decimalToBigint(payout.amount)
    events.push({
      at: payout.createdAt.getTime(),
      kind: 'payout',
      amount,
    })
    if (payout.partnerId == null || payout.partner?.user?.role === 'MANAGER') {
      managerPayouts += amount
      continue
    }
    const partner = partners.get(payout.partnerId)
    if (partner) partner.paid += amount
  }

  return {
    ...summarize({
      initialAmount: entries
        .filter((entry) => entry.kind === 'INITIAL')
        .reduce((sum, entry) => sum + decimalToBigint(entry.amount), 0n),
      extraAmount: entries
        .filter((entry) => entry.kind === 'EXTRA')
        .reduce((sum, entry) => sum + decimalToBigint(entry.amount), 0n),
      payouts: managerPayouts,
      partners: [...partners.values()],
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
