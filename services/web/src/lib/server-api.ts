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
