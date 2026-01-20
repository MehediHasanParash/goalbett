"use client"
import { useEffect, useRef } from "react"

export function LightningParticles({ className = "", intensity = 20 }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const particles = particlesRef.current

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Create particles
    const createParticles = () => {
      particles.length = 0
      for (let i = 0; i < intensity; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2,
          opacity: Math.random() * 0.8 + 0.2,
          color: `hsl(${45 + Math.random() * 15}, 100%, ${60 + Math.random() * 20}%)`, // Golden colors
          life: Math.random() * 100 + 50,
          maxLife: 100,
        })
      }
    }

    // Animate particles
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle, index) => {
        // Update position
        particle.x += particle.speedX
        particle.y += particle.speedY
        particle.life--

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Update opacity based on life
        particle.opacity = (particle.life / particle.maxLife) * 0.8

        // Draw particle with glow effect
        ctx.save()
        ctx.globalAlpha = particle.opacity
        ctx.shadowBlur = 10
        ctx.shadowColor = particle.color
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Reset particle if dead
        if (particle.life <= 0) {
          particle.x = Math.random() * canvas.width
          particle.y = Math.random() * canvas.height
          particle.life = particle.maxLife
          particle.opacity = Math.random() * 0.8 + 0.2
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    createParticles()
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [intensity])

  return (
    <canvas ref={canvasRef} className={`absolute inset-0 pointer-events-none ${className}`} style={{ zIndex: 1 }} />
  )
}
