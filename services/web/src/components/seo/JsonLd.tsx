/**
 * Renders a server-side JSON-LD <script> for structured data (schema.org).
 * Crawlers read this from the initial HTML, so it must be rendered on the server.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
