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
