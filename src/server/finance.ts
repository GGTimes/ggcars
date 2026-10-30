import { messages } from './messages'

export type CarFigures = {
  purchasePrice: bigint
  costs: bigint
  salePrice: bigint | null
  companyShare: bigint | null
  managerShare: bigint | null
}

/** Money already counted inside initialAmount + extraAmount. */
export type PartnerInput = {
  id: string
  name: string
  isManager: boolean
  userId?: string | null
  capital: bigint
  profitShare: bigint
  paid: bigint
}

export type PartnerSummary = PartnerInput & {
  payable: bigint
}

export const companyStakeKey = 'company'

export type SummaryInput = {
  initialAmount: bigint
  extraAmount: bigint
  cars: CarFigures[]
  /** Payouts of the sales manager's combined share. Partner payouts are on each partner. */
  payouts: bigint
  partners?: PartnerInput[]
}

export type Summary = {
  initialAmount: bigint
  extraAmount: bigint
  capital: bigint
  purchases: bigint
  costs: bigint
  sales: bigint
  payouts: bigint
  cash: bigint
  inventoryCost: bigint
  companyShare: bigint
  managerShare: bigint
  managerPayable: bigint
  companyPosition: bigint
  companyCapital: bigint
  partnerCapital: bigint
  partners: PartnerSummary[]
  inStockCount: number
  soldCount: number
}

function assertScale(amount: bigint) {
  if (amount.toString().replace('-', '').length > 18) {
    throw new Error(messages.amountTooLarge)
  }
}

export function assertPositive(amount: bigint) {
  assertScale(amount)
  if (amount <= 0n) throw new Error(messages.positiveAmount)
}

export function assertSalePrice(amount: bigint) {
  assertScale(amount)
  if (amount < 0n) throw new Error(messages.negativeSale)
}

export function splitProfit(profit: bigint): {
  companyShare: bigint
  managerShare: bigint
} {
  if (profit <= 0n) {
    return { companyShare: profit, managerShare: 0n }
  }
  const companyShare = (profit * 60n) / 100n
  return { companyShare, managerShare: profit - companyShare }
}

/**
 * Company keeps the whole 60% pool when nobody else put money in.
 * Otherwise that pool is split by capital. The sales commission stays 40%
 * and is not part of the pool. Remainder tomans stay with the company.
 * A loss stays with the company when nobody else put money in.
 */
export function sharesForSale(
  profit: bigint,
  stakes: { key: string; capital: bigint }[],
): {
  salesShare: bigint
  companyShare: bigint
  partnerShares: { key: string; amount: bigint }[]
} {
  const base = splitProfit(profit)
  const holders = stakes.filter(
    (stake) => stake.key !== companyStakeKey && stake.capital > 0n,
  )
  const total = stakes.reduce(
    (sum, stake) => sum + (stake.capital > 0n ? stake.capital : 0n),
    0n,
  )
  if (total <= 0n || holders.length === 0) {
    return {
      salesShare: base.managerShare,
      companyShare: base.companyShare,
      partnerShares: [],
    }
  }
  const partnerShares = holders.map((stake) => ({
    key: stake.key,
    amount: (base.companyShare * stake.capital) / total,
  }))
  const given = partnerShares.reduce((sum, share) => sum + share.amount, 0n)
  return {
    salesShare: base.managerShare,
    companyShare: base.companyShare - given,
    partnerShares,
  }
}

export function personalMoneyShare(
  profit: bigint,
  myCapital: bigint,
  capitalTotal: bigint,
): bigint {
  if (myCapital <= 0n || capitalTotal <= 0n) return 0n
  return (splitProfit(profit).companyShare * myCapital) / capitalTotal
}

export function carResult(
  purchasePrice: bigint,
  costs: bigint,
  salePrice: bigint,
) {
  const totalCost = costs
  const profit = salePrice - purchasePrice - totalCost
  return { totalCost, profit, ...splitProfit(profit) }
}

export function availableCash(input: {
  capital: bigint
  purchases: bigint
  costs: bigint
  sales: bigint
  payouts: bigint
}): bigint {
  return (
    input.capital + input.sales - input.purchases - input.costs - input.payouts
  )
}

export function managerPayable(managerShare: bigint, payouts: bigint): bigint {
  return managerShare - payouts
}

export function companyPosition(cash: bigint, payable: bigint): bigint {
  return cash - payable
}

/** The company gets the whole budget back plus its profit share. Costs already inside the budget are not subtracted again. */
export function companyTake(
  totalBudget: bigint,
  companyShare: bigint,
  partnerCapital = 0n,
): bigint {
  return totalBudget - partnerCapital + companyShare
}

/** An expense the manager records was already on the card, so it stays inside the total budget. */
export function cardView(input: {
  capital: bigint
  cash: bigint
  companyPosition: bigint
}) {
  const withdrawn = input.cash < 0n ? -input.cash : 0n
  return {
    totalBudget: input.capital + withdrawn,
    balance: input.cash > 0n ? input.cash : 0n,
    companyPosition: input.companyPosition + withdrawn,
  }
}

export type BudgetEvent = {
  at: number
  kind: 'capital' | 'purchase' | 'cost' | 'sale' | 'payout'
  amount: bigint
}

const eventRank: Record<BudgetEvent['kind'], number> = {
  capital: 0,
  purchase: 1,
  cost: 2,
  sale: 3,
  payout: 4,
}

/**
 * Costs recorded when the card had no recorded cash stay in the budget.
 * A later sale puts money back on the card and does not remove them.
 * An explicit charge is only for buying cars, so it never covers those costs.
 */
export function totalBudgetFromEvents(events: BudgetEvent[]): bigint {
  const ordered = [...events].sort(
    (a, b) => a.at - b.at || eventRank[a.kind] - eventRank[b.kind],
  )
  let capital = 0n
  let cash = 0n
  let implied = 0n

  for (const event of ordered) {
    if (event.kind === 'capital') {
      capital += event.amount
      cash += event.amount
      continue
    }
    if (event.kind === 'sale') {
      cash += event.amount
      continue
    }
    if (event.kind === 'cost') {
      const available = cash > 0n ? cash : 0n
      if (event.amount > available) implied += event.amount - available
      cash -= event.amount
      continue
    }
    cash -= event.amount
  }

  return capital + implied
}

export function assertCanSpend(cash: bigint, amount: bigint) {
  assertPositive(amount)
  if (amount > cash) throw new Error(messages.insufficientCash)
}

export function assertCanPay(payable: bigint, amount: bigint) {
  assertPositive(amount)
  if (amount > payable) throw new Error(messages.payoutTooMuch)
}

export function assertCanClose(inStockCount: number) {
  if (inStockCount > 0) throw new Error(messages.cannotClose)
}

export function summarize(input: SummaryInput): Summary {
  let purchases = 0n
  let costs = 0n
  let sales = 0n
  let inventoryCost = 0n
  let companyShare = 0n
  let managerShare = 0n
  let inStockCount = 0
  let soldCount = 0

  for (const car of input.cars) {
    purchases += car.purchasePrice
    costs += car.costs
    if (car.salePrice == null) {
      inStockCount += 1
      inventoryCost += car.purchasePrice + car.costs
      continue
    }
    soldCount += 1
    sales += car.salePrice
    companyShare += car.companyShare ?? 0n
    managerShare += car.managerShare ?? 0n
  }

  const partners = input.partners ?? []
  const partnerCapital = partners.reduce(
    (sum, partner) => sum + partner.capital,
    0n,
  )
  const partnerPayouts = partners.reduce(
    (sum, partner) => sum + partner.paid,
    0n,
  )
  const managerCapital = partners.reduce(
    (sum, partner) => sum + (partner.isManager ? partner.capital : 0n),
    0n,
  )
  const managerCapitalShare = partners.reduce(
    (sum, partner) => sum + (partner.isManager ? partner.profitShare : 0n),
    0n,
  )
  // Principal, including expenses a person paid, is returned with their profit.
  // Car profit already sets those expenses aside, so they are not paid twice.
  const otherPayable = partners.reduce(
    (sum, partner) =>
      sum +
      (partner.isManager
        ? 0n
        : partner.capital + partner.profitShare - partner.paid),
    0n,
  )
  const capital = input.initialAmount + input.extraAmount
  const cash = availableCash({
    capital,
    purchases,
    costs,
    sales,
    payouts: input.payouts + partnerPayouts,
  })
  const payable = managerPayable(
    managerShare + managerCapital + managerCapitalShare,
    input.payouts,
  )

  return {
    initialAmount: input.initialAmount,
    extraAmount: input.extraAmount,
    capital,
    purchases,
    costs,
    sales,
    payouts: input.payouts,
    cash,
    inventoryCost,
    companyShare,
    managerShare,
    managerPayable: payable,
    companyPosition: companyPosition(cash, payable + otherPayable),
    companyCapital: capital - partnerCapital,
    partnerCapital,
    partners: partners.map((partner) => ({
      ...partner,
      payable: partner.capital + partner.profitShare - partner.paid,
    })),
    inStockCount,
    soldCount,
  }
}
