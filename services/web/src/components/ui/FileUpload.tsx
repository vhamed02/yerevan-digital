'use client'

import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { UploadCloud, X, File } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  multiple?: boolean
  accept?: Record<string, string[]>
  maxSize?: number
  onChange?: (files: File[]) => void
  className?: string
  disabled?: boolean
}

interface FilePreview {
  file: File
  preview: string | null
}

function FileUpload({
  multiple = false,
  accept = { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
  maxSize = 20 * 1024 * 1024,
  onChange,
  className,
  disabled,
}: FileUploadProps) {
  const [files, setFiles] = useState<FilePreview[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      const previews: FilePreview[] = accepted.map((f) => ({
        file: f,
        preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      }))

      setFiles((prev) => (multiple ? [...prev, ...previews] : previews))
      setErrors(rejected.flatMap((r) => r.errors.map((e) => e.message)))
      onChange?.(multiple ? [...files.map((f) => f.file), ...accepted] : accepted)
    },
    [files, multiple, onChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept,
    maxSize,
    disabled,
  })

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onChange?.(updated.map((f) => f.file))
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors cursor-pointer',
          'hover:border-brand-400 hover:bg-brand-50',
          isDragActive && 'border-brand-500 bg-brand-50',
          disabled && 'cursor-not-allowed opacity-50 pointer-events-none'
        )}
      >
        <input {...getInputProps()} aria-label="File upload" />
        <UploadCloud className="mb-3 h-8 w-8 text-content-muted" />
        <p className="text-sm font-medium text-content-primary">
          {isDragActive ? 'Drop files here' : 'Drag & drop or click to browse'}
        </p>
        <p className="mt-1 text-xs text-content-muted">
          Max size: {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      </div>

      {errors.length > 0 && (
        <ul className="flex flex-col gap-1">
          {errors.map((e, i) => (
            <li key={i} className="text-xs text-status-error" role="alert">
              {e}
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {files.map((f, i) => (
            <li key={i} className="relative">
              {f.preview ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-md border border-border">
                  <Image src={f.preview} alt={f.file.name} fill className="object-cover" sizes="80px" />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-md border border-border bg-surface-secondary">
                  <File className="h-8 w-8 text-content-muted" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-status-error text-white hover:bg-red-600"
                aria-label={`Remove ${f.file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { FileUpload }
export type { FileUploadProps }
