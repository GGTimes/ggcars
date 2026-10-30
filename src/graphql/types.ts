import {
  CapitalKind,
  CarStatus,
  CostCategory,
  CycleStatus,
  Role,
} from '@prisma/client'
import prisma from '@/lib/prisma'
import { requireOwner, requireStaff, requireUser } from '@/server/auth'
import type { PartnerSummary } from '@/server/finance'
import {
  addCost,
  addExtraMoney,
  buyCar,
  closeCycle,
  deleteCycle,
  grantPartnerAccess,
  openCycle,
  recordPayout,
  sellCar,
  updateCapitalReceipt,
  updateCarPurchaseReceipt,
  updateCarSaleReceipt,
  updateCostReceipt,
  updatePayoutReceipt,
} from '@/server/ledger'
import { decimalToBigint } from '@/server/money'
import type { LoadedSummary } from '@/server/summary'
import { loadSummary } from '@/server/summary'
import type { SessionUser } from '@/types/session'
import { builder } from './builder'

const RoleEnum = builder.enumType(Role, { name: 'Role' })
const CycleStatusEnum = builder.enumType(CycleStatus, { name: 'CycleStatus' })
const CapitalKindEnum = builder.enumType(CapitalKind, { name: 'CapitalKind' })
const CarStatusEnum = builder.enumType(CarStatus, { name: 'CarStatus' })
const CostCategoryEnum = builder.enumType(CostCategory, {
  name: 'CostCategory',
})
const FundingSourceEnum = builder.enumType('FundingSource', {
  values: ['COMPANY', 'MANAGER', 'PARTNER'] as const,
})

function isOwner(user: { role: string } | null) {
  return user?.role === 'OWNER'
}

function isPartner(user: { role: string } | null) {
  return user?.role === 'PARTNER'
}

function viewerStakes(
  summary: LoadedSummary,
  user: { id: string; role: string } | null,
) {
  if (user?.role === 'MANAGER') {
    return summary.partners.filter((partner) => partner.isManager)
  }
  if (user?.role === 'PARTNER') {
    return summary.partners.filter((partner) => partner.userId === user.id)
  }
  return []
}

function partnerCycleWhere(userId: string) {
  return {
    OR: [
      { capitalEntries: { some: { partner: { userId } } } },
      { payouts: { some: { partner: { userId } } } },
      {
        cars: {
          some: { capitalShares: { some: { partner: { userId } } } },
        },
      },
    ],
  }
}

const PartnerStake = builder
  .objectRef<PartnerSummary>('PartnerStake')
  .implement({
    fields: (t) => ({
      id: t.exposeString('id'),
      name: t.exposeString('name'),
      isManager: t.exposeBoolean('isManager'),
      capital: t.field({
        type: 'Money',
        resolve: (partner) => partner.capital,
      }),
      profitShare: t.field({
        type: 'Money',
        resolve: (partner) => partner.profitShare,
      }),
      paid: t.field({
        type: 'Money',
        resolve: (partner) => partner.paid,
      }),
      payable: t.field({
        type: 'Money',
        resolve: (partner) => partner.payable,
      }),
    }),
  })

const Viewer = builder.objectRef<SessionUser>('Viewer').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    email: t.exposeString('email'),
    role: t.field({
      type: RoleEnum,
      resolve: (user) => user.role,
    }),
  }),
})

const CycleSummaryType = builder
  .objectRef<LoadedSummary>('CycleSummary')
  .implement({
    fields: (t) => ({
      initialAmount: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          isPartner(ctx.user) ? 0n : summary.initialAmount,
      }),
      extraAmount: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          isPartner(ctx.user) ? 0n : summary.extraAmount,
      }),
      cash: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          isPartner(ctx.user) ? 0n : summary.cash,
      }),
      inventoryCost: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          isPartner(ctx.user) ? 0n : summary.inventoryCost,
      }),
      companyShare: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          isOwner(ctx.user) ? summary.companyShare : 0n,
      }),
      managerShare: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          isPartner(ctx.user) ? 0n : summary.managerShare,
      }),
      managerPayable: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          isPartner(ctx.user) ? 0n : summary.managerPayable,
      }),
      companyPosition: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          isOwner(ctx.user) ? summary.companyPosition : 0n,
      }),
      totalBudget: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          isPartner(ctx.user) ? 0n : summary.totalBudget,
      }),
      capitalTotal: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          isPartner(ctx.user) ? 0n : summary.capital,
      }),
      companyCapital: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          isOwner(ctx.user) ? summary.companyCapital : 0n,
      }),
      partnerCapital: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          isOwner(ctx.user) ? summary.partnerCapital : 0n,
      }),
      myCapital: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          viewerStakes(summary, ctx.user).reduce(
            (sum, partner) => sum + partner.capital,
            0n,
          ),
      }),
      myCapitalShare: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          viewerStakes(summary, ctx.user).reduce(
            (sum, partner) => sum + partner.profitShare,
            0n,
          ),
      }),
      myPaid: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          viewerStakes(summary, ctx.user).reduce(
            (sum, partner) => sum + partner.paid,
            0n,
          ),
      }),
      myPayable: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          viewerStakes(summary, ctx.user).reduce(
            (sum, partner) => sum + partner.payable,
            0n,
          ),
      }),
      partners: t.field({
        type: [PartnerStake],
        resolve: (summary, _args, ctx) =>
          isOwner(ctx.user) ? summary.partners : [],
      }),
      sales: t.field({
        type: 'Money',
        resolve: (summary, _args, ctx) =>
          isPartner(ctx.user) ? 0n : summary.sales,
      }),
      inStockCount: t.int({
        resolve: (summary, _args, ctx) =>
          isPartner(ctx.user) ? 0 : summary.inStockCount,
      }),
      soldCount: t.int({
        resolve: (summary, _args, ctx) =>
          isPartner(ctx.user) ? 0 : summary.soldCount,
      }),
    }),
  })

builder.prismaObject('Cost', {
  fields: (t) => ({
    id: t.exposeID('id'),
    category: t.expose('category', { type: CostCategoryEnum }),
    amount: t.field({
      type: 'Money',
      resolve: (cost) => decimalToBigint(cost.amount),
    }),
    description: t.exposeString('description'),
    receiptNumber: t.exposeString('receiptNumber', { nullable: true }),
    spentAt: t.expose('spentAt', { type: 'DateTime' }),
    paidBy: t.string({
      nullable: true,
      select: {
        partner: { select: { name: true, userId: true } },
      },
      resolve: (cost, _args, ctx) => {
        const partner = cost.partner
        if (!partner) return null
        if (isOwner(ctx.user)) return partner.name
        if (
          (ctx.user?.role === 'MANAGER' || ctx.user?.role === 'PARTNER') &&
          partner.userId === ctx.user.id
        ) {
          return partner.name
        }
        return null
      },
    }),
  }),
})

builder.prismaObject('CapitalEntry', {
  fields: (t) => ({
    id: t.exposeID('id'),
    kind: t.expose('kind', { type: CapitalKindEnum }),
    amount: t.field({
      type: 'Money',
      resolve: (entry) => decimalToBigint(entry.amount),
    }),
    note: t.exposeString('note', { nullable: true }),
    receiptNumber: t.exposeString('receiptNumber', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    partner: t.relation('partner', { nullable: true }),
  }),
})

builder.prismaObject('Partner', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    linked: t.boolean({
      select: { userId: true },
      resolve: (partner) => partner.userId != null,
    }),
    email: t.string({
      nullable: true,
      select: { user: { select: { email: true } } },
      resolve: (partner, _args, ctx) =>
        isOwner(ctx.user) ? (partner.user?.email ?? null) : null,
    }),
  }),
})

builder.prismaObject('CarCapitalShare', {
  fields: (t) => ({
    id: t.exposeID('id'),
    amount: t.field({
      type: 'Money',
      resolve: (share) => decimalToBigint(share.amount),
    }),
    partner: t.relation('partner'),
  }),
})

builder.prismaObject('Payout', {
  fields: (t) => ({
    id: t.exposeID('id'),
    amount: t.field({
      type: 'Money',
      resolve: (payout) => decimalToBigint(payout.amount),
    }),
    note: t.exposeString('note', { nullable: true }),
    receiptNumber: t.exposeString('receiptNumber', { nullable: true }),
    paidAt: t.expose('paidAt', { type: 'DateTime' }),
    partner: t.relation('partner', { nullable: true }),
  }),
})

builder.prismaObject('Car', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    year: t.exposeInt('year', { nullable: true }),
    color: t.exposeString('color', { nullable: true }),
    plate: t.exposeString('plate', { nullable: true }),
    status: t.expose('status', { type: CarStatusEnum }),
    purchasePrice: t.field({
      type: 'Money',
      resolve: (car, _args, ctx) =>
        isPartner(ctx.user) ? 0n : decimalToBigint(car.purchasePrice),
    }),
    purchasedAt: t.expose('purchasedAt', { type: 'DateTime' }),
    purchaseReceiptNumber: t.string({
      nullable: true,
      select: { purchaseReceiptNumber: true },
      resolve: (car, _args, ctx) =>
        isPartner(ctx.user) ? null : car.purchaseReceiptNumber,
    }),
    salePrice: t.field({
      type: 'Money',
      nullable: true,
      resolve: (car, _args, ctx) => {
        if (isPartner(ctx.user) || car.salePrice == null) return null
        return decimalToBigint(car.salePrice)
      },
    }),
    soldAt: t.expose('soldAt', { type: 'DateTime', nullable: true }),
    saleReceiptNumber: t.string({
      nullable: true,
      select: { saleReceiptNumber: true },
      resolve: (car, _args, ctx) =>
        isPartner(ctx.user) ? null : car.saleReceiptNumber,
    }),
    totalCost: t.field({
      type: 'Money',
      nullable: true,
      resolve: (car, _args, ctx) => {
        if (isPartner(ctx.user) || car.totalCost == null) return null
        return decimalToBigint(car.totalCost)
      },
    }),
    profit: t.field({
      type: 'Money',
      nullable: true,
      resolve: (car, _args, ctx) => {
        if (isPartner(ctx.user) || car.profit == null) return null
        return decimalToBigint(car.profit)
      },
    }),
    companyShare: t.field({
      type: 'Money',
      nullable: true,
      resolve: (car, _args, ctx) => {
        if (!isOwner(ctx.user) || car.companyShare == null) return null
        return decimalToBigint(car.companyShare)
      },
    }),
    managerShare: t.field({
      type: 'Money',
      nullable: true,
      resolve: (car, _args, ctx) => {
        if (isPartner(ctx.user) || car.managerShare == null) return null
        return decimalToBigint(car.managerShare)
      },
    }),
    note: t.string({
      nullable: true,
      select: { note: true },
      resolve: (car, _args, ctx) => (isPartner(ctx.user) ? null : car.note),
    }),
    costs: t.relation('costs', {
      query: (_args, ctx) => ({
        orderBy: { spentAt: 'asc' as const },
        where: isPartner(ctx.user)
          ? { partner: { userId: ctx.user?.id } }
          : undefined,
      }),
    }),
    capitalShares: t.relation('capitalShares', {
      query: (_args, ctx) => ({
        where:
          ctx.user?.role === 'MANAGER' || ctx.user?.role === 'PARTNER'
            ? { partner: { userId: ctx.user.id } }
            : undefined,
      }),
    }),
    cycle: t.relation('cycle'),
  }),
})

builder.prismaObject('BudgetCycle', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    status: t.expose('status', { type: CycleStatusEnum }),
    initialAmount: t.field({
      type: 'Money',
      resolve: (cycle, _args, ctx) =>
        isPartner(ctx.user) ? 0n : decimalToBigint(cycle.initialAmount),
    }),
    openedAt: t.expose('openedAt', { type: 'DateTime' }),
    closedAt: t.expose('closedAt', { type: 'DateTime', nullable: true }),
    summary: t.field({
      type: CycleSummaryType,
      resolve: (cycle) => loadSummary(prisma, cycle.id),
    }),
    capitalEntries: t.relation('capitalEntries', {
      query: (_args, ctx) => ({
        orderBy: { createdAt: 'asc' as const },
        where:
          ctx.user?.role === 'MANAGER' || ctx.user?.role === 'PARTNER'
            ? { partner: { userId: ctx.user.id } }
            : undefined,
      }),
    }),
    payouts: t.relation('payouts', {
      query: (_args, ctx) => ({
        orderBy: { paidAt: 'desc' as const },
        where:
          ctx.user?.role === 'MANAGER'
            ? { partnerId: null }
            : ctx.user?.role === 'PARTNER'
              ? { partner: { userId: ctx.user.id } }
              : undefined,
      }),
    }),
    cars: t.relation('cars', {
      query: (_args, ctx) => ({
        orderBy: { purchasedAt: 'desc' as const },
        where: isPartner(ctx.user)
          ? {
              OR: [
                {
                  capitalShares: {
                    some: { partner: { userId: ctx.user?.id } },
                  },
                },
                { costs: { some: { partner: { userId: ctx.user?.id } } } },
              ],
            }
          : undefined,
      }),
    }),
  }),
})

builder.queryField('partners', (t) =>
  t.prismaField({
    type: ['Partner'],
    resolve: async (query, _root, _args, ctx) => {
      requireOwner(ctx.user)
      return ctx.prisma.partner.findMany({
        ...query,
        orderBy: { name: 'asc' },
      })
    },
  }),
)

builder.mutationField('grantPartnerAccess', (t) =>
  t.prismaField({
    type: 'Partner',
    args: {
      partnerId: t.arg.id({ required: true }),
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      requireOwner(ctx.user)
      const id = await grantPartnerAccess({
        partnerId: args.partnerId,
        email: args.email,
        password: args.password,
      })
      return ctx.prisma.partner.findUniqueOrThrow({
        ...query,
        where: { id },
      })
    },
  }),
)

builder.queryField('me', (t) =>
  t.field({
    type: Viewer,
    nullable: true,
    resolve: (_root, _args, ctx) => ctx.user,
  }),
)

builder.queryField('currentCycle', (t) =>
  t.prismaField({
    type: 'BudgetCycle',
    nullable: true,
    resolve: async (query, _root, _args, ctx) => {
      requireUser(ctx.user)
      return ctx.prisma.budgetCycle.findFirst({
        ...query,
        where: { status: 'OPEN' },
      })
    },
  }),
)

builder.queryField('cycles', (t) =>
  t.prismaField({
    type: ['BudgetCycle'],
    resolve: async (query, _root, _args, ctx) => {
      const user = requireUser(ctx.user)
      return ctx.prisma.budgetCycle.findMany({
        ...query,
        where: {
          status: 'CLOSED',
          ...(user.role === 'PARTNER' ? partnerCycleWhere(user.id) : {}),
        },
        orderBy: { closedAt: 'desc' },
      })
    },
  }),
)

builder.queryField('cycle', (t) =>
  t.prismaField({
    type: 'BudgetCycle',
    nullable: true,
    args: { id: t.arg.id({ required: true }) },
    resolve: async (query, _root, args, ctx) => {
      const user = requireUser(ctx.user)
      if (user.role !== 'PARTNER') {
        return ctx.prisma.budgetCycle.findUnique({
          ...query,
          where: { id: args.id },
        })
      }
      return ctx.prisma.budgetCycle.findFirst({
        ...query,
        where: { id: args.id, ...partnerCycleWhere(user.id) },
      })
    },
  }),
)

builder.queryField('car', (t) =>
  t.prismaField({
    type: 'Car',
    nullable: true,
    args: { id: t.arg.id({ required: true }) },
    resolve: async (query, _root, args, ctx) => {
      const user = requireUser(ctx.user)
      if (user.role !== 'PARTNER') {
        return ctx.prisma.car.findUnique({
          ...query,
          where: { id: args.id },
        })
      }
      return ctx.prisma.car.findFirst({
        ...query,
        where: {
          id: args.id,
          OR: [
            { capitalShares: { some: { partner: { userId: user.id } } } },
            { costs: { some: { partner: { userId: user.id } } } },
          ],
        },
      })
    },
  }),
)

builder.mutationField('openCycle', (t) =>
  t.prismaField({
    type: 'BudgetCycle',
    args: {
      title: t.arg.string({ required: true }),
      amount: t.arg({ type: 'Money', required: true }),
      receiptNumber: t.arg.string({ required: false }),
      source: t.arg({ type: FundingSourceEnum, required: false }),
      partnerName: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      const user = requireOwner(ctx.user)
      const id = await openCycle({
        userId: user.id,
        title: args.title,
        amount: args.amount,
        receiptNumber: args.receiptNumber,
        source: args.source ?? 'COMPANY',
        partnerName: args.partnerName,
      })
      return ctx.prisma.budgetCycle.findUniqueOrThrow({
        ...query,
        where: { id },
      })
    },
  }),
)

builder.mutationField('addExtraMoney', (t) =>
  t.prismaField({
    type: 'BudgetCycle',
    args: {
      cycleId: t.arg.id({ required: true }),
      amount: t.arg({ type: 'Money', required: true }),
      note: t.arg.string({ required: false }),
      receiptNumber: t.arg.string({ required: false }),
      source: t.arg({ type: FundingSourceEnum, required: false }),
      partnerName: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      const user = requireStaff(ctx.user)
      const id = await addExtraMoney({
        userId: user.id,
        role: user.role,
        cycleId: args.cycleId,
        amount: args.amount,
        note: args.note,
        receiptNumber: args.receiptNumber,
        source: args.source ?? 'COMPANY',
        partnerName: args.partnerName,
      })
      return ctx.prisma.budgetCycle.findUniqueOrThrow({
        ...query,
        where: { id },
      })
    },
  }),
)

builder.mutationField('buyCar', (t) =>
  t.prismaField({
    type: 'Car',
    args: {
      cycleId: t.arg.id({ required: true }),
      title: t.arg.string({ required: true }),
      year: t.arg.int({ required: false }),
      color: t.arg.string({ required: false }),
      plate: t.arg.string({ required: false }),
      purchasePrice: t.arg({ type: 'Money', required: true }),
      purchasedAt: t.arg({ type: 'DateTime', required: true }),
      note: t.arg.string({ required: false }),
      receiptNumber: t.arg.string({ required: false }),
      source: t.arg({ type: FundingSourceEnum, required: false }),
      partnerName: t.arg.string({ required: false }),
      fundedAmount: t.arg({ type: 'Money', required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      const user = requireStaff(ctx.user)
      const id = await buyCar({
        userId: user.id,
        role: user.role,
        cycleId: args.cycleId,
        title: args.title,
        year: args.year,
        color: args.color,
        plate: args.plate,
        purchasePrice: args.purchasePrice,
        purchasedAt: args.purchasedAt,
        note: args.note,
        receiptNumber: args.receiptNumber,
        source: args.source ?? 'COMPANY',
        partnerName: args.partnerName,
        fundedAmount: args.fundedAmount,
      })
      return ctx.prisma.car.findUniqueOrThrow({ ...query, where: { id } })
    },
  }),
)

builder.mutationField('addCost', (t) =>
  t.prismaField({
    type: 'Car',
    args: {
      carId: t.arg.id({ required: true }),
      category: t.arg({ type: CostCategoryEnum, required: true }),
      amount: t.arg({ type: 'Money', required: true }),
      description: t.arg.string({ required: true }),
      spentAt: t.arg({ type: 'DateTime', required: true }),
      receiptNumber: t.arg.string({ required: false }),
      source: t.arg({ type: FundingSourceEnum, required: false }),
      partnerName: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      const user = requireStaff(ctx.user)
      const id = await addCost({
        userId: user.id,
        role: user.role,
        carId: args.carId,
        category: args.category,
        amount: args.amount,
        description: args.description,
        spentAt: args.spentAt,
        receiptNumber: args.receiptNumber,
        source: args.source ?? 'COMPANY',
        partnerName: args.partnerName,
      })
      return ctx.prisma.car.findUniqueOrThrow({ ...query, where: { id } })
    },
  }),
)

builder.mutationField('sellCar', (t) =>
  t.prismaField({
    type: 'Car',
    args: {
      carId: t.arg.id({ required: true }),
      salePrice: t.arg({ type: 'Money', required: true }),
      soldAt: t.arg({ type: 'DateTime', required: true }),
      receiptNumber: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      requireStaff(ctx.user)
      const id = await sellCar({
        carId: args.carId,
        salePrice: args.salePrice,
        soldAt: args.soldAt,
        receiptNumber: args.receiptNumber,
      })
      return ctx.prisma.car.findUniqueOrThrow({ ...query, where: { id } })
    },
  }),
)

builder.mutationField('recordPayout', (t) =>
  t.prismaField({
    type: 'BudgetCycle',
    args: {
      cycleId: t.arg.id({ required: true }),
      amount: t.arg({ type: 'Money', required: true }),
      note: t.arg.string({ required: false }),
      paidAt: t.arg({ type: 'DateTime', required: true }),
      receiptNumber: t.arg.string({ required: false }),
      partnerId: t.arg.id({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      const user = requireOwner(ctx.user)
      const id = await recordPayout({
        userId: user.id,
        cycleId: args.cycleId,
        amount: args.amount,
        note: args.note,
        paidAt: args.paidAt,
        receiptNumber: args.receiptNumber,
        partnerId: args.partnerId,
      })
      return ctx.prisma.budgetCycle.findUniqueOrThrow({
        ...query,
        where: { id },
      })
    },
  }),
)

builder.mutationField('updatePayoutReceipt', (t) =>
  t.prismaField({
    type: 'BudgetCycle',
    args: {
      payoutId: t.arg.id({ required: true }),
      receiptNumber: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      requireOwner(ctx.user)
      const id = await updatePayoutReceipt({
        payoutId: args.payoutId,
        receiptNumber: args.receiptNumber,
      })
      return ctx.prisma.budgetCycle.findUniqueOrThrow({
        ...query,
        where: { id },
      })
    },
  }),
)

builder.mutationField('updateCapitalReceipt', (t) =>
  t.prismaField({
    type: 'BudgetCycle',
    args: {
      entryId: t.arg.id({ required: true }),
      receiptNumber: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      requireOwner(ctx.user)
      const id = await updateCapitalReceipt({
        entryId: args.entryId,
        receiptNumber: args.receiptNumber,
      })
      return ctx.prisma.budgetCycle.findUniqueOrThrow({
        ...query,
        where: { id },
      })
    },
  }),
)

builder.mutationField('updateCostReceipt', (t) =>
  t.prismaField({
    type: 'Car',
    args: {
      costId: t.arg.id({ required: true }),
      receiptNumber: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      requireOwner(ctx.user)
      const id = await updateCostReceipt({
        costId: args.costId,
        receiptNumber: args.receiptNumber,
      })
      return ctx.prisma.car.findUniqueOrThrow({ ...query, where: { id } })
    },
  }),
)

builder.mutationField('updateCarPurchaseReceipt', (t) =>
  t.prismaField({
    type: 'Car',
    args: {
      carId: t.arg.id({ required: true }),
      receiptNumber: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      requireOwner(ctx.user)
      const id = await updateCarPurchaseReceipt({
        carId: args.carId,
        receiptNumber: args.receiptNumber,
      })
      return ctx.prisma.car.findUniqueOrThrow({ ...query, where: { id } })
    },
  }),
)

builder.mutationField('updateCarSaleReceipt', (t) =>
  t.prismaField({
    type: 'Car',
    args: {
      carId: t.arg.id({ required: true }),
      receiptNumber: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, ctx) => {
      requireOwner(ctx.user)
      const id = await updateCarSaleReceipt({
        carId: args.carId,
        receiptNumber: args.receiptNumber,
      })
      return ctx.prisma.car.findUniqueOrThrow({ ...query, where: { id } })
    },
  }),
)

builder.mutationField('deleteCycle', (t) =>
  t.boolean({
    args: {
      cycleId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      requireOwner(ctx.user)
      await deleteCycle({ cycleId: args.cycleId })
      return true
    },
  }),
)

builder.mutationField('closeCycle', (t) =>
  t.prismaField({
    type: 'BudgetCycle',
    args: {
      cycleId: t.arg.id({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      requireOwner(ctx.user)
      const id = await closeCycle({ cycleId: args.cycleId })
      return ctx.prisma.budgetCycle.findUniqueOrThrow({
        ...query,
        where: { id },
      })
    },
  }),
)
