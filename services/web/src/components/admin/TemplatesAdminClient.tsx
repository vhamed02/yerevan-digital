'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { AdminTemplate } from '@/types'

interface TemplatesAdminClientProps {
  initialTemplates: AdminTemplate[]
}

export default function TemplatesAdminClient({ initialTemplates }: TemplatesAdminClientProps) {
  const queryClient = useQueryClient()

  const { data: templates } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const res = await api.get<{ data: AdminTemplate[] }>('/admin/templates')
      return res.data.data
    },
    initialData: initialTemplates,
    staleTime: 60000,
  })

  const toggleMutation = useMutation({
    mutationFn: (template: AdminTemplate) =>
      api.patch(`/admin/templates/${template.id}`, { is_active: !template.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] })
      toast.success('Template updated')
    },
    onError: () => toast.error('Failed to update template'),
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold text-content-primary">Templates</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {templates.length === 0 ? (
          <div className="col-span-full flex min-h-[200px] items-center justify-center rounded-xl border border-border text-content-muted">
            No templates found
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="flex flex-col rounded-xl border border-border bg-surface overflow-hidden"
            >
              <div className="flex h-36 items-center justify-center bg-surface-secondary">
                {template.preview_url ? (
                  <img
                    src={template.preview_url}
                    alt={template.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl text-content-muted">🎨</span>
                )}
              </div>
              <div className="flex flex-col gap-3 p-4">
                <div>
                  <p className="font-semibold text-content-primary">{template.name}</p>
                  {template.description && (
                    <p className="text-xs text-content-muted">{template.description}</p>
                  )}
                  <p className="mt-1 text-xs text-content-muted">
                    Used by: {template.store_count} stores
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      template.is_active ? 'bg-status-success' : 'bg-content-muted'
                    )}
                  />
                  <span className="text-xs text-content-muted">
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleMutation.mutate(template)}
                    loading={
                      toggleMutation.isPending &&
                      (toggleMutation.variables as AdminTemplate | undefined)?.id === template.id
                    }
                  >
                    {template.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
