import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkoutSuccessUrl,
  clearPendingOrder,
  expandGatewayKeys,
  readPendingOrder,
  rememberPendingOrder,
} from '@/lib/payment'

describe('expandGatewayKeys', () => {
  it('splits idram into its wallet and card surfaces', () => {
    expect(expandGatewayKeys(['idram'])).toEqual(['idram', 'idram_card'])
  })

  it('leaves every other gateway untouched', () => {
    expect(expandGatewayKeys(['telcell', 'inecobank'])).toEqual(['telcell', 'inecobank'])
  })

  it('preserves ordering around the expansion', () => {
    expect(expandGatewayKeys(['telcell', 'idram', 'ameria'])).toEqual([
      'telcell',
      'idram',
      'idram_card',
      'ameria',
    ])
  })

  it('handles a store with no gateways enabled', () => {
    expect(expandGatewayKeys([])).toEqual([])
  })
})

describe('checkoutSuccessUrl', () => {
  const setLocation = (origin: string, pathname: string) => {
    Object.defineProperty(global.window, 'location', {
      value: { origin, pathname, href: `${origin}${pathname}` },
      writable: true,
      configurable: true,
    })
  }

  it('derives the confirmation URL on a platform storefront path', () => {
    setLocation('https://yerevan.digital', '/store/my-shop/checkout')

    expect(checkoutSuccessUrl('abc-123')).toBe(
      'https://yerevan.digital/store/my-shop/checkout/success?order=abc-123',
    )
  })

  it('derives it on a custom domain, where there is no /store/{slug} prefix', () => {
    setLocation('https://shop.example.am', '/checkout')

    expect(checkoutSuccessUrl('abc-123')).toBe(
      'https://shop.example.am/checkout/success?order=abc-123',
    )
  })

  it('tolerates a trailing slash', () => {
    setLocation('https://shop.example.am', '/checkout/')

    expect(checkoutSuccessUrl('abc-123')).toBe(
      'https://shop.example.am/checkout/success?order=abc-123',
    )
  })

  it('encodes the order id', () => {
    setLocation('https://shop.example.am', '/checkout')

    expect(checkoutSuccessUrl('a b&c')).toContain('order=a%20b%26c')
  })
})

describe('pending order handoff', () => {
  beforeEach(() => {
    const store: Record<string, string> = {}
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v },
        removeItem: (k: string) => { delete store[k] },
      },
      writable: true,
      configurable: true,
    })
  })

  it('round-trips an order id for a store', () => {
    rememberPendingOrder('my-shop', 'uuid-1')
    expect(readPendingOrder('my-shop')).toBe('uuid-1')
  })

  it('keeps stores isolated from each other', () => {
    rememberPendingOrder('shop-a', 'uuid-a')
    rememberPendingOrder('shop-b', 'uuid-b')

    expect(readPendingOrder('shop-a')).toBe('uuid-a')
    expect(readPendingOrder('shop-b')).toBe('uuid-b')
  })

  it('clears only the requested store', () => {
    rememberPendingOrder('shop-a', 'uuid-a')
    rememberPendingOrder('shop-b', 'uuid-b')

    clearPendingOrder('shop-a')

    expect(readPendingOrder('shop-a')).toBeNull()
    expect(readPendingOrder('shop-b')).toBe('uuid-b')
  })

  it('returns null when nothing was stored', () => {
    expect(readPendingOrder('never-used')).toBeNull()
  })

  /** Private-mode browsers throw on storage access — that must not break checkout. */
  it('survives storage being unavailable', () => {
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: () => { throw new Error('denied') },
        setItem: () => { throw new Error('denied') },
        removeItem: () => { throw new Error('denied') },
      },
      writable: true,
      configurable: true,
    })

    expect(() => rememberPendingOrder('my-shop', 'uuid-1')).not.toThrow()
    expect(() => clearPendingOrder('my-shop')).not.toThrow()
    expect(readPendingOrder('my-shop')).toBeNull()
  })
})

describe('redirectToGateway', () => {
  it('follows a plain redirect when there are no form params', async () => {
    const { redirectToGateway } = await import('@/lib/payment')

    Object.defineProperty(global.window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    })

    redirectToGateway('https://gateway.example/pay')

    expect(global.window.location.href).toBe('https://gateway.example/pay')
  })

  it('builds and submits a POST form when params are present', async () => {
    const { redirectToGateway } = await import('@/lib/payment')

    const submit = vi.fn()
    const form: Record<string, unknown> = { appendChild: vi.fn(), submit }
    const created: string[] = []

    Object.defineProperty(global, 'document', {
      value: {
        createElement: (tag: string) => {
          created.push(tag)
          return tag === 'form' ? form : {}
        },
        body: { appendChild: vi.fn() },
      },
      writable: true,
      configurable: true,
    })

    redirectToGateway('https://banking.idram.am/Payment/GetPayment', {
      EDP_REC_ACCOUNT: '100000114',
      EDP_AMOUNT: '15000.00',
    })

    expect(form.method).toBe('POST')
    expect(form.action).toBe('https://banking.idram.am/Payment/GetPayment')
    expect(created.filter((t) => t === 'input')).toHaveLength(2)
    expect(submit).toHaveBeenCalledOnce()
  })
})
