import { describe, expect, it } from 'vitest'
import {
  assertCanClose,
  assertCanPay,
  assertCanSpend,
  type CarFigures,
  cardView,
  carResult,
  companyTake,
  personalMoneyShare,
  sharesForSale,
  splitProfit,
  summarize,
  totalBudgetFromEvents,
} from './finance'
import { messages } from './messages'

function soldCar(
  purchasePrice: bigint,
  costs: bigint,
  salePrice: bigint,
): CarFigures {
  const result = carResult(purchasePrice, costs, salePrice)
  return {
    purchasePrice,
    costs,
    salePrice,
    companyShare: result.companyShare,
    managerShare: result.managerShare,
  }
}

describe('splitProfit', () => {
  it('splits a positive profit 60/40 in whole toman', () => {
    expect(splitProfit(200n)).toEqual({ companyShare: 120n, managerShare: 80n })
  })

  it('gives the manager the leftover toman', () => {
    expect(splitProfit(201n)).toEqual({ companyShare: 120n, managerShare: 81n })
    expect(splitProfit(1n)).toEqual({ companyShare: 0n, managerShare: 1n })
  })

  it('keeps the shares equal to the profit', () => {
    for (let amount = 0; amount <= 250; amount += 1) {
      const profit = BigInt(amount)
      const split = splitProfit(profit)
      expect(split.companyShare + split.managerShare).toBe(profit)
    }
  })

  it('leaves a loss with the company when nobody else put money in', () => {
    expect(splitProfit(-200n)).toEqual({
      companyShare: -200n,
      managerShare: 0n,
    })
    expect(splitProfit(0n)).toEqual({ companyShare: 0n, managerShare: 0n })
  })
})

describe('sharesForSale', () => {
  it('matches the 60/40 split when only the company put money in', () => {
    for (const profit of [-200n, -1n, 0n, 1n, 200n, 201n]) {
      const base = splitProfit(profit)
      const shares = sharesForSale(profit, [{ key: 'company', capital: 1000n }])
      expect(shares.salesShare).toBe(base.managerShare)
      expect(shares.companyShare).toBe(base.companyShare)
      expect(shares.partnerShares).toEqual([])
      expect(shares.companyShare + shares.salesShare).toBe(profit)
    }
  })

  it('adds a money share on top of the sales share', () => {
    const shares = sharesForSale(200n, [
      { key: 'company', capital: 1000n },
      { key: 'manager', capital: 100n },
    ])
    expect(shares.salesShare).toBe(80n)
    expect(shares.partnerShares).toEqual([{ key: 'manager', amount: 10n }])
    expect(shares.companyShare).toBe(110n)
    expect(personalMoneyShare(200n, 100n, 1100n)).toBe(10n)
  })

  it('still splits by money when someone put in more than the company', () => {
    const shares = sharesForSale(200n, [
      { key: 'company', capital: 1000n },
      { key: 'manager', capital: 1000n },
    ])
    expect(shares.salesShare).toBe(80n)
    expect(shares.companyShare).toBe(60n)
    expect(shares.partnerShares).toEqual([{ key: 'manager', amount: 60n }])
    expect(
      shares.companyShare + shares.salesShare + shares.partnerShares[0].amount,
    ).toBe(200n)
  })

  it('splits a loss across the money that was put in', () => {
    const shares = sharesForSale(-200n, [
      { key: 'company', capital: 1000n },
      { key: 'manager', capital: 100n },
    ])
    expect(shares.salesShare).toBe(0n)
    expect(shares.partnerShares).toEqual([{ key: 'manager', amount: -18n }])
    expect(shares.companyShare).toBe(-182n)
    expect(
      shares.companyShare + shares.salesShare + shares.partnerShares[0].amount,
    ).toBe(-200n)
  })
})

describe('carResult', () => {
  it('does not treat extra capital as a car cost', () => {
    const car = carResult(700n, 100n, 1000n)
    expect(car).toEqual({
      totalCost: 100n,
      profit: 200n,
      companyShare: 120n,
      managerShare: 80n,
    })

    const withoutExtra = summarize({
      initialAmount: 1000n,
      extraAmount: 0n,
      payouts: 0n,
      cars: [soldCar(700n, 100n, 1000n)],
    })
    const withExtra = summarize({
      initialAmount: 1000n,
      extraAmount: 500n,
      payouts: 0n,
      cars: [soldCar(700n, 100n, 1000n)],
    })

    expect(withExtra.cash - withoutExtra.cash).toBe(500n)
    expect(car.profit).toBe(200n)
  })

  it('records a loss when the sale is below cost', () => {
    expect(carResult(700n, 100n, 600n)).toMatchObject({
      profit: -200n,
      companyShare: -200n,
      managerShare: 0n,
    })
  })
})

describe('summarize', () => {
  it('matches the worked example before and after the manager is paid', () => {
    const cars = [soldCar(700n, 100n, 1000n)]
    const before = summarize({
      initialAmount: 1000n,
      extraAmount: 0n,
      payouts: 0n,
      cars,
    })

    expect(before.cash).toBe(1200n)
    expect(before.companyShare).toBe(120n)
    expect(before.managerPayable).toBe(80n)
    expect(before.companyPosition).toBe(1120n)

    const after = summarize({
      initialAmount: 1000n,
      extraAmount: 0n,
      payouts: 80n,
      cars,
    })

    expect(after.cash).toBe(1120n)
    expect(after.managerPayable).toBe(0n)
    expect(after.companyPosition).toBe(1120n)
  })

  it('keeps two cars in one cycle on the same cash pool', () => {
    const summary = summarize({
      initialAmount: 1000n,
      extraAmount: 200n,
      payouts: 80n,
      cars: [
        soldCar(700n, 100n, 1000n),
        {
          purchasePrice: 300n,
          costs: 50n,
          salePrice: null,
          companyShare: null,
          managerShare: null,
        },
      ],
    })

    expect(summary.cash).toBe(970n)
    expect(summary.inventoryCost).toBe(350n)
    expect(summary.inStockCount).toBe(1)
    expect(summary.soldCount).toBe(1)
    expect(summary.managerPayable).toBe(0n)
    expect(summary.companyPosition).toBe(970n)
    expect(summary.companyPosition + summary.inventoryCost).toBe(1320n)
  })

  it('adds the company share to the whole budget without subtracting the cost again', () => {
    expect(companyTake(970_000_000n, 318_000_000n)).toBe(1_288_000_000n)
    expect(companyTake(1000n, 120n)).toBe(1120n)
    expect(companyTake(1000n, -200n)).toBe(800n)
  })

  it('keeps an uncovered cost in the budget after the car is sold', () => {
    const charge = 0
    const buy = 1
    const cost = 2
    const sale = 3
    expect(
      totalBudgetFromEvents([
        { at: charge, kind: 'capital', amount: 950_000_000n },
        { at: buy, kind: 'purchase', amount: 950_000_000n },
        { at: cost, kind: 'cost', amount: 20_000_000n },
        { at: sale, kind: 'sale', amount: 1_500_000_000n },
      ]),
    ).toBe(970_000_000n)
  })

  it('does not grow the budget when the card still had cash for the cost', () => {
    expect(
      totalBudgetFromEvents([
        { at: 0, kind: 'capital', amount: 1000n },
        { at: 1, kind: 'purchase', amount: 700n },
        { at: 2, kind: 'cost', amount: 100n },
        { at: 3, kind: 'sale', amount: 1000n },
      ]),
    ).toBe(1000n)
  })

  it('keeps costs in the budget when a later charge is for buying cars', () => {
    expect(
      totalBudgetFromEvents([
        { at: 0, kind: 'capital', amount: 1000n },
        { at: 1, kind: 'purchase', amount: 1000n },
        { at: 2, kind: 'cost', amount: 100n },
        { at: 3, kind: 'capital', amount: 40n },
      ]),
    ).toBe(1140n)
  })

  it('pays a cost from sale money when the sale was recorded first', () => {
    expect(
      totalBudgetFromEvents([
        { at: 0, kind: 'capital', amount: 950n },
        { at: 1, kind: 'purchase', amount: 950n },
        { at: 2, kind: 'sale', amount: 1500n },
        { at: 3, kind: 'cost', amount: 20n },
      ]),
    ).toBe(950n)
  })

  it('counts a card withdrawal as part of the total budget', () => {
    expect(
      cardView({ capital: 950n, cash: -20n, companyPosition: -20n }),
    ).toEqual({
      totalBudget: 970n,
      balance: 0n,
      companyPosition: 0n,
    })
    expect(
      cardView({ capital: 1000n, cash: 200n, companyPosition: 200n }),
    ).toEqual({
      totalBudget: 1000n,
      balance: 200n,
      companyPosition: 200n,
    })
  })

  it('funds repair costs after the whole budget bought one car', () => {
    const stock = (purchasePrice: bigint, costs: bigint): CarFigures => ({
      purchasePrice,
      costs,
      salePrice: null,
      companyShare: null,
      managerShare: null,
    })

    const bought = summarize({
      initialAmount: 1000n,
      extraAmount: 0n,
      payouts: 0n,
      cars: [stock(1000n, 0n)],
    })
    expect(bought.cash).toBe(0n)

    const repair = summarize({
      initialAmount: 1000n,
      extraAmount: 0n,
      payouts: 0n,
      cars: [stock(1000n, 100n)],
    })
    expect(repair.cash).toBe(-100n)

    const partly = summarize({
      initialAmount: 1000n,
      extraAmount: 40n,
      payouts: 0n,
      cars: [stock(1000n, 100n)],
    })
    expect(partly.cash).toBe(-60n)

    const funded = summarize({
      initialAmount: 1000n,
      extraAmount: 100n,
      payouts: 0n,
      cars: [soldCar(1000n, 100n, 1500n)],
    })
    expect(funded.cash).toBe(1500n)
    expect(funded.companyShare).toBe(240n)
    expect(funded.managerShare).toBe(160n)
  })

  it('returns a shareholder’s expense with their profit and does not pay it twice', () => {
    const summary = summarize({
      initialAmount: 800n,
      extraAmount: 20n,
      payouts: 0n,
      cars: [
        {
          purchasePrice: 600n,
          costs: 20n,
          salePrice: 900n,
          companyShare: 164n,
          managerShare: 112n,
        },
      ],
      partners: [
        {
          id: 'shareholder',
          name: 'سهامدار',
          isManager: false,
          capital: 20n,
          profitShare: 4n,
          paid: 0n,
        },
      ],
    })

    expect(summary.cash).toBe(1100n)
    expect(summary.partners[0]?.payable).toBe(24n)
    expect(summary.managerPayable).toBe(112n)
    expect(summary.companyPosition).toBe(964n)
    expect(summary.companyCapital + summary.companyShare).toBe(964n)
  })

  it('pays the manager for sales and for money, and leaves other principal with them', () => {
    const summary = summarize({
      initialAmount: 1000n,
      extraAmount: 100n,
      payouts: 0n,
      cars: [
        {
          purchasePrice: 700n,
          costs: 100n,
          salePrice: 1000n,
          companyShare: 100n,
          managerShare: 80n,
        },
      ],
      partners: [
        {
          id: 'manager',
          name: 'مدیر فروش',
          isManager: true,
          capital: 100n,
          profitShare: 10n,
          paid: 0n,
        },
        {
          id: 'other',
          name: 'شریک',
          isManager: false,
          capital: 0n,
          profitShare: 10n,
          paid: 0n,
        },
      ],
    })

    expect(summary.cash).toBe(1300n)
    expect(summary.managerPayable).toBe(190n)
    expect(summary.partners[0]?.payable).toBe(110n)
    expect(summary.companyCapital).toBe(1000n)
    expect(summary.partnerCapital).toBe(100n)
    expect(summary.companyPosition).toBe(1100n)
    expect(summary.partners[1]?.payable).toBe(10n)
  })

  it('keeps a loss inside the company position', () => {
    const summary = summarize({
      initialAmount: 1000n,
      extraAmount: 0n,
      payouts: 0n,
      cars: [soldCar(700n, 100n, 600n)],
    })

    expect(summary.cash).toBe(800n)
    expect(summary.companyShare).toBe(-200n)
    expect(summary.managerPayable).toBe(0n)
    expect(summary.companyPosition).toBe(800n)
  })
})

describe('guards', () => {
  it('rejects spending more cash than the cycle has', () => {
    expect(() => assertCanSpend(100n, 101n)).toThrow(messages.insufficientCash)
    expect(() => assertCanSpend(100n, 100n)).not.toThrow()
    expect(() => assertCanSpend(100n, 0n)).toThrow(messages.positiveAmount)
  })

  it('rejects a payout above the manager share still owed', () => {
    expect(() => assertCanPay(80n, 81n)).toThrow(messages.payoutTooMuch)
    expect(() => assertCanPay(80n, 80n)).not.toThrow()
  })

  it('refuses to close a cycle that still has a car in stock', () => {
    expect(() => assertCanClose(1)).toThrow(messages.cannotClose)
    expect(() => assertCanClose(0)).not.toThrow()
  })
})
