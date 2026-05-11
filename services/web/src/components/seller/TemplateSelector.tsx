import { cn } from '@/lib/utils'
import type { SellerTemplate } from '@/types'

interface TemplateSelectorProps {
  templates: SellerTemplate[]
  selectedId: number | null
  previewId: number | null
  onSelect: (id: number) => void
  onPreview: (id: number) => void
}

export default function TemplateSelector({
  templates,
  selectedId,
  previewId,
  onSelect,
  onPreview,
}: TemplateSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {templates.map((template) => {
        const isSelected = template.id === selectedId
        const isPreviewing = template.id === previewId
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onPreview(template.id)}
            className={cn(
              'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
              isSelected ? 'border-brand-500 bg-brand-50' : 'border-border hover:border-brand-300'
            )}
          >
            <div
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                isSelected ? 'border-brand-500 bg-brand-500' : 'border-border'
              )}
            >
              {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-content-primary">{template.name}</p>
              {template.description && (
                <p className="text-xs text-content-muted truncate">{template.description}</p>
              )}
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                isSelected
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-secondary text-content-muted'
              )}
            >
              {isSelected ? 'Active' : 'Preview'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
