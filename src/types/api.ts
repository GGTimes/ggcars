export type Money = string

export type CycleSummary = {
  initialAmount: Money
  extraAmount: Money
  cash: Money
  inventoryCost: Money
  companyShare: Money
  managerShare: Money
  managerPayable: Money
  companyPosition: Money
  totalBudget: Money
  sales: Money
  inStockCount: number
  soldCount: number
}

export type CapitalEntry = {
  id: string
  kind: 'INITIAL' | 'EXTRA'
  amount: Money
  note: string | null
  receiptNumber: string | null
  createdAt: string
}

export type Payout = {
  id: string
  amount: Money
  note: string | null
  receiptNumber: string | null
  paidAt: string
}

export type CarListItem = {
  id: string
  title: string
  year: number | null
  color: string | null
  plate: string | null
  status: 'IN_STOCK' | 'SOLD'
  purchasePrice: Money
  purchasedAt: string
  purchaseReceiptNumber: string | null
  salePrice: Money | null
  soldAt: string | null
  saleReceiptNumber: string | null
  totalCost: Money | null
  profit: Money | null
  companyShare: Money | null
  managerShare: Money | null
  note: string | null
  costs: { amount: Money }[]
}

export type CycleData = {
  id: string
  title: string
  status: 'OPEN' | 'CLOSED'
  openedAt: string
  closedAt: string | null
  initialAmount: Money
  summary: CycleSummary
  capitalEntries: CapitalEntry[]
  payouts: Payout[]
  cars: CarListItem[]
}

export type CostItem = {
  id: string
  category: 'REPAIR' | 'PARTS' | 'TRANSPORT' | 'OTHER'
  amount: Money
  description: string
  receiptNumber: string | null
  spentAt: string
}

export type CarDetail = {
  id: string
  title: string
  year: number | null
  color: string | null
  plate: string | null
  status: 'IN_STOCK' | 'SOLD'
  note: string | null
  purchasePrice: Money
  purchasedAt: string
  purchaseReceiptNumber: string | null
  salePrice: Money | null
  soldAt: string | null
  saleReceiptNumber: string | null
  totalCost: Money | null
  profit: Money | null
  companyShare: Money | null
  managerShare: Money | null
  costs: CostItem[]
  cycle: {
    id: string
    title: string
    status: 'OPEN' | 'CLOSED'
    summary: { cash: Money }
  }
}

export type CycleListItem = {
  id: string
  title: string
  status: 'OPEN' | 'CLOSED'
  openedAt: string
  closedAt: string | null
  summary: Pick<
    CycleSummary,
    | 'initialAmount'
    | 'extraAmount'
    | 'cash'
    | 'companyShare'
    | 'managerPayable'
    | 'inStockCount'
    | 'soldCount'
  >
}
