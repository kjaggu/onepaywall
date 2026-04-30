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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible")
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
