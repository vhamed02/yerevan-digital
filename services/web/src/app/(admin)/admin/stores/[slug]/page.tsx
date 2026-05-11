export default async function AdminStoreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <div className="p-8"><h1 className="font-heading text-2xl font-bold">Store: {slug}</h1></div>
}
