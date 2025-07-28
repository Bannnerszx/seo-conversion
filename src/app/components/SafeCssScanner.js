'use client'
import { useLayoutEffect } from 'react'

export default function SafeCssScanner() {
  useLayoutEffect(() => {
    if (typeof CSSStyleSheet === 'undefined') return

    const desc = Object.getOwnPropertyDescriptor(
      CSSStyleSheet.prototype,
      'cssRules'
    )
    if (!desc || typeof desc.get !== 'function') return

    const nativeGetter = desc.get
    Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', {
      get() {
        try {
          // normal, same‑origin sheets work as usual
          return nativeGetter.call(this)
        } catch (err) {
          // swallow _only_ the SecurityError for cross‑origin sheets
          if (err.name === 'SecurityError') {
            return []
          }
          // anything else is (probably) a real bug
          throw err
        }
      },
      configurable: true,
      enumerable: true,
    })
  }, [])

  return null
}
