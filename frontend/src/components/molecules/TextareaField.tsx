import type { TextareaHTMLAttributes } from 'react'

import { Textarea } from '../atoms'

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  name: string
}

export function TextareaField({ label, name, ...rest }: TextareaFieldProps) {
  return (
    <label className="field" htmlFor={name}>
      <span>{label}</span>
      <Textarea id={name} name={name} {...rest} />
    </label>
  )
}
