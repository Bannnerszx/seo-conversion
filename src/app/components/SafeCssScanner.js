'use client'
import { useEffect } from 'react' // 👈 Change import from useLayoutEffect

export default function SafeCssScanner() {
  useEffect(() => { // 👈 Change hook to useEffect
    if (typeof CSSStyleSheet === 'undefined') return

    const desc = Object.getOwnPropertyDescriptor(
      CSSStyleSheet.prototype,
      'cssRules'
    )
    // ... keep the rest of your logic exactly the same ...
    if (!desc || typeof desc.get !== 'function') return

    const nativeGetter = desc.get
    Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', {
      get() {
        try {
          return nativeGetter.call(this)
        } catch (err) {
          if (err.name === 'SecurityError') {
            return []
          }
          throw err
        }
      },
      configurable: true,
      enumerable: true,
    })
  }, [])

  return null
}