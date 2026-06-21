'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

interface ParallaxImageProps {
  src: string
  alt: string
  priority?: boolean
  sizes?: string
}

/**
 * Cover image rendered at a fixed, standard height with a subtle parallax pan.
 * The image is oversized (scale 1.12) inside an overflow-hidden frame and
 * translated on scroll, so it never grows tall when the container widens.
 * Honors prefers-reduced-motion and keeps next/image for optimization/LCP.
 */
export function ParallaxImage({ src, alt, priority = false, sizes }: ParallaxImageProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const frame = frameRef.current
    const inner = innerRef.current
    if (!frame || !inner) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    const update = () => {
      raf = 0
      const rect = frame.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2)
      const shift = Math.max(-1, Math.min(1, progress)) * 28
      inner.style.transform = `translate3d(0, ${shift}px, 0) scale(1.12)`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={frameRef} className="relative mb-8 h-72 overflow-hidden rounded-xl bg-surface-secondary sm:h-80 md:h-96">
      <div ref={innerRef} className="absolute inset-0 will-change-transform" style={{ transform: 'scale(1.12)' }}>
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      </div>
    </div>
  )
}
