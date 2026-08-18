interface NoticeProps {
  message: string
  tone?: 'danger' | 'success' | 'default'
}

export function Notice({ message, tone = 'default' }: NoticeProps) {
  return (
    <p className="notice" data-tone={tone} role={tone === 'danger' ? 'alert' : 'status'}>
      {message}
    </p>
  )
}
