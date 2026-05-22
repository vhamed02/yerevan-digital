import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test the URL construction and fetch call in isolation
// (useEffect is not testable in node environment — we test the side-effect logic directly)

const API_URL = 'https://radif.org'

function buildViewUrl(storeSlug: string, productSlug: string): string {
  return `${API_URL}/api/v1/store/${storeSlug}/products/${productSlug}/view`
}

async function recordView(storeSlug: string, productSlug: string, fetchFn: typeof fetch): Promise<void> {
  const url = buildViewUrl(storeSlug, productSlug)
  await fetchFn(url, { method: 'POST' }).catch(() => {})
}

describe('ViewRecorder logic', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({ ok: true })
  })

  it('calls fetch with the correct POST URL', async () => {
    await recordView('my-store', 'my-product', mockFetch as unknown as typeof fetch)

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/api/v1/store/my-store/products/my-product/view`,
      { method: 'POST' },
    )
  })

  it('includes both storeSlug and productSlug in the URL', async () => {
    await recordView('yerevan-tech', 'sony-headphones', mockFetch as unknown as typeof fetch)

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('yerevan-tech')
    expect(calledUrl).toContain('sony-headphones')
  })

  it('does not throw when fetch rejects', async () => {
    mockFetch.mockRejectedValue(new Error('network error'))

    await expect(
      recordView('my-store', 'my-product', mockFetch as unknown as typeof fetch),
    ).resolves.toBeUndefined()
  })

  it('uses POST method', async () => {
    await recordView('my-store', 'my-product', mockFetch as unknown as typeof fetch)

    const options = mockFetch.mock.calls[0][1] as RequestInit
    expect(options.method).toBe('POST')
  })
})
