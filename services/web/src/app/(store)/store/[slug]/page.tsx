export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <main className="p-8"><h1 className="font-heading text-2xl font-bold">Store: {slug}</h1></main>
}
