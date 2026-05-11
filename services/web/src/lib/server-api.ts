import { cookies } from 'next/headers'

function baseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api/v1'
}

export async function serverGet<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${baseUrl()}${path}`, init)
    if (!res.ok) return null
    return res.json() as Promise<T>
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
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}
