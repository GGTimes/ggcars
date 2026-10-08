import {
  CapitalKind,
  CarStatus,
  CostCategory,
  CycleStatus,
  Role,
} from '@prisma/client'
import prisma from '@/lib/prisma'
import { requireOwner, requireUser } from '@/server/auth'
import {
  addCost,
  addExtraMoney,
  buyCar,
  closeCycle,
  deleteCycle,
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
        resolve: (summary) => summary.initialAmount,
      }),
      extraAmount: t.field({
        type: 'Money',
        resolve: (summary) => summary.extraAmount,
      }),
      cash: t.field({ type: 'Money', resolve: (summary) => summary.cash }),
      inventoryCost: t.field({
        type: 'Money',
        resolve: (summary) => summary.inventoryCost,
      }),
      companyShare: t.field({
        type: 'Money',
        resolve: (summary) => summary.companyShare,
      }),
      managerShare: t.field({
        type: 'Money',
        resolve: (summary) => summary.managerShare,
      }),
      managerPayable: t.field({
        type: 'Money',
        resolve: (summary) => summary.managerPayable,
      }),
      companyPosition: t.field({
        type: 'Money',
        resolve: (summary) => summary.companyPosition,
      }),
      totalBudget: t.field({
        type: 'Money',
        resolve: (summary) => summary.totalBudget,
      }),
      sales: t.field({ type: 'Money', resolve: (summary) => summary.sales }),
      inStockCount: t.exposeInt('inStockCount'),
      soldCount: t.exposeInt('soldCount'),
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
      resolve: (car) => decimalToBigint(car.purchasePrice),
    }),
    purchasedAt: t.expose('purchasedAt', { type: 'DateTime' }),
    purchaseReceiptNumber: t.exposeString('purchaseReceiptNumber', {
      nullable: true,
    }),
    salePrice: t.field({
      type: 'Money',
      nullable: true,
      resolve: (car) =>
        car.salePrice == null ? null : decimalToBigint(car.salePrice),
    }),
    soldAt: t.expose('soldAt', { type: 'DateTime', nullable: true }),
    saleReceiptNumber: t.exposeString('saleReceiptNumber', {
      nullable: true,
    }),
    totalCost: t.field({
      type: 'Money',
      nullable: true,
      resolve: (car) =>
        car.totalCost == null ? null : decimalToBigint(car.totalCost),
    }),
    profit: t.field({
      type: 'Money',
      nullable: true,
      resolve: (car) =>
        car.profit == null ? null : decimalToBigint(car.profit),
    }),
    companyShare: t.field({
      type: 'Money',
      nullable: true,
      resolve: (car) =>
        car.companyShare == null ? null : decimalToBigint(car.companyShare),
    }),
    managerShare: t.field({
      type: 'Money',
      nullable: true,
      resolve: (car) =>
        car.managerShare == null ? null : decimalToBigint(car.managerShare),
    }),
    note: t.exposeString('note', { nullable: true }),
    costs: t.relation('costs', {
      query: () => ({ orderBy: { spentAt: 'asc' as const } }),
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
      resolve: (cycle) => decimalToBigint(cycle.initialAmount),
    }),
    openedAt: t.expose('openedAt', { type: 'DateTime' }),
    closedAt: t.expose('closedAt', { type: 'DateTime', nullable: true }),
    summary: t.field({
      type: CycleSummaryType,
      resolve: (cycle) => loadSummary(prisma, cycle.id),
    }),
    capitalEntries: t.relation('capitalEntries', {
      query: () => ({ orderBy: { createdAt: 'asc' as const } }),
    }),
    payouts: t.relation('payouts', {
      query: () => ({ orderBy: { paidAt: 'desc' as const } }),
    }),
    cars: t.relation('cars', {
      query: () => ({ orderBy: { purchasedAt: 'desc' as const } }),
    }),
  }),
})

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
      requireUser(ctx.user)
      return ctx.prisma.budgetCycle.findMany({
        ...query,
        where: { status: 'CLOSED' },
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
      requireUser(ctx.user)
      return ctx.prisma.budgetCycle.findUnique({
        ...query,
        where: { id: args.id },
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
      requireUser(ctx.user)
      return ctx.prisma.car.findUnique({
        ...query,
        where: { id: args.id },
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
    },
    resolve: async (query, _root, args, ctx) => {
      const user = requireOwner(ctx.user)
      const id = await openCycle({
        userId: user.id,
        title: args.title,
        amount: args.amount,
        receiptNumber: args.receiptNumber,
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
    },
    resolve: async (query, _root, args, ctx) => {
      const user = requireOwner(ctx.user)
      const id = await addExtraMoney({
        userId: user.id,
        cycleId: args.cycleId,
        amount: args.amount,
        note: args.note,
        receiptNumber: args.receiptNumber,
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
    },
    resolve: async (query, _root, args, ctx) => {
      const user = requireUser(ctx.user)
      const id = await buyCar({
        userId: user.id,
        cycleId: args.cycleId,
        title: args.title,
        year: args.year,
        color: args.color,
        plate: args.plate,
        purchasePrice: args.purchasePrice,
        purchasedAt: args.purchasedAt,
        note: args.note,
        receiptNumber: args.receiptNumber,
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
    },
    resolve: async (query, _root, args, ctx) => {
      const user = requireUser(ctx.user)
      const id = await addCost({
        userId: user.id,
        carId: args.carId,
        category: args.category,
        amount: args.amount,
        description: args.description,
        spentAt: args.spentAt,
        receiptNumber: args.receiptNumber,
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
      requireUser(ctx.user)
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
