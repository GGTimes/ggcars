import { Prisma } from '@prisma/client'

export function decimalToBigint(
  value: Prisma.Decimal | bigint | string,
): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'string') return BigInt(value)
  return BigInt(value.toFixed(0))
}

export function toDecimal(value: bigint): Prisma.Decimal {
  return new Prisma.Decimal(value.toString())
}
