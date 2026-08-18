import { STRINGS } from '../../constants'
import { Button } from '../atoms'

interface ThumbListProps {
  images: string[]
  onRemove: (url: string) => void
  disabled?: boolean
}

/** Thumbnails of the gallery being edited, each removable on hover or focus. */
export function ThumbList({ images, onRemove, disabled }: ThumbListProps) {
  if (images.length === 0) {
    return <p data-tone="muted">{STRINGS.room.noImages}</p>
  }

  return (
    <div className="thumb-grid">
      {images.map((url) => (
        <div className="thumb" key={url}>
          <img src={url} alt="" loading="lazy" />
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={() => onRemove(url)}
            aria-label={`${STRINGS.room.removeImage}: ${url}`}
          >
            {STRINGS.common.delete}
          </Button>
        </div>
      ))}
    </div>
  )
}
