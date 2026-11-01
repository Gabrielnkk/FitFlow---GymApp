import type { CardioLevel } from '../types'
import { CARDIO_LEVELS } from '../utils/cardio'
import PickerSelect from './PickerSelect'

interface Props {
  value: CardioLevel | undefined
  onChange: (level: CardioLevel) => void
}

export default function CardioSelect({ value, onChange }: Props) {
  return (
    <PickerSelect<CardioLevel>
      title="Intensidade do cardio"
      value={value ?? 'moderate'}
      options={CARDIO_LEVELS}
      onChange={(v) => {
        if (v !== '') onChange(v)
      }}
    />
  )
}