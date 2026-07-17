import { cookies, headers } from 'next/headers'

function baseUrl() {
  return (process.env.SERVER_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api/v1'
}

function unwrap<T>(json: unknown): T | null {
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return (json as { data: T }).data ?? null
  }
  return json as T
}

async function clientIpHeaders(): Promise<Record<string, string>> {
  try {
    const h = await headers()
    const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip')
    return ip ? { 'X-Client-IP': ip } : {}
  } catch {
    return {}
  }
}

export async function serverGet<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const ipHeaders = await clientIpHeaders()
    const res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: { ...ipHeaders, ...init?.headers },
    })
    if (!res.ok) return null
    return unwrap<T>(await res.json())
  } catch {
    return null
  }
}

export async function serverAuthGet<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('yerevan_digital_token')?.value
    const res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })
    if (!res.ok) return null
    return unwrap<T>(await res.json())
  } catch {
    return null
  }
}
