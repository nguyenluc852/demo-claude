import { Text } from '../atoms'

interface StatusBadgeProps {
  label: string
  tone: 'default' | 'muted' | 'danger' | 'success'
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return <Text tone={tone}>{label}</Text>
}
