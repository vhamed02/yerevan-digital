export type TemplateKey = 'minimal' | 'spark'

const templateLoaders = {
  minimal: () => import('@/templates/minimal'),
  spark: () => import('@/templates/spark'),
} as const

export async function loadTemplate(key: TemplateKey | string) {
  const loader = templateLoaders[key as TemplateKey] ?? templateLoaders.minimal
  return loader()
}
