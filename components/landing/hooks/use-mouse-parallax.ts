"use client"
import { useCallback, useEffect, useRef, useState } from "react"

interface Tilt { x: number; y: number }

export function useMouseParallax(intensity = 8) {
  const containerRef = useRef<HTMLElement>(null)
  const [tilt, setTilt] = useState<Tilt>({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const targetRef = useRef<Tilt>({ x: 0, y: 0 })
  const currentRef = useRef<Tilt>({ x: 0, y: 0 })

  const animate = useCallback(() => {
    const cur = currentRef.current
    const tgt = targetRef.current
    const lerpFactor = 0.08

    const nx = cur.x + (tgt.x - cur.x) * lerpFactor
    const ny = cur.y + (tgt.y - cur.y) * lerpFactor

    if (Math.abs(nx - cur.x) > 0.001 || Math.abs(ny - cur.y) > 0.001) {
      currentRef.current = { x: nx, y: ny }
      setTilt({ x: nx, y: ny })
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      targetRef.current = {
        x: Math.max(-1, Math.min(1, dy)) * intensity,
        y: Math.max(-1, Math.min(1, dx)) * intensity,
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(animate)
    },
    [intensity, animate]
  )

  const handleMouseLeave = useCallback(() => {
    targetRef.current = { x: 0, y: 0 }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)
  }, [animate])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener("mousemove", handleMouseMove)
    el.addEventListener("mouseleave", handleMouseLeave)
    return () => {
      el.removeEventListener("mousemove", handleMouseMove)
      el.removeEventListener("mouseleave", handleMouseLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [handleMouseMove, handleMouseLeave])

  return { containerRef, tilt }
}
