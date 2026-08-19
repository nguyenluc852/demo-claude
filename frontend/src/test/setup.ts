import '@testing-library/jest-dom/vitest'

/**
 * jsdom ships no IntersectionObserver, and `useInView` guards for that by
 * starting visible. Stubbing it anyway keeps the reveal path itself under test:
 * this one reports the element as on screen the moment it is observed.
 *
 * Written as a factory rather than a class because `erasableSyntaxOnly` rules
 * out the constructor parameter property this would otherwise want.
 */
function immediateObserver(callback: IntersectionObserverCallback): IntersectionObserver {
  const observer = {
    root: null,
    rootMargin: '',
    scrollMargin: '',
    thresholds: [],
    observe(target: Element) {
      callback([{ isIntersecting: true, target } as IntersectionObserverEntry], observer)
    },
    unobserve() {},
    disconnect() {},
    takeRecords: () => [],
  } as unknown as IntersectionObserver

  return observer
}

/**
 * Assigned as a `function`, not an arrow: `useInView` calls this with `new`, and
 * an arrow function is not constructible.
 */
globalThis.IntersectionObserver = function IntersectionObserverStub(
  callback: IntersectionObserverCallback,
) {
  return immediateObserver(callback)
} as unknown as typeof IntersectionObserver
