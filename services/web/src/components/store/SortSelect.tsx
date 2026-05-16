'use client'

interface Props {
  value: string
  options: { value: string; label: string }[]
}

export function SortSelect({ value, options }: Props) {
  return (
    <select
      defaultValue={value}
      onChange={(e) => {
        const url = new URL(window.location.href)
        url.searchParams.set('sort', e.target.value)
        window.location.href = url.toString()
      }}
      className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
