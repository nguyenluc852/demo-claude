import type { InputHTMLAttributes } from 'react'

import { Input } from '../atoms'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
}

export function FormField({ label, name, ...rest }: FormFieldProps) {
  return (
    <label htmlFor={name}>
      {label}
      <Input id={name} name={name} {...rest} />
    </label>
  )
}
