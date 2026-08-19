import type { CSSProperties } from 'react'

/**
 * Hands a card its position in the grid so CSS can delay its reveal.
 * The delay itself lives in index.css, where reduced-motion can switch it off.
 */
export function stagger(index: number): CSSProperties {
  return { '--i': index } as CSSProperties
}
