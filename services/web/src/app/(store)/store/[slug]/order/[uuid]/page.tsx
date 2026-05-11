export default async function OrderConfirmationPage({ params }: { params: Promise<{ slug: string; uuid: string }> }) {
  const { uuid } = await params
  return <main className="p-8"><h1 className="font-heading text-2xl">Order #{uuid}</h1></main>
}
