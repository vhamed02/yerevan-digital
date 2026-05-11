import { Input } from '@/components/ui/Input'
import MarginCalculator from './MarginCalculator'

interface PricingSectionProps {
  price: number
  comparePrice: number | null
  costPrice: number | null
  onChange: (field: 'price' | 'compare_price' | 'cost_price', value: number | null) => void
}

export default function PricingSection({ price, comparePrice, costPrice, onChange }: PricingSectionProps) {
  function handleChange(field: 'price' | 'compare_price' | 'cost_price', raw: string) {
    const val = raw === '' ? null : parseFloat(raw)
    onChange(field, Number.isNaN(val) ? null : val)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Price (AMD ֏)"
          type="number"
          min={0}
          step={100}
          value={price || ''}
          onChange={(e) => handleChange('price', e.target.value)}
          required
        />
        <Input
          label="Compare Price (֏)"
          type="number"
          min={0}
          step={100}
          value={comparePrice ?? ''}
          onChange={(e) => handleChange('compare_price', e.target.value)}
          helperText="Original / crossed-out price"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Cost Price (private)"
          type="number"
          min={0}
          step={100}
          value={costPrice ?? ''}
          onChange={(e) => handleChange('cost_price', e.target.value)}
          helperText="Not shown to customers"
        />
        <div className="flex flex-col justify-end pb-0.5">
          <MarginCalculator price={price} costPrice={costPrice ?? 0} />
        </div>
      </div>
    </div>
  )
}
