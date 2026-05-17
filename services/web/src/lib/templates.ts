export type TemplateKey = 'minimal'

const templateLoaders = {
  minimal: () => import('@/templates/minimal'),
} as const

export async function loadTemplate(key: TemplateKey | string) {
  const loader = templateLoaders[key as TemplateKey] ?? templateLoaders.minimal
  return loader()
}
