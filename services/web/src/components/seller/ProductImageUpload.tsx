'use client'

import { useState, useRef } from 'react'
import { X, GripVertical } from 'lucide-react'

export interface ProductImageItem {
  id: string
  url: string
  file?: File
}

interface ProductImageUploadProps {
  images: ProductImageItem[]
  onChange: (images: ProductImageItem[]) => void
  maxImages?: number
}

export default function ProductImageUpload({
  images,
  onChange,
  maxImages = 10,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragIndex = useRef<number | null>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const remaining = maxImages - images.length
    const newImages: ProductImageItem[] = Array.from(files)
      .slice(0, remaining)
      .map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        file,
      }))
    onChange([...images, ...newImages])
  }

  function removeImage(id: string) {
    onChange(images.filter((img) => img.id !== id))
  }

  function onDragStart(index: number) {
    dragIndex.current = index
  }

  function onDrop(targetIndex: number) {
    const from = dragIndex.current
    if (from === null || from === targetIndex) {
      dragIndex.current = null
      setDragOverIndex(null)
      return
    }
    const reordered = [...images]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(targetIndex, 0, moved)
    onChange(reordered)
    dragIndex.current = null
    setDragOverIndex(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length < maxImages && (
        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 transition-colors hover:border-brand-500 hover:bg-brand-50"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFiles(e.dataTransfer.files)
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        >
          <p className="text-sm font-medium text-content-secondary">Drag and drop images here</p>
          <p className="text-sm text-content-muted">or click to browse</p>
          <p className="text-xs text-content-muted">
            Max {maxImages} images • Max 5MB each • JPG, PNG, WebP
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {images.map((img, index) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index) }}
              onDrop={() => onDrop(index)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                dragOverIndex === index ? 'border-brand-500' : 'border-border'
              }`}
            >
              <img src={img.url} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-1 left-1 text-white opacity-60">
                <GripVertical className="h-3.5 w-3.5 cursor-grab" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
