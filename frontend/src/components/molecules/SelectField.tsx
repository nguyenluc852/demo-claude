import { Select } from '../atoms'

interface SelectFieldProps {
  label: string
  name: string
  value: string
  /** `[value, label]` pairs, as produced by the option lists in utils/labels. */
  options: readonly (readonly [string, string])[]
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function SelectField({
  label,
  name,
  value,
  options,
  onChange,
  disabled,
  placeholder,
}: SelectFieldProps) {
  return (
    <label className="field" htmlFor={name}>
      <span>{label}</span>
      <Select
        id={name}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </Select>
    </label>
  )
}
