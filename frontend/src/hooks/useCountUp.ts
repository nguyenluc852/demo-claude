import { useEffect, useState } from 'react'

import { COUNT_UP_MS } from '../constants'

/** Matches the media query the stylesheet uses to switch every animation off. */
function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

const easeOut = (t: number) => 1 - (1 - t) ** 3

/**
 * Runs a number up from zero once `active` turns true, then leaves it there.
 *
 * Returns an integer at every step: these values are money and room counts, and
 * a total whose lower digits churn is harder to read than one that simply grows.
 * Jumps straight to the final value when the visitor asked for reduced motion,
 * or when requestAnimationFrame is unavailable.
 */
export function useCountUp(target: number, active: boolean, duration = COUNT_UP_MS): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) {
      return
    }
    if (prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
      setValue(target)
      return
    }

    let frame = 0
    const start = performance.now()

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.round(target * easeOut(progress)))
      if (progress < 1) {
        frame = requestAnimationFrame(step)
      }
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, active, duration])

  return value
}
