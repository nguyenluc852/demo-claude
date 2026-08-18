import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { STRINGS } from '../../constants'
import { Button } from '../atoms'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** While true a blocking overlay covers the dialog so no second click lands. */
  busy?: boolean
  busyLabel?: string
}

export function Modal({ title, onClose, children, footer, busy = false, busyLabel }: ModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, busy])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={busy ? undefined : onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {busy ? (
          <div className="modal-overlay" role="status">
            <span className="spinner-dot" aria-hidden="true" />
            <span>{busyLabel ?? STRINGS.common.saving}</span>
          </div>
        ) : null}
        <div className="modal-head">
          <h2>{title}</h2>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {STRINGS.common.close}
          </Button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  )
}
