export default async function ProductDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  return <div className="p-8"><h1 className="font-heading text-2xl font-bold">Product {uuid}</h1></div>
}
