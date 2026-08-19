import { useEffect, useRef, useState } from 'react'

/**
 * True once the element has scrolled into view, and true forever after — the
 * page reveals a section as you reach it, but scrolling back up must not hide
 * anything you already read.
 *
 * Starts at `true` when IntersectionObserver is missing (old browsers, jsdom),
 * so a section can never get stuck in its hidden state.
 */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, inView] as const
}
