'use client'

import * as RadixTabs from '@radix-ui/react-tabs'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const tabsListVariants = cva('flex', {
  variants: {
    variant: {
      underline: 'border-b border-border gap-0',
      pill: 'bg-surface-secondary rounded-lg p-1 gap-1',
      bordered: 'border border-border rounded-lg p-1 gap-1',
    },
  },
  defaultVariants: { variant: 'underline' },
})

const tabsTriggerVariants = cva(
  'text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
  {
    variants: {
      variant: {
        underline:
          'px-4 py-2.5 text-content-muted border-b-2 border-transparent -mb-px data-[state=active]:border-brand-500 data-[state=active]:text-brand-600',
        pill: 'px-3 py-1.5 rounded-md text-content-muted data-[state=active]:bg-surface data-[state=active]:text-content-primary data-[state=active]:shadow-sm',
        bordered:
          'px-3 py-1.5 rounded-md text-content-muted data-[state=active]:bg-brand-500 data-[state=active]:text-white',
      },
    },
    defaultVariants: { variant: 'underline' },
  }
)

interface TabItem {
  value: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

interface TabsProps extends VariantProps<typeof tabsListVariants> {
  items: TabItem[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

function Tabs({ items, defaultValue, value, onValueChange, variant, className }: TabsProps) {
  return (
    <RadixTabs.Root
      defaultValue={defaultValue ?? items[0]?.value}
      value={value}
      onValueChange={onValueChange}
      className={cn('flex flex-col gap-4', className)}
    >
      <RadixTabs.List className={cn(tabsListVariants({ variant }))}>
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(tabsTriggerVariants({ variant }))}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value}>
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}

export { Tabs }
export type { TabsProps, TabItem }
