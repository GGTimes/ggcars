export type Money = string

export type PartnerStake = {
  id: string
  name: string
  isManager: boolean
  capital: Money
  profitShare: Money
  paid: Money
  payable: Money
}

export type CapitalShare = {
  amount: Money
  partner: { id: string; name: string }
}

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
  capitalTotal: Money
  companyCapital: Money
  partnerCapital: Money
  myCapital: Money
  myCapitalShare: Money
  myPaid: Money
  myPayable: Money
  partners: PartnerStake[]
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
  partner: { id: string; name: string } | null
}

export type Payout = {
  id: string
  amount: Money
  note: string | null
  receiptNumber: string | null
  paidAt: string
  partner: { id: string; name: string } | null
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
  capitalShares: CapitalShare[]
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
  paidBy: string | null
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
  capitalShares: CapitalShare[]
  cycle: {
    id: string
    title: string
    status: 'OPEN' | 'CLOSED'
    summary: {
      cash: Money
      capitalTotal: Money
      companyCapital: Money
      myCapital: Money
      partners: {
        id: string
        name: string
        capital: Money
        isManager: boolean
      }[]
    }
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
    | 'myCapital'
    | 'myPayable'
    | 'inStockCount'
    | 'soldCount'
  >
}
