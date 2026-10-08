import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import { GraphQLError, Kind, type ValueNode } from 'graphql'
import { DateTimeResolver } from 'graphql-scalars'
import prisma from '@/lib/prisma'
import { messages } from '@/server/messages'
import type { SessionUser } from '@/types/session'
import type PrismaTypes from './pothos-types'
import { getDatamodel } from './pothos-types'

export type GraphQLContext = {
  prisma: typeof prisma
  user: SessionUser | null
}

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes
  Context: GraphQLContext
  Scalars: {
    DateTime: { Input: Date; Output: Date }
    Money: { Input: bigint; Output: bigint }
  }
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
    dmmf: getDatamodel(),
  },
})

builder.queryType({
  fields: (t) => ({
    ok: t.boolean({
      resolve: () => true,
    }),
  }),
})

builder.mutationType({})

builder.addScalarType('DateTime', DateTimeResolver, {})

function parseMoney(value: unknown): bigint {
  if (typeof value !== 'string' || !/^-?\d+$/.test(value)) {
    throw new GraphQLError(messages.invalidMoney)
  }
  return BigInt(value)
}

function parseMoneyLiteral(ast: ValueNode): bigint {
  if (ast.kind !== Kind.STRING) throw new GraphQLError(messages.invalidMoney)
  return parseMoney(ast.value)
}

builder.scalarType('Money', {
  serialize: (value) => value.toString(),
  parseValue: (value) => parseMoney(value),
  parseLiteral: (ast) => parseMoneyLiteral(ast),
})
