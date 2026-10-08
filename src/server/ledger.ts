import { type CostCategory, Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { LedgerError } from './errors'
import {
  assertCanClose,
  assertCanPay,
  assertCanSpend,
  assertPositive,
  assertSalePrice,
  carResult,
} from './finance'
import { messages } from './messages'
import { toDecimal } from './money'
import { loadSummary } from './summary'

const categories = new Set<CostCategory>([
  'REPAIR',
  'PARTS',
  'TRANSPORT',
  'OTHER',
])

function guard(fn: () => void) {
  try {
    fn()
  } catch (error) {
    if (error instanceof LedgerError) throw error
    if (error instanceof Error) throw new LedgerError(error.message)
    throw error
  }
}

function requiredText(value: string, emptyMessage: string, max: number) {
  const text = value.trim()
  if (!text) throw new LedgerError(emptyMessage)
  if (text.length > max) throw new LedgerError(messages.textLong)
  return text
}

function cleanOptional(value: string | null | undefined) {
  if (value == null) return null
  const text = value.trim()
  if (!text) return null
  if (text.length > 300) throw new LedgerError(messages.textLong)
  return text
}

function assertDate(value: Date) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new LedgerError(messages.invalidDate)
  }
}

async function lockOpenCycle(tx: Prisma.TransactionClient, cycleId: string) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "BudgetCycle" WHERE id = ${cycleId} AND status = 'OPEN'::"CycleStatus" FOR UPDATE
  `
  if (rows.length > 0) return
  const exists = await tx.budgetCycle.findUnique({
    where: { id: cycleId },
    select: { id: true },
  })
  throw new LedgerError(exists ? messages.cycleClosed : messages.cycleMissing)
}

export async function openCycle(input: {
  userId: string
  title: string
  amount: bigint
}) {
  const title = requiredText(input.title, messages.cycleTitle, 80)
  guard(() => assertPositive(input.amount))

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.budgetCycle.findFirst({
        where: { status: 'OPEN' },
        select: { id: true },
      })
      if (existing) throw new LedgerError(messages.cycleOpenExists)

      const cycle = await tx.budgetCycle.create({
        data: {
          title,
          initialAmount: toDecimal(input.amount),
          openedById: input.userId,
          capitalEntries: {
            create: {
              kind: 'INITIAL',
              amount: toDecimal(input.amount),
              createdById: input.userId,
            },
          },
        },
      })
      return cycle.id
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new LedgerError(messages.cycleOpenExists)
    }
    throw error
  }
}

export async function addExtraMoney(input: {
  userId: string
  cycleId: string
  amount: bigint
  note?: string | null
}) {
  guard(() => assertPositive(input.amount))
  const note = cleanOptional(input.note)

  return prisma.$transaction(async (tx) => {
    await lockOpenCycle(tx, input.cycleId)
    await tx.capitalEntry.create({
      data: {
        cycleId: input.cycleId,
        kind: 'EXTRA',
        amount: toDecimal(input.amount),
        note,
        createdById: input.userId,
      },
    })
    return input.cycleId
  })
}

export async function buyCar(input: {
  userId: string
  cycleId: string
  title: string
  year?: number | null
  color?: string | null
  plate?: string | null
  purchasePrice: bigint
  purchasedAt: Date
  note?: string | null
}) {
  const title = requiredText(input.title, messages.carTitle, 120)
  guard(() => assertPositive(input.purchasePrice))
  assertDate(input.purchasedAt)
  if (input.year != null && (input.year < 1300 || input.year > 2100)) {
    throw new LedgerError(messages.invalidYear)
  }
  const color = cleanOptional(input.color)
  const plate = cleanOptional(input.plate)
  const note = cleanOptional(input.note)

  return prisma.$transaction(async (tx) => {
    await lockOpenCycle(tx, input.cycleId)
    const summary = await loadSummary(tx, input.cycleId)
    guard(() => assertCanSpend(summary.cash, input.purchasePrice))
    const car = await tx.car.create({
      data: {
        cycleId: input.cycleId,
        title,
        year: input.year ?? null,
        color,
        plate,
        purchasePrice: toDecimal(input.purchasePrice),
        purchasedAt: input.purchasedAt,
        note,
        boughtById: input.userId,
      },
    })
    return car.id
  })
}

export async function addCost(input: {
  userId: string
  carId: string
  category: CostCategory
  amount: bigint
  description: string
  spentAt: Date
}) {
  if (!categories.has(input.category))
    throw new LedgerError(messages.invalidCategory)
  const description = requiredText(
    input.description,
    messages.costDescription,
    300,
  )
  guard(() => assertPositive(input.amount))
  assertDate(input.spentAt)

  return prisma.$transaction(async (tx) => {
    const car = await tx.car.findUnique({
      where: { id: input.carId },
      select: { id: true, cycleId: true },
    })
    if (!car) throw new LedgerError(messages.carMissing)
    await lockOpenCycle(tx, car.cycleId)
    const fresh = await tx.car.findUnique({
      where: { id: input.carId },
      select: { status: true },
    })
    if (fresh?.status !== 'IN_STOCK') throw new LedgerError(messages.carSold)
    await tx.cost.create({
      data: {
        carId: input.carId,
        category: input.category,
        amount: toDecimal(input.amount),
        description,
        spentAt: input.spentAt,
        createdById: input.userId,
      },
    })
    return input.carId
  })
}

export async function sellCar(input: {
  carId: string
  salePrice: bigint
  soldAt: Date
}) {
  guard(() => assertSalePrice(input.salePrice))
  assertDate(input.soldAt)

  return prisma.$transaction(async (tx) => {
    const car = await tx.car.findUnique({
      where: { id: input.carId },
      select: { id: true, cycleId: true },
    })
    if (!car) throw new LedgerError(messages.carMissing)
    await lockOpenCycle(tx, car.cycleId)
    const fresh = await tx.car.findUnique({
      where: { id: input.carId },
      include: { costs: { select: { amount: true } } },
    })
    if (fresh?.status !== 'IN_STOCK') throw new LedgerError(messages.carSold)

    const costs = fresh.costs.reduce(
      (sum, cost) => sum + BigInt(cost.amount.toFixed(0)),
      0n,
    )
    const result = carResult(
      BigInt(fresh.purchasePrice.toFixed(0)),
      costs,
      input.salePrice,
    )
    await tx.car.update({
      where: { id: fresh.id },
      data: {
        status: 'SOLD',
        salePrice: toDecimal(input.salePrice),
        soldAt: input.soldAt,
        totalCost: toDecimal(result.totalCost),
        profit: toDecimal(result.profit),
        companyShare: toDecimal(result.companyShare),
        managerShare: toDecimal(result.managerShare),
      },
    })
    return fresh.id
  })
}

export async function recordPayout(input: {
  userId: string
  cycleId: string
  amount: bigint
  note?: string | null
  paidAt: Date
}) {
  guard(() => assertPositive(input.amount))
  assertDate(input.paidAt)
  const note = cleanOptional(input.note)

  return prisma.$transaction(async (tx) => {
    await lockOpenCycle(tx, input.cycleId)
    const summary = await loadSummary(tx, input.cycleId)
    guard(() => assertCanPay(summary.managerPayable, input.amount))
    await tx.payout.create({
      data: {
        cycleId: input.cycleId,
        amount: toDecimal(input.amount),
        note,
        paidAt: input.paidAt,
        createdById: input.userId,
      },
    })
    return input.cycleId
  })
}

export async function updatePayoutReceipt(input: {
  payoutId: string
  receiptNumber?: string | null
}) {
  const receiptNumber = cleanOptional(input.receiptNumber)
  const payout = await prisma.payout.findUnique({
    where: { id: input.payoutId },
    select: { cycleId: true },
  })
  if (!payout) throw new LedgerError('پرداخت پیدا نشد')

  await prisma.payout.update({
    where: { id: input.payoutId },
    data: { receiptNumber },
  })
  return payout.cycleId
}

export async function updateCapitalReceipt(input: {
  entryId: string
  receiptNumber?: string | null
}) {
  const receiptNumber = cleanOptional(input.receiptNumber)
  const entry = await prisma.capitalEntry.findUnique({
    where: { id: input.entryId },
    select: { cycleId: true },
  })
  if (!entry) throw new LedgerError('شارژ پیدا نشد')

  await prisma.capitalEntry.update({
    where: { id: input.entryId },
    data: { receiptNumber },
  })
  return entry.cycleId
}

export async function updateCostReceipt(input: {
  costId: string
  receiptNumber?: string | null
}) {
  const receiptNumber = cleanOptional(input.receiptNumber)
  const cost = await prisma.cost.findUnique({
    where: { id: input.costId },
    select: { carId: true },
  })
  if (!cost) throw new LedgerError('هزینه پیدا نشد')

  await prisma.cost.update({
    where: { id: input.costId },
    data: { receiptNumber },
  })
  return cost.carId
}

export async function updateCarPurchaseReceipt(input: {
  carId: string
  receiptNumber?: string | null
}) {
  const receiptNumber = cleanOptional(input.receiptNumber)
  await prisma.car.update({
    where: { id: input.carId },
    data: { purchaseReceiptNumber: receiptNumber },
  })
  return input.carId
}

export async function updateCarSaleReceipt(input: {
  carId: string
  receiptNumber?: string | null
}) {
  const receiptNumber = cleanOptional(input.receiptNumber)
  await prisma.car.update({
    where: { id: input.carId },
    data: { saleReceiptNumber: receiptNumber },
  })
  return input.carId
}

export async function deleteCycle(input: { cycleId: string }) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "BudgetCycle" WHERE id = ${input.cycleId} FOR UPDATE
    `
    if (rows.length === 0) throw new LedgerError(messages.cycleMissing)
    await tx.budgetCycle.delete({ where: { id: input.cycleId } })
    return input.cycleId
  })
}

export async function closeCycle(input: { cycleId: string }) {
  return prisma.$transaction(async (tx) => {
    await lockOpenCycle(tx, input.cycleId)
    const summary = await loadSummary(tx, input.cycleId)
    guard(() => assertCanClose(summary.inStockCount))
    await tx.budgetCycle.update({
      where: { id: input.cycleId },
      data: { status: 'CLOSED', closedAt: new Date() },
    })
    return input.cycleId
  })
}
