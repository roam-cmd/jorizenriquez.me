import { useEffect, useRef, useState } from 'react'
import { createDeepSeaSimulation } from '@/components/motion/deepSeaSimulation'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/utils'

export interface HalftoneShaderBackgroundProps {
  bgColor?: string
  dotColor?: string
  accentColor?: string
  dotSpacing?: number
  maxOpacity?: number
  fishCount?: number
  jellyfishCount?: number
  mantaCount?: number
  koiCount?: number
  mouseRadius?: number
  chompIntervalMs?: number
  enableClickChomp?: boolean
  chompScale?: number
  onChompImpact?: () => void
  className?: string
  debug?: boolean
}

interface DebugOverrides {
  dotSpacing: number
  maxOpacity: number
  fishCount: number
  jellyfishCount: number
  mouseRadius: number
  chompScale: number
}

type Vec3 = [number, number, number]

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER_SOURCE = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  uniform vec2 u_resolution;
  uniform float u_dpr;
  uniform sampler2D u_sceneTex;

  uniform vec3 u_bgColor;
  uniform vec3 u_dotColor;
  uniform vec3 u_accentColor;
  uniform float u_dotSpacing;
  uniform float u_maxOpacity;

  void main() {
    float spacingPx = max(4.0, u_dotSpacing * u_dpr);

    vec2 cellIndex = floor(gl_FragCoord.xy / spacingPx);
    vec2 cellCenterPx = (cellIndex + 0.5) * spacingPx;
    vec2 cellUv = clamp(cellCenterPx / u_resolution, 0.0, 1.0);

    vec3 texel = texture2D(u_sceneTex, cellUv).rgb;
    float lum = dot(texel, vec3(0.2126, 0.7152, 0.0722));

    // Two-tone bioluminescent dot tint: dim haze stays muted dotColor; bright cores shift toward accentColor
    float coreGlow = smoothstep(0.38, 0.90, lum);
    float bioChannel = clamp((texel.b - texel.r) * 3.2, 0.0, 1.0);
    float accentMix = clamp(
      coreGlow * 0.78 + bioChannel * coreGlow * 0.35,
      0.0,
      0.92
    );
    vec3 cellDotColor = mix(u_dotColor, u_accentColor, accentMix);

    // Crisp anti-aliased halftone circle
    float shaped = smoothstep(0.03, 0.95, lum);
    float distPx = length(gl_FragCoord.xy - cellCenterPx);
    float maxRadius = spacingPx * 0.46;
    float radius = shaped * maxRadius;
    float aa = max(0.85, 0.9 * u_dpr);
    float circleAlpha = 1.0 - smoothstep(radius - aa, radius + aa, distPx);

    // Readability & edge fade masks
    float leftDim = mix(0.30, 1.0, smoothstep(0.06, 0.56, cellUv.x));
    float topFade = smoothstep(1.0, 0.93, cellUv.y);
    float bottomFade = smoothstep(0.0, 0.18, cellUv.y);

    float dotMix = circleAlpha * u_maxOpacity * leftDim * topFade * bottomFade;
    vec3 finalColor = mix(u_bgColor, cellDotColor, clamp(dotMix, 0.0, 1.0));

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

function parseColorToVec3(color: string): Vec3 {
  const trimmed = color.trim()
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1)
    if (hex.length === 3) {
      const r = Number.parseInt(hex[0] + hex[0], 16) / 255
      const g = Number.parseInt(hex[1] + hex[1], 16) / 255
      const b = Number.parseInt(hex[2] + hex[2], 16) / 255
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return [r, g, b]
      }
    } else if (hex.length === 6) {
      const r = Number.parseInt(hex.slice(0, 2), 16) / 255
      const g = Number.parseInt(hex.slice(2, 4), 16) / 255
      const b = Number.parseInt(hex.slice(4, 6), 16) / 255
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return [r, g, b]
      }
    }
  }

  if (typeof document !== 'undefined') {
    const probe = document
      .createElement('canvas')
      .getContext('2d', { willReadFrequently: true })
    if (probe) {
      probe.clearRect(0, 0, 1, 1)
      probe.fillStyle = trimmed
      probe.fillRect(0, 0, 1, 1)
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data
      return [r / 255, g / 255, b / 255]
    }
  }

  return [0.043, 0.051, 0.071]
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) {
    return null
  }
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/**
 * Reusable, high-performance WebGL Halftone / Dot-Matrix Shader background
 * driven by an offscreen 0.5x 2D canvas simulation of a fantasy deep-sea scene
 * (3 fish schools, manta rays, veil-tail koi, jellyfish, motes, and an abyssal
 * leviathan chomp event), with two-tone bioluminescent dot tinting and smooth
 * all-species pointer interactivity.
 */
export function HalftoneShaderBackground({
  bgColor = '#0b0d12',
  dotColor = '#7fa3a6',
  accentColor = '#7dd3fc',
  dotSpacing = 8,
  maxOpacity = 0.52,
  fishCount = 54,
  jellyfishCount = 6,
  mantaCount = 2,
  koiCount = 4,
  mouseRadius = 0.22,
  chompIntervalMs = 18000,
  enableClickChomp = true,
  chompScale = 0.7,
  onChompImpact,
  className,
  debug = false,
}: HalftoneShaderBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const repaintStaticRef = useRef<(() => void) | null>(null)
  const updateSimConfigRef = useRef<
    ((fish: number, jelly: number, scale: number) => void) | null
  >(null)
  const triggerChompRef = useRef<(() => void) | null>(null)
  const onChompImpactRef = useRef(onChompImpact)

  useEffect(() => {
    onChompImpactRef.current = onChompImpact
  }, [onChompImpact])

  const [debugValues, setDebugValues] = useState<DebugOverrides | null>(null)

  const effectiveSpacing = debugValues?.dotSpacing ?? dotSpacing
  const effectiveMaxOpacity = debugValues?.maxOpacity ?? maxOpacity
  const effectiveFishCount = debugValues?.fishCount ?? fishCount
  const effectiveJellyfishCount = debugValues?.jellyfishCount ?? jellyfishCount
  const effectiveMouseRadius = debugValues?.mouseRadius ?? mouseRadius
  const effectiveChompScale = debugValues?.chompScale ?? chompScale

  const uniformsRef = useRef({
    bgColor: parseColorToVec3(bgColor),
    dotColor: parseColorToVec3(dotColor),
    accentColor: parseColorToVec3(accentColor),
    dotSpacing: effectiveSpacing,
    maxOpacity: effectiveMaxOpacity,
    fishCount: effectiveFishCount,
    jellyfishCount: effectiveJellyfishCount,
    mantaCount,
    koiCount,
    mouseRadius: effectiveMouseRadius,
    chompIntervalMs,
    enableClickChomp,
    chompScale: effectiveChompScale,
  })

  useEffect(() => {
    uniformsRef.current = {
      bgColor: parseColorToVec3(bgColor),
      dotColor: parseColorToVec3(dotColor),
      accentColor: parseColorToVec3(accentColor),
      dotSpacing: effectiveSpacing,
      maxOpacity: effectiveMaxOpacity,
      fishCount: effectiveFishCount,
      jellyfishCount: effectiveJellyfishCount,
      mantaCount,
      koiCount,
      mouseRadius: effectiveMouseRadius,
      chompIntervalMs,
      enableClickChomp,
      chompScale: effectiveChompScale,
    }
    updateSimConfigRef.current?.(
      effectiveFishCount,
      effectiveJellyfishCount,
      effectiveChompScale
    )
    if (prefersReducedMotion) {
      repaintStaticRef.current?.()
    }
  }, [
    accentColor,
    bgColor,
    chompIntervalMs,
    dotColor,
    effectiveChompScale,
    effectiveFishCount,
    effectiveJellyfishCount,
    effectiveMaxOpacity,
    effectiveMouseRadius,
    effectiveSpacing,
    enableClickChomp,
    koiCount,
    mantaCount,
    prefersReducedMotion,
  ])

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    })
    if (!root || !canvas || !gl) {
      return
    }

    const simCanvas = document.createElement('canvas')
    const simCtx = simCanvas.getContext('2d', { alpha: false })
    if (!simCtx) {
      return
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)
    const program = gl.createProgram()
    if (!vs || !fs || !program) {
      if (vs) gl.deleteShader(vs)
      if (fs) gl.deleteShader(fs)
      if (program) gl.deleteProgram(program)
      return
    }

    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteProgram(program)
      return
    }
    gl.useProgram(program)

    const quadBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )

    const aPos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    // WebGL 1.0 NPOT-safe texture parameters
    const sceneTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, sceneTexture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    const locs = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      dpr: gl.getUniformLocation(program, 'u_dpr'),
      sceneTex: gl.getUniformLocation(program, 'u_sceneTex'),
      bgColor: gl.getUniformLocation(program, 'u_bgColor'),
      dotColor: gl.getUniformLocation(program, 'u_dotColor'),
      accentColor: gl.getUniformLocation(program, 'u_accentColor'),
      dotSpacing: gl.getUniformLocation(program, 'u_dotSpacing'),
      maxOpacity: gl.getUniformLocation(program, 'u_maxOpacity'),
    }

    gl.uniform1i(locs.sceneTex, 0)

    const initRect = root.getBoundingClientRect()
    const initSimW = Math.max(160, Math.round((initRect.width || 640) * 0.5))
    const initSimH = Math.max(120, Math.round((initRect.height || 360) * 0.5))
    simCanvas.width = initSimW
    simCanvas.height = initSimH

    const simulation = createDeepSeaSimulation(
      initSimW,
      initSimH,
      uniformsRef.current.fishCount,
      uniformsRef.current.jellyfishCount,
      uniformsRef.current.mantaCount,
      uniformsRef.current.koiCount,
      uniformsRef.current.chompScale
    )
    simulation.setOnChompImpact(() => {
      if (!prefersReducedMotion) {
        onChompImpactRef.current?.()
      }
    })
    updateSimConfigRef.current = (fish, jelly, scale) => {
      simulation.setCounts(fish, jelly)
      simulation.setChompScale(scale)
    }

    let dpr = 1
    let widthPx = 1
    let heightPx = 1
    let textureAllocated = false
    let rafId = 0
    let onScreen = true
    let isVisible = !document.hidden
    let lastNow = performance.now()
    let autoTimerMs = 0

    triggerChompRef.current = () => {
      if (prefersReducedMotion) return
      if (simulation.triggerChomp()) {
        autoTimerMs = 0
      }
    }

    // Smooth top-down pointer tracking for 2D canvas simulation
    let targetMouseX = 0.5
    let targetMouseY = 0.5
    let smoothMouseX = 0.5
    let smoothMouseY = 0.5
    let smoothVelX = 0
    let smoothVelY = 0
    let smoothActive = 0
    let pointerInside = false

    const sectionEl = root.parentElement

    const onPointerMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) {
        return
      }
      const nx = (e.clientX - rect.left) / rect.width
      const ny = (e.clientY - rect.top) / rect.height
      if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
        targetMouseX = nx
        targetMouseY = ny
        pointerInside = true
      } else {
        pointerInside = false
      }
    }

    const onPointerLeave = () => {
      pointerInside = false
    }

    const onBackgroundClick = (e: MouseEvent) => {
      const u = uniformsRef.current
      if (!u.enableClickChomp || prefersReducedMotion) {
        return
      }
      const target = e.target as HTMLElement | null
      if (
        target?.closest('a, button, input, textarea, select, [role="button"]')
      ) {
        return
      }
      const rect = root.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) {
        return
      }
      const nx = (e.clientX - rect.left) / rect.width
      const ny = (e.clientY - rect.top) / rect.height
      if (simulation.triggerChomp(nx, ny)) {
        autoTimerMs = 0
      }
    }

    const renderFrame = (now: number) => {
      const dt = Math.min((now - lastNow) / 1000, 0.05)
      lastNow = now
      const u = uniformsRef.current

      if (!prefersReducedMotion) {
        const targetActive = pointerInside ? 1 : 0

        if (smoothActive < 0.01 && targetActive > 0.5) {
          smoothMouseX = targetMouseX
          smoothMouseY = targetMouseY
          smoothVelX = 0
          smoothVelY = 0
        }

        const prevX = smoothMouseX
        const prevY = smoothMouseY
        const posAlpha = 1 - Math.exp(-dt * 15)
        smoothMouseX += (targetMouseX - smoothMouseX) * posAlpha
        smoothMouseY += (targetMouseY - smoothMouseY) * posAlpha

        const safeDt = Math.max(dt, 0.004)
        const instVx =
          targetActive > 0.5
            ? Math.max(-2.5, Math.min(2.5, (smoothMouseX - prevX) / safeDt))
            : 0
        const instVy =
          targetActive > 0.5
            ? Math.max(-2.5, Math.min(2.5, (smoothMouseY - prevY) / safeDt))
            : 0
        const velAlpha = 1 - Math.exp(-dt * 9)
        smoothVelX += (instVx - smoothVelX) * velAlpha
        smoothVelY += (instVy - smoothVelY) * velAlpha

        const activeAlpha =
          1 - Math.exp(-dt * (targetActive > smoothActive ? 12 : 3.5))
        smoothActive += (targetActive - smoothActive) * activeAlpha

        if (isVisible && u.chompIntervalMs > 0) {
          autoTimerMs += dt * 1000
          if (autoTimerMs >= u.chompIntervalMs) {
            if (simulation.triggerChomp()) {
              autoTimerMs = 0
            } else {
              autoTimerMs = u.chompIntervalMs * 0.75
            }
          }
        }

        simulation.setPointer({
          x: smoothMouseX,
          y: smoothMouseY,
          vx: smoothVelX,
          vy: smoothVelY,
          active: smoothActive,
          radius: u.mouseRadius,
        })
        simulation.step(dt)
      } else {
        simulation.setPointer({
          x: 0.5,
          y: 0.5,
          vx: 0,
          vy: 0,
          active: 0,
          radius: u.mouseRadius,
        })
      }

      simulation.render(simCtx)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, sceneTexture)
      if (!textureAllocated) {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          simCanvas
        )
        textureAllocated = true
      } else {
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          0,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          simCanvas
        )
      }

      gl.uniform2f(locs.resolution, widthPx, heightPx)
      gl.uniform1f(locs.dpr, dpr)
      gl.uniform3f(locs.bgColor, u.bgColor[0], u.bgColor[1], u.bgColor[2])
      gl.uniform3f(locs.dotColor, u.dotColor[0], u.dotColor[1], u.dotColor[2])
      gl.uniform3f(
        locs.accentColor,
        u.accentColor[0],
        u.accentColor[1],
        u.accentColor[2]
      )
      gl.uniform1f(locs.dotSpacing, u.dotSpacing)
      gl.uniform1f(locs.maxOpacity, u.maxOpacity)

      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const resize = () => {
      const rect = root.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) {
        return
      }
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      widthPx = Math.round(rect.width * dpr)
      heightPx = Math.round(rect.height * dpr)
      canvas.width = widthPx
      canvas.height = heightPx
      gl.viewport(0, 0, widthPx, heightPx)

      const simScale = Math.min(0.5, 720 / Math.max(rect.width, 1))
      const simW = Math.max(160, Math.round(rect.width * simScale))
      const simH = Math.max(120, Math.round(rect.height * simScale))
      if (simCanvas.width !== simW || simCanvas.height !== simH) {
        simCanvas.width = simW
        simCanvas.height = simH
        textureAllocated = false
        simulation.resize(simW, simH)
      }

      renderFrame(performance.now())
    }

    repaintStaticRef.current = () => renderFrame(performance.now())

    const loop = (now: number) => {
      rafId = 0
      if (!isVisible || prefersReducedMotion) {
        return
      }
      renderFrame(now)
      rafId = requestAnimationFrame(loop)
    }

    const startPlayback = () => {
      if (prefersReducedMotion) {
        renderFrame(performance.now())
        return
      }
      if (!rafId && isVisible) {
        lastNow = performance.now()
        rafId = requestAnimationFrame(loop)
      }
    }

    const pausePlayback = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
    }

    const updateVisibility = () => {
      isVisible = onScreen && !document.hidden
      if (isVisible) {
        startPlayback()
      } else {
        pausePlayback()
      }
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(root)

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      updateVisibility()
    })
    intersectionObserver.observe(root)

    document.addEventListener('visibilitychange', updateVisibility)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onPointerLeave)
    window.addEventListener('blur', onPointerLeave)
    sectionEl?.addEventListener('click', onBackgroundClick)

    resize()
    if (!prefersReducedMotion) {
      startPlayback()
    }

    return () => {
      simulation.setOnChompImpact(null)
      repaintStaticRef.current = null
      updateSimConfigRef.current = null
      triggerChompRef.current = null
      pausePlayback()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', updateVisibility)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('mouseleave', onPointerLeave)
      window.removeEventListener('blur', onPointerLeave)
      sectionEl?.removeEventListener('click', onBackgroundClick)
      gl.deleteTexture(sceneTexture)
      gl.deleteBuffer(quadBuffer)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteProgram(program)
    }
  }, [prefersReducedMotion])

  const currentDebug: DebugOverrides = debugValues ?? {
    dotSpacing,
    maxOpacity,
    fishCount,
    jellyfishCount,
    mouseRadius,
    chompScale,
  }

  return (
    <>
      <div
        ref={rootRef}
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 h-full w-full overflow-hidden',
          className
        )}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      {debug && (
        <aside
          aria-label="Halftone shader debug controls"
          className="pointer-events-auto fixed right-4 bottom-4 z-50 w-64 rounded-xl border border-[var(--line-border)] bg-[var(--bg-surface)]/95 p-4 font-mono text-xs text-[var(--fg-primary)] shadow-2xl backdrop-blur-md"
        >
          <div className="mb-3 flex items-center justify-between border-b border-[var(--line-subtle)] pb-2">
            <span className="font-semibold text-[var(--accent)]">
              Shader Debug
            </span>
            <span className="text-[10px] text-[var(--fg-muted)]">
              Deep-Sea Halftone
            </span>
          </div>

          <div className="space-y-2.5">
            <label className="block">
              <div className="mb-1 flex justify-between text-[11px]">
                <span>dotSpacing</span>
                <span>{currentDebug.dotSpacing}px</span>
              </div>
              <input
                type="range"
                min={5}
                max={16}
                step={1}
                value={currentDebug.dotSpacing}
                onChange={(e) =>
                  setDebugValues({
                    ...currentDebug,
                    dotSpacing: Number(e.target.value),
                  })
                }
                className="w-full accent-[var(--accent)]"
              />
            </label>

            <label className="block">
              <div className="mb-1 flex justify-between text-[11px]">
                <span>maxOpacity</span>
                <span>{currentDebug.maxOpacity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.15}
                max={0.9}
                step={0.02}
                value={currentDebug.maxOpacity}
                onChange={(e) =>
                  setDebugValues({
                    ...currentDebug,
                    maxOpacity: Number(e.target.value),
                  })
                }
                className="w-full accent-[var(--accent)]"
              />
            </label>

            <label className="block">
              <div className="mb-1 flex justify-between text-[11px]">
                <span>fishCount</span>
                <span>{currentDebug.fishCount}</span>
              </div>
              <input
                type="range"
                min={15}
                max={100}
                step={1}
                value={currentDebug.fishCount}
                onChange={(e) =>
                  setDebugValues({
                    ...currentDebug,
                    fishCount: Number(e.target.value),
                  })
                }
                className="w-full accent-[var(--accent)]"
              />
            </label>

            <label className="block">
              <div className="mb-1 flex justify-between text-[11px]">
                <span>jellyfishCount</span>
                <span>{currentDebug.jellyfishCount}</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={currentDebug.jellyfishCount}
                onChange={(e) =>
                  setDebugValues({
                    ...currentDebug,
                    jellyfishCount: Number(e.target.value),
                  })
                }
                className="w-full accent-[var(--accent)]"
              />
            </label>

            <label className="block">
              <div className="mb-1 flex justify-between text-[11px]">
                <span>mouseRadius</span>
                <span>{currentDebug.mouseRadius.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.08}
                max={0.45}
                step={0.01}
                value={currentDebug.mouseRadius}
                onChange={(e) =>
                  setDebugValues({
                    ...currentDebug,
                    mouseRadius: Number(e.target.value),
                  })
                }
                className="w-full accent-[var(--accent)]"
              />
            </label>

            <label className="block">
              <div className="mb-1 flex justify-between text-[11px]">
                <span>chompScale</span>
                <span>{currentDebug.chompScale.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.45}
                max={1}
                step={0.05}
                value={currentDebug.chompScale}
                onChange={(e) =>
                  setDebugValues({
                    ...currentDebug,
                    chompScale: Number(e.target.value),
                  })
                }
                className="w-full accent-[var(--accent)]"
              />
            </label>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => triggerChompRef.current?.()}
              className="rounded-md border border-[var(--accent)] bg-[var(--accent)]/15 py-1.5 text-[11px] text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/25"
            >
              Trigger Chomp
            </button>
            <button
              type="button"
              onClick={() => setDebugValues(null)}
              className="rounded-md border border-[var(--line-border)] bg-[var(--bg-elevated)] py-1.5 text-[11px] text-[var(--fg-primary)] transition-colors hover:border-[var(--accent)]"
            >
              Reset Defaults
            </button>
          </div>
        </aside>
      )}
    </>
  )
}
