export default async function ProductPage({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params
  return <main className="p-8"><h1 className="font-heading text-2xl">{productSlug} — {slug}</h1></main>
}
