import { CycleDetailScreen } from '@/components/ArchiveScreen'

export default async function CyclePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CycleDetailScreen id={id} />
}
