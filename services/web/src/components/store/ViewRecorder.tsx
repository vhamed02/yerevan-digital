'use client'

import { useEffect } from 'react'

interface Props {
  storeSlug: string
  productSlug: string
}

export function ViewRecorder({ storeSlug, productSlug }: Props) {
  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/store/${storeSlug}/products/${productSlug}/view`
    fetch(url, { method: 'POST' }).catch(() => {})
  }, [storeSlug, productSlug])

  return null
}
