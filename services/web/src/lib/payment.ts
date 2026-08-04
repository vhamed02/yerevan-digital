/**
 * How the browser should hand off to a gateway, as returned by
 * `/payments/initiate`.
 *
 * - `redirect` — follow `redirect_url` with a plain GET.
 * - `form`     — POST `form_params` to `redirect_url` (Idram wallet, Telcell).
 * - `iframe`   — embed `redirect_url` and watch the order (Idram bank card).
 */
export type PaymentMode = 'redirect' | 'form' | 'iframe'

export interface InitiateResponse {
  redirect_url: string
  form_params?: Record<string, string> | null
  mode?: PaymentMode
}

/**
 * Turn the store's enabled gateway names into selectable checkout options.
 *
 * Idram is one merchant account with two payment surfaces — the wallet form and
 * the VISA/MasterCard iframe — so it becomes two choices at checkout. The
 * backend maps `idram_card` back onto the `idram` gateway and its credentials.
 */
export function expandGatewayKeys(gateways: string[]): string[] {
  return gateways.flatMap((key) => (key === 'idram' ? ['idram', 'idram_card'] : [key]))
}

/**
 * The confirmation URL for the current storefront, derived from where we are.
 *
 * Works for both `/store/{slug}/checkout` and a custom domain's `/checkout`
 * without needing to know which one is in play.
 */
export function checkoutSuccessUrl(orderUuid: string): string {
  const path = window.location.pathname.replace(/\/checkout\/?$/, '/checkout/success')
  return `${window.location.origin}${path}?order=${encodeURIComponent(orderUuid)}`
}

/**
 * Hand the browser off to a payment gateway.
 *
 * Some gateways (Idram, Telcell) don't accept a plain GET redirect — they
 * expect the invoice fields as a POST body to their own endpoint. When the
 * `/payments/initiate` response includes `form_params`, we build a hidden form
 * and submit it so the browser navigates away with the correct method + fields.
 * Otherwise we just follow `redirect_url`.
 */
export function redirectToGateway(
  redirectUrl: string,
  formParams?: Record<string, string> | null,
): void {
  if (!formParams || Object.keys(formParams).length === 0) {
    window.location.href = redirectUrl
    return
  }

  const form = document.createElement('form')
  form.method = 'POST'
  form.action = redirectUrl

  for (const [name, value] of Object.entries(formParams)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
}

/*
 * Idram fixes SUCCESS_URL and FAIL_URL against the merchant account at
 * agreement time — they are not sent per payment, so they cannot carry
 * `?order=<uuid>` the way our own sandbox return URLs do. The browser therefore
 * has to remember which order it was paying before it leaves for the gateway,
 * and the confirmation page reads it back on return.
 *
 * sessionStorage (not localStorage) so it dies with the tab, and is scoped per
 * store so two storefronts open at once can't confuse each other.
 */
const pendingOrderKey = (storeSlug: string) => `yd:pending-order:${storeSlug}`

export function rememberPendingOrder(storeSlug: string, orderUuid: string): void {
  try {
    sessionStorage.setItem(pendingOrderKey(storeSlug), orderUuid)
  } catch {
    // Private-mode / storage-disabled browsers just lose the nicety: the
    // confirmation page falls back to its generic "thank you" state.
  }
}

export function readPendingOrder(storeSlug: string): string | null {
  try {
    return sessionStorage.getItem(pendingOrderKey(storeSlug))
  } catch {
    return null
  }
}

export function clearPendingOrder(storeSlug: string): void {
  try {
    sessionStorage.removeItem(pendingOrderKey(storeSlug))
  } catch {
    // no-op
  }
}
