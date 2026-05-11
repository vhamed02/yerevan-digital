export default async function SellerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <div className="p-8"><h1 className="font-heading text-2xl font-bold">Seller #{id}</h1></div>
}
