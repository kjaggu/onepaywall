"use client"
import { useEffect, useRef } from "react"

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.12,
  once = true
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function revealEl(target: Element) {
      target.classList.add("is-visible")
      // Propagate to sibling elements that have no ref of their own
      let sib = target.nextElementSibling
      while (sib) {
        const cls = sib.classList
        if (
          cls.contains("lp-reveal-scale") ||
          cls.contains("lp-stagger") ||
          cls.contains("lp-reveal-right") ||
          cls.contains("lp-reveal-left")
        ) {
          cls.add("is-visible")
        }
        sib = sib.nextElementSibling
      }
    }

    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      revealEl(el)
      if (once) return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          revealEl(el)
          if (once) observer.disconnect()
        } else if (!once) {
          el.classList.remove("is-visible")
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, once])

  return ref
}
