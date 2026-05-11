interface SeoPreviewProps {
  slug?: string
  storeSlug?: string
  title?: string
  description?: string
}

export default function SeoPreview({ slug, storeSlug, title, description }: SeoPreviewProps) {
  const url = `vendora.am › store › ${storeSlug ?? 'your-store'} › products › ${slug ?? 'product-slug'}`
  const displayTitle = title || 'Product Title'
  const displayDesc = description
    ? description.slice(0, 160)
    : 'Product description will appear here in Google search results...'

  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
        Google Preview
      </p>
      <div className="flex flex-col gap-1">
        <p className="break-all text-xs text-content-muted">{url}</p>
        <p className="text-base font-medium text-blue-600 hover:underline cursor-pointer">
          {displayTitle}
        </p>
        <p className="text-sm text-content-secondary">{displayDesc}</p>
      </div>
    </div>
  )
}
