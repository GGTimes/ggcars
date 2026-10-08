import { createYoga } from 'graphql-yoga'
import { createContext } from '@/graphql/context'
import { schema } from '@/graphql/schema'

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  context: ({ request }) => createContext(request),
  graphiql: process.env.NODE_ENV !== 'production',
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function handle(request: Request) {
  return handleRequest(request, {})
}

export { handle as GET, handle as POST, handle as OPTIONS }
