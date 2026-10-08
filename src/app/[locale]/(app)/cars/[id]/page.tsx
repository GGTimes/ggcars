import { CarScreen } from '@/components/CarScreen'

export default async function CarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CarScreen id={id} />
}
