'use client'

import * as RadixSelect from '@radix-ui/react-select'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectGroup {
  label: string
  options: SelectOption[]
}

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  options?: SelectOption[]
  groups?: SelectGroup[]
  disabled?: boolean
  className?: string
  label?: string
  error?: string
}

function Select({
  value,
  onValueChange,
  placeholder = 'Select...',
  options,
  groups,
  disabled,
  className,
  label,
  error,
}: SelectProps) {
  const id = label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-content-primary">
          {label}
        </label>
      )}
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger
          id={id}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded border border-border bg-surface px-3 py-2 text-sm text-content-primary',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[placeholder]:text-content-muted',
            error && 'border-status-error',
            className
          )}
          aria-invalid={!!error}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown className="h-4 w-4 text-content-muted" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-surface shadow-lg"
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.ScrollUpButton className="flex h-6 items-center justify-center text-content-muted">
              <ChevronUp className="h-4 w-4" />
            </RadixSelect.ScrollUpButton>
            <RadixSelect.Viewport className="p-1">
              {options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </SelectItem>
              ))}
              {groups?.map((group) => (
                <RadixSelect.Group key={group.label}>
                  <RadixSelect.Label className="px-2 py-1.5 text-xs font-semibold text-content-muted">
                    {group.label}
                  </RadixSelect.Label>
                  {group.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </RadixSelect.Group>
              ))}
            </RadixSelect.Viewport>
            <RadixSelect.ScrollDownButton className="flex h-6 items-center justify-center text-content-muted">
              <ChevronDown className="h-4 w-4" />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && (
        <p className="text-xs text-status-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function SelectItem({
  value,
  children,
  disabled,
}: {
  value: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <RadixSelect.Item
      value={value}
      disabled={disabled}
      className="relative flex h-9 cursor-pointer select-none items-center rounded px-8 text-sm text-content-primary outline-none data-[highlighted]:bg-surface-secondary data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    >
      <RadixSelect.ItemIndicator className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <Check className="h-3.5 w-3.5 text-brand-500" />
      </RadixSelect.ItemIndicator>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  )
}

export { Select }
export type { SelectProps, SelectOption, SelectGroup }
