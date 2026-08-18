import type { ReactNode } from 'react'

type TextTone = 'default' | 'muted' | 'danger' | 'success'

interface TextProps {
  children: ReactNode
  tone?: TextTone
}

export function Text({ children, tone = 'default' }: TextProps) {
  return <span data-tone={tone}>{children}</span>
}
