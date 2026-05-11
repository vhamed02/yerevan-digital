export default async function OrderDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  return <div className="p-8"><h1 className="font-heading text-2xl font-bold">Order {uuid}</h1></div>
}
