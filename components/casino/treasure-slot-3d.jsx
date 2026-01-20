"use client"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

const symbols = ["💎", "🏆", "👑", "💰", "⭐", "🎁"]

export default function TreasureSlot3D() {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const reelsRef = useRef([])
  const [isSpinning, setIsSpinning] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0x0a1a2f)

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    camera.position.z = 8

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)

    // Create reels
    const reels = []
    const reelPositions = [-3, 0, 3]

    reelPositions.forEach((xPos, index) => {
      const group = new THREE.Group()
      group.position.x = xPos

      // Reel background
      const reelGeometry = new THREE.BoxGeometry(2, 4, 0.5)
      const reelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a2f45,
        metalness: 0.5,
        roughness: 0.5,
      })
      const reelMesh = new THREE.Mesh(reelGeometry, reelMaterial)
      group.add(reelMesh)

      // Add symbols to reel
      const symbolsGroup = new THREE.Group()
      symbolsGroup.position.z = 0.3

      for (let i = 0; i < 3; i++) {
        const canvas = createSymbolCanvas(symbols[Math.floor(Math.random() * symbols.length)])
        const texture = new THREE.CanvasTexture(canvas)
        const geometry = new THREE.PlaneGeometry(1.8, 1.2)
        const material = new THREE.MeshBasicMaterial({ map: texture })
        const symbolMesh = new THREE.Mesh(geometry, material)
        symbolMesh.position.y = (i - 1) * 1.4
        symbolsGroup.add(symbolMesh)
      }

      group.add(symbolsGroup)
      scene.add(group)
      reels.push({ group, symbolsGroup })
    })

    reelsRef.current = reels

    // Lighting
    const light1 = new THREE.DirectionalLight(0xffd700, 1)
    light1.position.set(5, 5, 5)
    scene.add(light1)

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5)
    light2.position.set(-5, -5, 5)
    scene.add(light2)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    // Animation loop
    const rotationSpeeds = [0, 0, 0]
    const spinEndTimes = [0, 0, 0]

    const animate = () => {
      requestAnimationFrame(animate)

      const currentTime = Date.now() / 1000

      reels.forEach((reel, index) => {
        if (currentTime < spinEndTimes[index]) {
          // Spinning
          reel.symbolsGroup.rotation.z += rotationSpeeds[index]
        } else if (rotationSpeeds[index] !== 0) {
          // Stop spinning
          rotationSpeeds[index] = 0
          reel.symbolsGroup.rotation.z = 0
        }

        // Glow effect
        reel.group.children[0].material.emissive.setHex(0xffd700)
        reel.group.children[0].material.emissiveIntensity = 0.2 + Math.sin(currentTime * 2) * 0.1
      })

      renderer.render(scene, camera)
    }

    animate()

    // Handle spin event
    const handleSpin = (event) => {
      if (isSpinning) return

      setIsSpinning(true)
      const spinDuration = 2.5
      const currentTime = Date.now() / 1000

      reels.forEach((_, index) => {
        rotationSpeeds[index] = 0.3
        spinEndTimes[index] = currentTime + spinDuration + index * 0.2
      })

      setTimeout(
        () => {
          setIsSpinning(false)
        },
        (spinDuration + 0.6) * 1000,
      )
    }

    window.addEventListener("triggerSpin", handleSpin)

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("triggerSpin", handleSpin)
      window.removeEventListener("resize", handleResize)
      renderer.dispose()
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}

function createSymbolCanvas(symbol) {
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 192

  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#0A1A2F"
  ctx.fillRect(0, 0, 256, 192)

  // Gold border
  ctx.strokeStyle = "#FFD700"
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, 248, 184)

  // Symbol
  ctx.font = "120px Arial"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(symbol, 128, 96)

  return canvas
}
