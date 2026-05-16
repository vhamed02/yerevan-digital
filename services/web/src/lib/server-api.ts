import { cookies } from 'next/headers'

function baseUrl() {
  return (process.env.SERVER_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api/v1'
}

function internalHeaders(extra?: HeadersInit): HeadersInit {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
  const apiHost = publicUrl ? new URL(publicUrl).host : ''
  return {
    ...(process.env.SERVER_API_URL && apiHost ? { Host: apiHost } : {}),
    ...extra,
  }
}

function unwrap<T>(json: unknown): T | null {
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return (json as { data: T }).data ?? null
  }
  return json as T
}

export async function serverGet<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: internalHeaders(init?.headers),
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
    const token = cookieStore.get('vendora_token')?.value
    const res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: internalHeaders({
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      }),
    })
    if (!res.ok) return null
    return unwrap<T>(await res.json())
  } catch {
    return null
  }
}
