export default async function StorePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <main className="p-8"><p>Redirecting to store: {slug}</p></main>
}
