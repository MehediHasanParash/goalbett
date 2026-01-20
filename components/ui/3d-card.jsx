"use client"
import { useState } from "react"

export function Card3D({ children, className = "", intensity = 15 }) {
  const [transform, setTransform] = useState("")

  const handleMouseMove = () => {
    // Very gentle scale effect — looks smooth and elegant
    setTransform("perspective(1000px) scale3d(1.02, 1.02, 1.02)")
  }

  const handleMouseLeave = () => {
    setTransform("")
  }

  return (
    <div
      className={`transition-transform duration-700 ease-out ${className}`}
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}
