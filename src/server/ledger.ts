import { type CostCategory, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { LedgerError } from './errors'
import {
  assertCanClose,
  assertCanPay,
  assertCanSpend,
  assertPositive,
  assertSalePrice,
  carResult,
  sharesForSale,
} from './finance'
import { messages } from './messages'
import { decimalToBigint, toDecimal } from './money'
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

type Funding = { partnerId: string | null; isManager: boolean }

async function upsertUserPartner(
  tx: Prisma.TransactionClient,
  userId: string,
  name: string,
) {
  const existing = await tx.partner.findUnique({ where: { userId } })
  if (!existing) return tx.partner.create({ data: { userId, name } })
  if (existing.name === name) return existing
  return tx.partner.update({ where: { id: existing.id }, data: { name } })
}

async function resolveFunding(
  tx: Prisma.TransactionClient,
  input: {
    role: 'OWNER' | 'MANAGER'
    userId: string
    source: 'COMPANY' | 'MANAGER' | 'PARTNER'
    partnerName?: string | null
  },
): Promise<Funding> {
  if (input.source === 'COMPANY') return { partnerId: null, isManager: false }
  if (input.source === 'MANAGER') {
    if (input.role === 'MANAGER') {
      const user = await tx.user.findUnique({
        where: { id: input.userId },
        select: { name: true },
      })
      if (!user) throw new LedgerError(messages.managerMissing)
      const partner = await upsertUserPartner(tx, input.userId, user.name)
      return { partnerId: partner.id, isManager: true }
    }
    const manager = await tx.user.findFirst({
      where: { role: 'MANAGER' },
      select: { id: true, name: true },
    })
    if (!manager) throw new LedgerError(messages.managerMissing)
    const partner = await upsertUserPartner(tx, manager.id, manager.name)
    return { partnerId: partner.id, isManager: true }
  }
  const name = requiredText(input.partnerName ?? '', messages.partnerName, 80)
  const manager = await tx.user.findFirst({
    where: { role: 'MANAGER' },
    select: { id: true, name: true },
  })
  if (manager && manager.name.trim() === name) {
    const partner = await upsertUserPartner(tx, manager.id, manager.name)
    return { partnerId: partner.id, isManager: true }
  }
  const existing = await tx.partner.findFirst({ where: { name, userId: null } })
  const partner =
    existing ?? (await tx.partner.create({ data: { name, userId: null } }))
  return { partnerId: partner.id, isManager: false }
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
  receiptNumber?: string | null
  source?: 'COMPANY' | 'MANAGER' | 'PARTNER'
  partnerName?: string | null
}) {
  const title = requiredText(input.title, messages.cycleTitle, 80)
  guard(() => assertPositive(input.amount))
  const receiptNumber = cleanOptional(input.receiptNumber)

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.budgetCycle.findFirst({
        where: { status: 'OPEN' },
        select: { id: true },
      })
      if (existing) throw new LedgerError(messages.cycleOpenExists)
      const funding = await resolveFunding(tx, {
        role: 'OWNER',
        userId: input.userId,
        source: input.source ?? 'COMPANY',
        partnerName: input.partnerName,
      })

      const cycle = await tx.budgetCycle.create({
        data: {
          title,
          initialAmount: toDecimal(input.amount),
          openedById: input.userId,
          capitalEntries: {
            create: {
              kind: 'INITIAL',
              amount: toDecimal(input.amount),
              receiptNumber,
              partnerId: funding.partnerId,
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
  role: 'OWNER' | 'MANAGER'
  cycleId: string
  amount: bigint
  note?: string | null
  receiptNumber?: string | null
  source?: 'COMPANY' | 'MANAGER' | 'PARTNER'
  partnerName?: string | null
}) {
  guard(() => assertPositive(input.amount))
  const note = cleanOptional(input.note)
  const receiptNumber = cleanOptional(input.receiptNumber)
  const source =
    input.role === 'MANAGER' ? 'MANAGER' : (input.source ?? 'COMPANY')

  return prisma.$transaction(async (tx) => {
    await lockOpenCycle(tx, input.cycleId)
    const funding = await resolveFunding(tx, {
      role: input.role,
      userId: input.userId,
      source,
      partnerName: input.partnerName,
    })
    await tx.capitalEntry.create({
      data: {
        cycleId: input.cycleId,
        kind: 'EXTRA',
        amount: toDecimal(input.amount),
        note,
        receiptNumber,
        partnerId: funding.partnerId,
        createdById: input.userId,
      },
    })
    return input.cycleId
  })
}

export async function buyCar(input: {
  userId: string
  role: 'OWNER' | 'MANAGER'
  cycleId: string
  title: string
  year?: number | null
  color?: string | null
  plate?: string | null
  purchasePrice: bigint
  purchasedAt: Date
  note?: string | null
  receiptNumber?: string | null
  source?: 'COMPANY' | 'MANAGER' | 'PARTNER'
  partnerName?: string | null
  fundedAmount?: bigint | null
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
  const receiptNumber = cleanOptional(input.receiptNumber)

  const source = input.source ?? 'COMPANY'

  return prisma.$transaction(async (tx) => {
    await lockOpenCycle(tx, input.cycleId)
    if (source !== 'COMPANY') {
      const funded = input.fundedAmount ?? input.purchasePrice
      guard(() => assertPositive(funded))
      if (funded > input.purchasePrice) {
        throw new LedgerError(messages.fundedTooMuch)
      }
      const funding = await resolveFunding(tx, {
        role: input.role,
        userId: input.userId,
        source,
        partnerName: input.partnerName,
      })
      await tx.capitalEntry.create({
        data: {
          cycleId: input.cycleId,
          kind: 'EXTRA',
          amount: toDecimal(funded),
          note: `خرید از جیب: ${title}`,
          receiptNumber,
          partnerId: funding.partnerId,
          createdById: input.userId,
        },
      })
    }
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
        purchaseReceiptNumber: receiptNumber,
        note,
        boughtById: input.userId,
      },
    })
    return car.id
  })
}

export async function addCost(input: {
  userId: string
  role: 'OWNER' | 'MANAGER'
  carId: string
  category: CostCategory
  amount: bigint
  description: string
  spentAt: Date
  receiptNumber?: string | null
  source?: 'COMPANY' | 'MANAGER' | 'PARTNER'
  partnerName?: string | null
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
  const receiptNumber = cleanOptional(input.receiptNumber)

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
    const source = input.source ?? 'COMPANY'
    let partnerId: string | null = null
    if (source !== 'COMPANY') {
      const funding = await resolveFunding(tx, {
        role: input.role,
        userId: input.userId,
        source,
        partnerName: input.partnerName,
      })
      partnerId = funding.partnerId
      await tx.capitalEntry.create({
        data: {
          cycleId: car.cycleId,
          kind: 'EXTRA',
          amount: toDecimal(input.amount),
          note: `خرج از جیب: ${description}`,
          receiptNumber,
          partnerId,
          createdById: input.userId,
        },
      })
    }
    await tx.cost.create({
      data: {
        carId: input.carId,
        category: input.category,
        amount: toDecimal(input.amount),
        description,
        receiptNumber,
        partnerId,
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
  receiptNumber?: string | null
}) {
  guard(() => assertSalePrice(input.salePrice))
  assertDate(input.soldAt)
  const receiptNumber = cleanOptional(input.receiptNumber)

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
      (sum, cost) => sum + decimalToBigint(cost.amount),
      0n,
    )
    const result = carResult(
      decimalToBigint(fresh.purchasePrice),
      costs,
      input.salePrice,
    )
    const entries = await tx.capitalEntry.findMany({
      where: { cycleId: car.cycleId },
      select: { amount: true, partnerId: true },
    })
    let companyCapital = 0n
    const partnerCapital = new Map<string, bigint>()
    for (const entry of entries) {
      const amount = decimalToBigint(entry.amount)
      if (!entry.partnerId) companyCapital += amount
      else {
        partnerCapital.set(
          entry.partnerId,
          (partnerCapital.get(entry.partnerId) ?? 0n) + amount,
        )
      }
    }
    const shares = sharesForSale(result.profit, [
      { key: 'company', capital: companyCapital },
      ...[...partnerCapital.entries()].map(([key, capital]) => ({
        key,
        capital,
      })),
    ])
    await tx.car.update({
      where: { id: fresh.id },
      data: {
        status: 'SOLD',
        salePrice: toDecimal(input.salePrice),
        soldAt: input.soldAt,
        saleReceiptNumber: receiptNumber,
        totalCost: toDecimal(result.totalCost),
        profit: toDecimal(result.profit),
        companyShare: toDecimal(shares.companyShare),
        managerShare: toDecimal(shares.salesShare),
      },
    })
    const partnerShares = shares.partnerShares.filter(
      (share) => share.amount !== 0n,
    )
    if (partnerShares.length > 0) {
      await tx.carCapitalShare.createMany({
        data: partnerShares.map((share) => ({
          carId: fresh.id,
          partnerId: share.key,
          amount: toDecimal(share.amount),
        })),
      })
    }
    return fresh.id
  })
}

export async function recordPayout(input: {
  userId: string
  cycleId: string
  amount: bigint
  note?: string | null
  paidAt: Date
  receiptNumber?: string | null
  partnerId?: string | null
}) {
  guard(() => assertPositive(input.amount))
  assertDate(input.paidAt)
  const note = cleanOptional(input.note)
  const receiptNumber = cleanOptional(input.receiptNumber)

  return prisma.$transaction(async (tx) => {
    await lockOpenCycle(tx, input.cycleId)
    let partnerId: string | null = null
    if (input.partnerId) {
      const partner = await tx.partner.findUnique({
        where: { id: input.partnerId },
        select: { id: true, user: { select: { role: true } } },
      })
      if (!partner) throw new LedgerError(messages.partnerMissing)
      if (partner.user?.role !== 'MANAGER') partnerId = partner.id
    }
    const summary = await loadSummary(tx, input.cycleId)
    if (partnerId) {
      const partner = summary.partners.find((item) => item.id === partnerId)
      const payable = partner?.payable ?? 0n
      guard(() => {
        assertPositive(input.amount)
        if (input.amount > payable)
          throw new Error(messages.payoutTooMuchPartner)
      })
    } else {
      guard(() => assertCanPay(summary.managerPayable, input.amount))
    }
    await tx.payout.create({
      data: {
        cycleId: input.cycleId,
        amount: toDecimal(input.amount),
        note,
        receiptNumber,
        partnerId,
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

export async function grantPartnerAccess(input: {
  partnerId: string
  email: string
  password: string
}) {
  const email = input.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new LedgerError(messages.invalidEmail)
  }
  if (input.password.length < 8) throw new LedgerError(messages.passwordShort)
  const partner = await prisma.partner.findUnique({
    where: { id: input.partnerId },
    include: { user: { select: { id: true, role: true } } },
  })
  if (!partner) throw new LedgerError(messages.partnerMissing)
  if (partner.user && partner.user.role !== 'PARTNER') {
    throw new LedgerError(messages.forbidden)
  }
  const passwordHash = await bcrypt.hash(input.password, 12)
  try {
    if (partner.user) {
      await prisma.user.update({
        where: { id: partner.user.id },
        data: { email, passwordHash, name: partner.name },
      })
      return partner.id
    }
    const user = await prisma.user.create({
      data: {
        name: partner.name,
        email,
        passwordHash,
        role: 'PARTNER',
      },
    })
    await prisma.partner.update({
      where: { id: partner.id },
      data: { userId: user.id },
    })
    return partner.id
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new LedgerError(messages.emailTaken)
    }
    throw error
  }
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
