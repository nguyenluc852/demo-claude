interface TabsProps {
  value: string
  options: readonly (readonly [string, string])[]
  onChange: (value: string) => void
  label: string
}

export function Tabs({ value, options, onChange, label }: TabsProps) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {options.map(([optionValue, optionLabel]) => (
        <button
          key={optionValue}
          type="button"
          role="tab"
          className="tab"
          aria-selected={optionValue === value}
          onClick={() => onChange(optionValue)}
        >
          {optionLabel}
        </button>
      ))}
    </div>
  )
}
