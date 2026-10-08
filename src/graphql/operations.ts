import { type DocumentNode, gql } from '@apollo/client'

const CYCLE_FIELDS = gql`
  fragment CycleFields on BudgetCycle {
    id
    title
    status
    openedAt
    closedAt
    initialAmount
    summary {
      initialAmount
      extraAmount
      cash
      inventoryCost
      companyShare
      managerShare
      managerPayable
      companyPosition
      totalBudget
      sales
      inStockCount
      soldCount
    }
    capitalEntries {
      id
      kind
      amount
      note
      receiptNumber
      createdAt
    }
    payouts {
      id
      amount
      note
      receiptNumber
      paidAt
    }
    cars {
      id
      title
      year
      color
      plate
      status
      purchasePrice
      purchasedAt
      purchaseReceiptNumber
      salePrice
      soldAt
      saleReceiptNumber
      totalCost
      profit
      companyShare
      managerShare
      note
      costs {
        amount
      }
    }
  }
`

export const CURRENT_CYCLE: DocumentNode = gql`
  query CurrentCycle {
    currentCycle {
      ...CycleFields
    }
  }
  ${CYCLE_FIELDS}
`

export const CYCLES: DocumentNode = gql`
  query Cycles {
    cycles {
      id
      title
      status
      openedAt
      closedAt
      summary {
        initialAmount
        extraAmount
        cash
        companyShare
        managerPayable
        inStockCount
        soldCount
      }
    }
  }
`

export const CYCLE: DocumentNode = gql`
  query Cycle($id: ID!) {
    cycle(id: $id) {
      ...CycleFields
    }
  }
  ${CYCLE_FIELDS}
`

export const CAR_QUERY: DocumentNode = gql`
  query Car($id: ID!) {
    car(id: $id) {
      id
      title
      year
      color
      plate
      status
      note
      purchasePrice
      purchasedAt
      purchaseReceiptNumber
      salePrice
      soldAt
      saleReceiptNumber
      totalCost
      profit
      companyShare
      managerShare
      costs {
        id
        category
        amount
        description
        receiptNumber
        spentAt
      }
      cycle {
        id
        title
        status
        summary {
          cash
        }
      }
    }
  }
`

export const OPEN_CYCLE: DocumentNode = gql`
  mutation OpenCycle($title: String!, $amount: Money!, $receiptNumber: String) {
    openCycle(title: $title, amount: $amount, receiptNumber: $receiptNumber) {
      id
    }
  }
`

export const ADD_EXTRA: DocumentNode = gql`
  mutation AddExtraMoney($cycleId: ID!, $amount: Money!, $note: String, $receiptNumber: String) {
    addExtraMoney(cycleId: $cycleId, amount: $amount, note: $note, receiptNumber: $receiptNumber) {
      id
    }
  }
`

export const BUY_CAR: DocumentNode = gql`
  mutation BuyCar(
    $cycleId: ID!
    $title: String!
    $year: Int
    $color: String
    $plate: String
    $purchasePrice: Money!
    $purchasedAt: DateTime!
    $note: String
    $receiptNumber: String
  ) {
    buyCar(
      cycleId: $cycleId
      title: $title
      year: $year
      color: $color
      plate: $plate
      purchasePrice: $purchasePrice
      purchasedAt: $purchasedAt
      note: $note
      receiptNumber: $receiptNumber
    ) {
      id
    }
  }
`

export const ADD_COST: DocumentNode = gql`
  mutation AddCost(
    $carId: ID!
    $category: CostCategory!
    $amount: Money!
    $description: String!
    $spentAt: DateTime!
    $receiptNumber: String
  ) {
    addCost(
      carId: $carId
      category: $category
      amount: $amount
      description: $description
      spentAt: $spentAt
      receiptNumber: $receiptNumber
    ) {
      id
    }
  }
`

export const SELL_CAR: DocumentNode = gql`
  mutation SellCar($carId: ID!, $salePrice: Money!, $soldAt: DateTime!, $receiptNumber: String) {
    sellCar(carId: $carId, salePrice: $salePrice, soldAt: $soldAt, receiptNumber: $receiptNumber) {
      id
    }
  }
`

export const RECORD_PAYOUT: DocumentNode = gql`
  mutation RecordPayout($cycleId: ID!, $amount: Money!, $note: String, $paidAt: DateTime!, $receiptNumber: String) {
    recordPayout(cycleId: $cycleId, amount: $amount, note: $note, paidAt: $paidAt, receiptNumber: $receiptNumber) {
      id
    }
  }
`

export const UPDATE_PAYOUT_RECEIPT: DocumentNode = gql`
  mutation UpdatePayoutReceipt($payoutId: ID!, $receiptNumber: String) {
    updatePayoutReceipt(payoutId: $payoutId, receiptNumber: $receiptNumber) {
      id
    }
  }
`

export const UPDATE_CAPITAL_RECEIPT: DocumentNode = gql`
  mutation UpdateCapitalReceipt($entryId: ID!, $receiptNumber: String) {
    updateCapitalReceipt(entryId: $entryId, receiptNumber: $receiptNumber) {
      id
    }
  }
`

export const UPDATE_COST_RECEIPT: DocumentNode = gql`
  mutation UpdateCostReceipt($costId: ID!, $receiptNumber: String) {
    updateCostReceipt(costId: $costId, receiptNumber: $receiptNumber) {
      id
    }
  }
`

export const UPDATE_CAR_PURCHASE_RECEIPT: DocumentNode = gql`
  mutation UpdateCarPurchaseReceipt($carId: ID!, $receiptNumber: String) {
    updateCarPurchaseReceipt(carId: $carId, receiptNumber: $receiptNumber) {
      id
    }
  }
`

export const UPDATE_CAR_SALE_RECEIPT: DocumentNode = gql`
  mutation UpdateCarSaleReceipt($carId: ID!, $receiptNumber: String) {
    updateCarSaleReceipt(carId: $carId, receiptNumber: $receiptNumber) {
      id
    }
  }
`

export const DELETE_CYCLE: DocumentNode = gql`
  mutation DeleteCycle($cycleId: ID!) {
    deleteCycle(cycleId: $cycleId)
  }
`

export const CLOSE_CYCLE: DocumentNode = gql`
  mutation CloseCycle($cycleId: ID!) {
    closeCycle(cycleId: $cycleId) {
      id
    }
  }
`

export const ACTIVE_QUERIES = [CURRENT_CYCLE, CYCLES, CYCLE, CAR_QUERY]
