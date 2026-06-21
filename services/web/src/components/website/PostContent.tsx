'use client'

import { useEffect, useRef } from 'react'

interface PostContentProps {
  html: string
  className?: string
}

/**
 * Renders the post body (server-sanitized HTML) and applies a subtle parallax
 * pan to each `<figure>` image. The `.article-body figure` CSS frames every
 * image in a fixed-height window with an overlay caption, so images stay a
 * standard height even as the article column widens. Honors reduced-motion.
 */
export function PostContent({ html, className }: PostContentProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const images = Array.from(root.querySelectorAll('figure img')) as HTMLImageElement[]
    if (images.length === 0) return

    let raf = 0
    const update = () => {
      raf = 0
      const vh = window.innerHeight || 1
      for (const img of images) {
        const frame = img.parentElement
        if (!frame) continue
        const rect = frame.getBoundingClientRect()
        if (rect.bottom < -240 || rect.top > vh + 240) continue
        const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2)
        const shift = Math.max(-1, Math.min(1, progress)) * 22
        img.style.transform = `translate3d(0, ${shift}px, 0)`
      }
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
  }, [html])

  return (
    <div
      ref={ref}
      className={className ? `${className} article-body` : 'article-body'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
