'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Heading2, Heading3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

const tools = [
  { command: 'bold', icon: Bold, label: 'Bold' },
  { command: 'italic', icon: Italic, label: 'Italic' },
  { command: 'underline', icon: Underline, label: 'Underline' },
  { command: 'insertUnorderedList', icon: List, label: 'Bullet list' },
  { command: 'insertOrderedList', icon: ListOrdered, label: 'Ordered list' },
  { command: 'h2', icon: Heading2, label: 'Heading 2' },
  { command: 'h3', icon: Heading3, label: 'Heading 3' },
  { command: 'createLink', icon: LinkIcon, label: 'Insert link' },
] as const

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isComposing = useRef(false)

  useEffect(() => {
    const el = editorRef.current
    if (el && el.innerHTML !== value) {
      el.innerHTML = value
    }
  }, [])

  const handleInput = useCallback(() => {
    if (!isComposing.current && editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  function execCommand(command: string) {
    if (command === 'h2') {
      document.execCommand('formatBlock', false, 'h2')
    } else if (command === 'h3') {
      document.execCommand('formatBlock', false, 'h3')
    } else if (command === 'createLink') {
      const url = prompt('Enter URL:')
      if (url) document.execCommand('createLink', false, url)
    } else {
      document.execCommand(command, false)
    }
    editorRef.current?.focus()
    handleInput()
  }

  return (
    <div className={cn('flex flex-col rounded-md border border-border bg-surface overflow-hidden', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface-secondary px-2 py-1.5">
        {tools.map((tool) => (
          <button
            key={tool.command}
            type="button"
            title={tool.label}
            onMouseDown={(e) => {
              e.preventDefault()
              execCommand(tool.command)
            }}
            className="rounded p-1.5 text-content-muted hover:bg-border hover:text-content-primary transition-colors"
            aria-label={tool.label}
          >
            <tool.icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={() => { isComposing.current = true }}
        onCompositionEnd={() => { isComposing.current = false; handleInput() }}
        data-placeholder={placeholder}
        className={cn(
          'min-h-[160px] px-3 py-2.5 text-sm text-content-primary outline-none',
          'prose prose-sm max-w-none',
          '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-content-muted'
        )}
      />
    </div>
  )
}
