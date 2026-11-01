import type { SetKind } from '../types'
import { SET_KINDS } from '../utils/sets'
import PickerSelect from './PickerSelect'

interface Props {
  value: SetKind | undefined
  onChange: (kind: SetKind) => void
}

export default function SetKindSelect({ value, onChange }: Props) {
  return (
    <PickerSelect<SetKind>
      title="Tipo de série"
      value={value ?? 'normal'}
      options={SET_KINDS}
      onChange={(v) => {
        if (v !== '') onChange(v)
      }}
    />
  )
}