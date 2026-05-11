'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import * as MinimalTemplate from '@/templates/minimal'
import * as BoldTemplate from '@/templates/bold'
import * as ElegantTemplate from '@/templates/elegant'
import type { StorefrontStore, PublicCategory } from '@/types'

const TEMPLATES = {
  minimal: MinimalTemplate,
  bold: BoldTemplate,
  elegant: ElegantTemplate,
} as const

type TemplateKey = keyof typeof TEMPLATES

interface Props {
  store: StorefrontStore
  categories: PublicCategory[]
  children: React.ReactNode
}

function Inner({ store, categories, children }: Props) {
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  const previewTemplateKey = searchParams.get('template')
  const previewPrimary = searchParams.get('primary')

  const templateKey: TemplateKey =
    (isPreview && previewTemplateKey && previewTemplateKey in TEMPLATES
      ? previewTemplateKey
      : store.active_template_key) as TemplateKey

  const Template = TEMPLATES[templateKey] ?? TEMPLATES.minimal

  const effectiveStore: StorefrontStore =
    isPreview && previewPrimary
      ? {
          ...store,
          template_config: {
            ...store.template_config,
            primary_color: decodeURIComponent(previewPrimary),
          },
        }
      : store

  const cssVars = {
    '--store-primary': effectiveStore.template_config.primary_color || '#6366f1',
    '--store-secondary': effectiveStore.template_config.secondary_color || '#8b5cf6',
    '--store-font-heading': effectiveStore.template_config.font_heading || 'Inter',
  } as React.CSSProperties

  return (
    <div style={cssVars}>
      <Template.StoreHeader
        store={effectiveStore}
        categories={categories}
        slug={store.slug}
        isPreview={isPreview}
      />
      {children}
      <Template.StoreFooter store={effectiveStore} />
    </div>
  )
}

export function StoreLayoutClient({ store, categories, children }: Props) {
  return (
    <Suspense>
      <Inner store={store} categories={categories}>
        {children}
      </Inner>
    </Suspense>
  )
}
