interface MarginCalculatorProps {
  price: number
  costPrice: number
}

export default function MarginCalculator({ price, costPrice }: MarginCalculatorProps) {
  if (!price || !costPrice || price <= 0) return null
  const margin = ((price - costPrice) / price) * 100
  const profit = price - costPrice

  return (
    <div className="flex items-center gap-2 rounded-md bg-surface-secondary px-3 py-2 text-sm">
      <span className="text-content-muted">Margin</span>
      <span className={`font-semibold ${margin >= 0 ? 'text-status-success' : 'text-status-error'}`}>
        {margin.toFixed(1)}%
      </span>
      <span className="text-content-muted">=</span>
      <span className={`font-medium ${profit >= 0 ? 'text-status-success' : 'text-status-error'}`}>
        {profit.toLocaleString()} ֏
      </span>
    </div>
  )
}
