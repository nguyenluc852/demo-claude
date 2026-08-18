import { useState } from 'react'

import { STRINGS } from '../../constants'
import { Button } from '../atoms'

interface ImageGalleryProps {
  images: string[]
  alt: string
}

/** Slide-through gallery for the room detail modal. */
export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [index, setIndex] = useState(0)

  if (images.length === 0) {
    return <p data-tone="muted">{STRINGS.room.noImages}</p>
  }

  const step = (delta: number) =>
    setIndex((current) => (current + delta + images.length) % images.length)

  return (
    <div className="gallery">
      <img src={images[index]} alt={`${alt} ${index + 1}`} />
      {images.length > 1 ? (
        <>
          <Button
            className="gallery-nav"
            data-side="prev"
            aria-label={STRINGS.room.galleryPrev}
            onClick={() => step(-1)}
          >
            ‹
          </Button>
          <Button
            className="gallery-nav"
            data-side="next"
            aria-label={STRINGS.room.galleryNext}
            onClick={() => step(1)}
          >
            ›
          </Button>
          <span className="gallery-count">
            {index + 1}/{images.length}
          </span>
        </>
      ) : null}
    </div>
  )
}
