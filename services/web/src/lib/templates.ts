export type TemplateKey = 'minimal' | 'bold' | 'elegant'

const templateLoaders = {
  minimal: () => import('@/templates/minimal'),
  bold: () => import('@/templates/bold'),
  elegant: () => import('@/templates/elegant'),
} as const

export async function loadTemplate(key: TemplateKey | string) {
  const loader = templateLoaders[key as TemplateKey] ?? templateLoaders.minimal
  return loader()
}
