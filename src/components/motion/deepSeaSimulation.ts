export interface DeepSeaPointerState {
  /** Top-down normalized X in [0, 1] */
  x: number
  /** Top-down normalized Y in [0, 1] */
  y: number
  /** Normalized velocity X (screen widths / s) */
  vx: number
  /** Normalized velocity Y (screen heights / s, top-down) */
  vy: number
  /** Smooth active presence in [0, 1] */
  active: number
  /** Normalized interaction radius (relative to canvas min dimension) */
  radius: number
}

export interface DeepSeaSimulation {
  resize: (width: number, height: number) => void
  setCounts: (fishCount: number, jellyfishCount: number) => void
  setPointer: (pointer: DeepSeaPointerState) => void
  setChompScale: (scale: number) => void
  setOnChompImpact: (cb: (() => void) | null) => void
  triggerChomp: (normX?: number, normY?: number) => boolean
  step: (dt: number) => void
  render: (ctx: CanvasRenderingContext2D) => void
}

interface Vec2Node {
  x: number
  y: number
}

interface Tentacle {
  anchorOffsetRatio: number
  phaseOffset: number
  segLen: number
  nodes: Vec2Node[]
}

interface Jellyfish {
  x: number
  y: number
  vx: number
  vy: number
  scale: number
  bellRadius: number
  heading: number
  pulsePhase: number
  pulseSpeed: number
  driftAngle: number
  lifeState: 'active' | 'swallowed' | 'respawning'
  swallowProgress: number
  respawnTimer: number
  tentacles: Tentacle[]
  frillPhases: number[]
}

interface MantaRay {
  x: number
  y: number
  vx: number
  vy: number
  direction: 1 | -1
  scale: number
  wingspan: number
  speed: number
  evadeBoost: number
  laneYRatio: number
  wavePhase: number
  flapPhase: number
  flapSpeed: number
  heading: number
  lifeState: 'active' | 'swallowed' | 'respawning'
  swallowProgress: number
  respawnTimer: number
  tailNodes: Vec2Node[]
}

interface VeilKoi {
  x: number
  y: number
  vx: number
  vy: number
  direction: 1 | -1
  scale: number
  bodyLength: number
  speed: number
  evadeBoost: number
  laneYRatio: number
  swimPhase: number
  heading: number
  lifeState: 'active' | 'swallowed' | 'respawning'
  swallowProgress: number
  respawnTimer: number
  spine: Vec2Node[]
  ribbonLeft: Vec2Node[]
  ribbonRight: Vec2Node[]
}

interface Fish {
  schoolId: 0 | 1 | 2
  x: number
  y: number
  vx: number
  vy: number
  length: number
  width: number
  baseSpeed: number
  dartBoost: number
  tailPhase: number
  phaseOffset: number
  lifeState: 'active' | 'swallowed' | 'respawning'
  swallowProgress: number
  respawnTimer: number
  trail: Vec2Node[]
}

interface Mote {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseAlpha: number
  phase: number
  swayFreq: number
  swayAmp: number
}

type ChompPhase = 'idle' | 'telegraph' | 'open' | 'snap' | 'recede'

interface LeviathanState {
  phase: ChompPhase
  elapsed: number
  cx: number
  cy: number
  cooldown: number
  snapped: boolean
  shockwaveAge: number
  shockwaveActive: boolean
  shakeRemaining: number
}

const JELLY_SCALES = [1.05, 0.88, 0.72, 0.62, 0.48, 0.44, 0.8, 0.56]
const JELLY_POSITIONS: Array<[number, number]> = [
  [0.78, 0.34],
  [0.86, 0.66],
  [0.62, 0.52],
  [0.44, 0.24],
  [0.2, 0.28],
  [0.54, 0.76],
  [0.7, 0.2],
  [0.34, 0.68],
]

const TENTACLE_COUNT = 6
const TENTACLE_NODES = 15
const MANTA_TAIL_NODES = 10
const KOI_SPINE_NODES = 10
const KOI_RIBBON_NODES = 12
const FISH_TRAIL_LENGTH = 6
const MOTE_COUNT = 55

const TELEGRAPH_DUR = 0.8
const OPEN_DUR = 0.7
const SNAP_DUR = 0.35
const RECEDE_DUR = 1.5
const CHOMP_COOLDOWN = 4.0

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

function easeOutCubic(t: number): number {
  const u = 1 - clamp(t, 0, 1)
  return 1 - u * u * u
}

function easeInOutQuad(t: number): number {
  const x = clamp(t, 0, 1)
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

function createJellyfish(
  index: number,
  width: number,
  height: number
): Jellyfish {
  const scale = JELLY_SCALES[index % JELLY_SCALES.length]
  const minDim = Math.min(width, height)
  const bellRadius = Math.max(14, minDim * 0.085 * scale)
  const [laneX, laneY] = JELLY_POSITIONS[index % JELLY_POSITIONS.length]

  const tentacles: Tentacle[] = []
  for (let t = 0; t < TENTACLE_COUNT; t++) {
    const ratio = (t / (TENTACLE_COUNT - 1)) * 2 - 1
    const segLen = bellRadius * (0.28 + (1 - Math.abs(ratio) * 0.32) * 0.11)
    const nodes: Vec2Node[] = []
    const startX = width * laneX + ratio * bellRadius * 0.65
    const startY = height * laneY + bellRadius * 0.22
    for (let n = 0; n < TENTACLE_NODES; n++) {
      nodes.push({
        x: startX + Math.sin(n * 0.35 + t) * 2.5,
        y: startY + n * segLen,
      })
    }
    tentacles.push({
      anchorOffsetRatio: ratio * 0.68,
      phaseOffset: t * 1.15 + index * 2.1,
      segLen,
      nodes,
    })
  }

  return {
    x: width * laneX,
    y: height * laneY,
    vx: -3.5 * scale,
    vy: -9.5 * scale,
    scale,
    bellRadius,
    heading: -Math.PI / 2 - 0.18 + (index % 2 === 0 ? -0.08 : 0.1),
    pulsePhase: index * 1.45,
    pulseSpeed: 1.45 + (index % 3) * 0.16,
    driftAngle: -Math.PI / 2 - 0.18 + (index % 2 === 0 ? -0.1 : 0.08),
    lifeState: 'active',
    swallowProgress: 0,
    respawnTimer: 0,
    tentacles,
    frillPhases: [index * 1.1, index * 1.1 + 2.1, index * 1.1 + 4.2],
  }
}

function createMantaRay(
  index: number,
  width: number,
  height: number
): MantaRay {
  const direction: 1 | -1 = index % 2 === 0 ? 1 : -1
  const scale = index % 2 === 0 ? 1.0 : 0.8
  const wingspan = Math.max(66, Math.min(width, height) * 0.25 * scale)
  const laneYRatio = index % 2 === 0 ? 0.34 : 0.66
  const startX = direction === 1 ? width * 0.28 : width * 0.78
  const startY = height * laneYRatio
  const speed = (28 + (index % 2) * 5) * scale

  const tailNodes: Vec2Node[] = []
  const tailSeg = wingspan * 0.095
  for (let i = 0; i < MANTA_TAIL_NODES; i++) {
    tailNodes.push({
      x: startX - direction * (wingspan * 0.35 + i * tailSeg),
      y: startY,
    })
  }

  return {
    x: startX,
    y: startY,
    vx: direction * speed,
    vy: 0,
    direction,
    scale,
    wingspan,
    speed,
    evadeBoost: 0,
    laneYRatio,
    wavePhase: index * 2.4,
    flapPhase: index * 1.9,
    flapSpeed: 1.85 + (index % 2) * 0.2,
    heading: direction === 1 ? 0 : Math.PI,
    lifeState: 'active',
    swallowProgress: 0,
    respawnTimer: 0,
    tailNodes,
  }
}

function createVeilKoi(
  index: number,
  width: number,
  height: number
): VeilKoi {
  const direction: 1 | -1 = index % 2 === 0 ? 1 : -1
  const presets: Array<{ x: number; y: number; scale: number }> = [
    { x: 0.22, y: 0.3, scale: 0.92 },
    { x: 0.72, y: 0.42, scale: 1.05 },
    { x: 0.48, y: 0.56, scale: 0.85 },
    { x: 0.65, y: 0.74, scale: 0.96 },
    { x: 0.3, y: 0.7, scale: 0.88 },
    { x: 0.82, y: 0.26, scale: 0.82 },
  ]
  const preset = presets[index % presets.length]
  const bodyLength = Math.max(32, Math.min(width, height) * 0.115 * preset.scale)
  const startX = width * preset.x
  const startY = height * preset.y
  const speed = 26 + (index % 3) * 4

  const spineSeg = bodyLength / (KOI_SPINE_NODES - 1)
  const spine: Vec2Node[] = []
  for (let i = 0; i < KOI_SPINE_NODES; i++) {
    spine.push({
      x: startX - direction * i * spineSeg,
      y: startY,
    })
  }

  const tailTip = spine[spine.length - 1]
  const ribbonLeft: Vec2Node[] = []
  const ribbonRight: Vec2Node[] = []
  const ribSeg = bodyLength * 0.11
  for (let i = 0; i < KOI_RIBBON_NODES; i++) {
    ribbonLeft.push({
      x: tailTip.x - direction * i * ribSeg,
      y: tailTip.y - i * 0.8,
    })
    ribbonRight.push({
      x: tailTip.x - direction * i * ribSeg,
      y: tailTip.y + i * 0.8,
    })
  }

  return {
    x: startX,
    y: startY,
    vx: direction * speed,
    vy: 0,
    direction,
    scale: preset.scale,
    bodyLength,
    speed,
    evadeBoost: 0,
    laneYRatio: preset.y,
    swimPhase: index * 1.7,
    heading: direction === 1 ? 0 : Math.PI,
    lifeState: 'active',
    swallowProgress: 0,
    respawnTimer: 0,
    spine,
    ribbonLeft,
    ribbonRight,
  }
}

function createFish(index: number, width: number, height: number): Fish {
  const schoolId = (index % 3) as 0 | 1 | 2
  const schoolIndex = Math.floor(index / 3)
  const laneYs = [0.28, 0.66, 0.46]
  const dirX = schoolId === 1 ? -1 : 1

  const spreadX = ((schoolIndex * 0.085 + schoolId * 0.29) % 0.86) + 0.07
  const spreadY =
    laneYs[schoolId] + Math.sin(schoolIndex * 1.3 + schoolId) * 0.07
  const cx = width * spreadX
  const cy = height * spreadY

  const sizeScale = 0.88 + (index % 5) * 0.08
  const length = 22 * sizeScale
  const widthPx = 7.2 * sizeScale
  const speed = 52 + (index % 7) * 4.5
  const vx = dirX * speed
  const vy = Math.cos(spreadX * Math.PI * 2 + schoolId) * 14

  const trail: Vec2Node[] = []
  for (let i = 0; i < FISH_TRAIL_LENGTH; i++) {
    trail.push({ x: cx - vx * 0.014 * i, y: cy - vy * 0.014 * i })
  }

  return {
    schoolId,
    x: cx,
    y: cy,
    vx,
    vy,
    length,
    width: widthPx,
    baseSpeed: speed,
    dartBoost: 0,
    tailPhase: index * 0.73,
    phaseOffset: index * 0.41,
    lifeState: 'active',
    swallowProgress: 0,
    respawnTimer: 0,
    trail,
  }
}

function createMote(index: number, width: number, height: number): Mote {
  const seed1 = Math.sin(index * 12.9898) * 43758.5453
  const r1 = seed1 - Math.floor(seed1)
  const seed2 = Math.sin(index * 78.233) * 43758.5453
  const r2 = seed2 - Math.floor(seed2)
  const seed3 = Math.sin(index * 45.164) * 43758.5453
  const r3 = seed3 - Math.floor(seed3)

  return {
    x: r1 * width,
    y: r2 * height,
    vx: 0,
    vy: -(7 + r3 * 12),
    radius: 1.3 + r3 * 2.3,
    baseAlpha: 0.16 + r2 * 0.34,
    phase: r1 * Math.PI * 2,
    swayFreq: 0.5 + r2 * 0.8,
    swayAmp: 6 + r3 * 10,
  }
}

function wrapAngleDiff(target: number, current: number): number {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return diff
}

/**
 * Creates a rich, 60fps offscreen 2D canvas simulation of a fantasy deep-sea
 * ecosystem with all-species pointer interactivity and a 4-stage abyssal
 * leviathan chomp event.
 */
export function createDeepSeaSimulation(
  initialWidth: number,
  initialHeight: number,
  initialFishCount = 54,
  initialJellyfishCount = 6,
  initialMantaCount = 2,
  initialKoiCount = 4,
  initialChompScale = 0.7
): DeepSeaSimulation {
  let width = Math.max(160, initialWidth)
  let height = Math.max(120, initialHeight)
  let simTime = 0

  let targetFishCount = clamp(Math.round(initialFishCount), 12, 120)
  let targetJellyCount = clamp(Math.round(initialJellyfishCount), 1, 8)
  const targetMantaCount = clamp(Math.round(initialMantaCount), 0, 4)
  const targetKoiCount = clamp(Math.round(initialKoiCount), 0, 6)
  let chompScale = clamp(initialChompScale, 0.35, 1.15)

  const pointer: DeepSeaPointerState = {
    x: 0.5,
    y: 0.5,
    vx: 0,
    vy: 0,
    active: 0,
    radius: 0.22,
  }

  const leviathan: LeviathanState = {
    phase: 'idle',
    elapsed: 0,
    cx: width * 0.62,
    cy: height * 0.48,
    cooldown: 0,
    snapped: false,
    shockwaveAge: 0,
    shockwaveActive: false,
    shakeRemaining: 0,
  }
  let onChompImpactCb: (() => void) | null = null

  const mantas: MantaRay[] = []
  const kois: VeilKoi[] = []
  const jellyfish: Jellyfish[] = []
  const fishes: Fish[] = []
  const motes: Mote[] = []

  const syncCounts = () => {
    while (jellyfish.length < targetJellyCount) {
      jellyfish.push(createJellyfish(jellyfish.length, width, height))
    }
    if (jellyfish.length > targetJellyCount) {
      jellyfish.length = targetJellyCount
    }

    while (fishes.length < targetFishCount) {
      fishes.push(createFish(fishes.length, width, height))
    }
    if (fishes.length > targetFishCount) {
      fishes.length = targetFishCount
    }
  }

  for (let i = 0; i < targetMantaCount; i++) {
    mantas.push(createMantaRay(i, width, height))
  }
  for (let i = 0; i < targetKoiCount; i++) {
    kois.push(createVeilKoi(i, width, height))
  }
  for (let i = 0; i < MOTE_COUNT; i++) {
    motes.push(createMote(i, width, height))
  }
  syncCounts()

  const resize = (newWidth: number, newHeight: number) => {
    const nextW = Math.max(160, newWidth)
    const nextH = Math.max(120, newHeight)
    const sx = nextW / width
    const sy = nextH / height
    width = nextW
    height = nextH

    leviathan.cx *= sx
    leviathan.cy *= sy

    const minDim = Math.min(width, height)

    for (const m of mantas) {
      m.x *= sx
      m.y *= sy
      m.wingspan = Math.max(66, minDim * 0.25 * m.scale)
      for (const node of m.tailNodes) {
        node.x *= sx
        node.y *= sy
      }
    }

    for (const k of kois) {
      k.x *= sx
      k.y *= sy
      k.bodyLength = Math.max(32, minDim * 0.115 * k.scale)
      for (const node of k.spine) {
        node.x *= sx
        node.y *= sy
      }
      for (const node of k.ribbonLeft) {
        node.x *= sx
        node.y *= sy
      }
      for (const node of k.ribbonRight) {
        node.x *= sx
        node.y *= sy
      }
    }

    for (const j of jellyfish) {
      j.x *= sx
      j.y *= sy
      j.bellRadius = Math.max(14, minDim * 0.085 * j.scale)
      for (const tent of j.tentacles) {
        tent.segLen =
          j.bellRadius *
          (0.28 + (1 - Math.abs(tent.anchorOffsetRatio) * 0.32) * 0.11)
        for (const node of tent.nodes) {
          node.x *= sx
          node.y *= sy
        }
      }
    }

    for (const f of fishes) {
      f.x *= sx
      f.y *= sy
      for (const pt of f.trail) {
        pt.x *= sx
        pt.y *= sy
      }
    }

    for (const m of motes) {
      m.x *= sx
      m.y *= sy
    }
  }

  const setCounts = (fishCount: number, jellyfishCount: number) => {
    targetFishCount = clamp(Math.round(fishCount), 12, 120)
    targetJellyCount = clamp(Math.round(jellyfishCount), 1, 8)
    syncCounts()
  }

  const setPointer = (next: DeepSeaPointerState) => {
    pointer.x = next.x
    pointer.y = next.y
    pointer.vx = next.vx
    pointer.vy = next.vy
    pointer.active = next.active
    pointer.radius = next.radius
  }

  const setChompScale = (scale: number) => {
    chompScale = clamp(scale, 0.35, 1.15)
  }

  const triggerChomp = (normX = 0.62, normY = 0.48): boolean => {
    if (leviathan.phase !== 'idle' || leviathan.cooldown > 0) {
      return false
    }
    leviathan.cx = clamp(normX, 0.45, 0.78) * width
    leviathan.cy = clamp(normY, 0.34, 0.64) * height
    leviathan.phase = 'telegraph'
    leviathan.elapsed = 0
    leviathan.snapped = false
    return true
  }

  const getMouthGeometry = () => {
    const minDim = Math.min(width, height)
    const jawHalfW = minDim * 0.54 * chompScale
    const maxGap = minDim * 0.36 * chompScale
    const mouthRx = jawHalfW * 0.92
    const mouthRy = maxGap * 0.95
    const suctionRadius = jawHalfW * 2.6
    const throatRadius = minDim * 0.13 * chompScale
    return { minDim, jawHalfW, maxGap, mouthRx, mouthRy, suctionRadius, throatRadius }
  }

  const applySnapEcosystemReaction = () => {
    const { mouthRx, mouthRy } = getMouthGeometry()
    const panicReach = Math.max(width, height) * 0.68

    for (let i = 0; i < fishes.length; i++) {
      const f = fishes[i]
      if (f.lifeState !== 'active') continue

      const dx = f.x - leviathan.cx
      const dy = f.y - leviathan.cy
      const ellip =
        (dx * dx) / Math.max(1, mouthRx * mouthRx) +
        (dy * dy) / Math.max(1, mouthRy * mouthRy)

      if (ellip <= 1.0) {
        f.lifeState = 'swallowed'
        f.swallowProgress = 0
      } else {
        const dist = Math.hypot(dx, dy) || 1
        if (dist < panicReach) {
          const panic = 1 - dist / panicReach
          f.vx += (dx / dist) * (280 + 280 * panic)
          f.vy += (dy / dist) * (280 + 280 * panic)
          f.dartBoost = Math.max(f.dartBoost, 1.4 + panic * 0.7)
        }
      }
    }

    for (const m of mantas) {
      if (m.lifeState !== 'active') continue
      const dx = m.x - leviathan.cx
      const dy = m.y - leviathan.cy
      const ellip =
        (dx * dx) / Math.max(1, mouthRx * mouthRx) +
        (dy * dy) / Math.max(1, mouthRy * mouthRy)

      if (ellip <= 1.0) {
        m.lifeState = 'swallowed'
        m.swallowProgress = 0
      } else {
        const dist = Math.hypot(dx, dy) || 1
        if (dist < panicReach) {
          const panic = 1 - dist / panicReach
          m.vx += (dx / dist) * (105 + 115 * panic)
          m.vy += (dy / dist) * (120 + 125 * panic)
          m.evadeBoost = Math.max(m.evadeBoost, 0.95 + panic * 0.5)
        }
      }
    }

    for (const k of kois) {
      if (k.lifeState !== 'active') continue
      const dx = k.x - leviathan.cx
      const dy = k.y - leviathan.cy
      const ellip =
        (dx * dx) / Math.max(1, mouthRx * mouthRx) +
        (dy * dy) / Math.max(1, mouthRy * mouthRy)

      if (ellip <= 1.0) {
        k.lifeState = 'swallowed'
        k.swallowProgress = 0
      } else {
        const dist = Math.hypot(dx, dy) || 1
        if (dist < panicReach) {
          const panic = 1 - dist / panicReach
          k.vx += (dx / dist) * (130 + 135 * panic)
          k.vy += (dy / dist) * (145 + 145 * panic)
          k.evadeBoost = Math.max(k.evadeBoost, 1.05 + panic * 0.5)
        }
      }
    }

    for (const j of jellyfish) {
      if (j.lifeState !== 'active') continue
      const dx = j.x - leviathan.cx
      const dy = j.y - leviathan.cy
      const ellip =
        (dx * dx) / Math.max(1, mouthRx * mouthRx) +
        (dy * dy) / Math.max(1, mouthRy * mouthRy)

      if (ellip <= 1.0) {
        j.lifeState = 'swallowed'
        j.swallowProgress = 0
      } else {
        const dist = Math.hypot(dx, dy) || 1
        if (dist < panicReach) {
          const panic = 1 - dist / panicReach
          j.vx += (dx / dist) * (75 + 85 * panic)
          j.vy += (dy / dist) * (75 + 85 * panic)
        }
      }
    }
  }

  const step = (rawDt: number) => {
    const dt = Math.min(rawDt, 0.05)
    if (dt <= 0) return
    simTime += dt

    const { minDim, suctionRadius, throatRadius } = getMouthGeometry()
    const ptrX = pointer.x * width
    const ptrY = pointer.y * height
    const ptrVx = pointer.vx * width
    const ptrVy = pointer.vy * height
    const ptrRad = Math.max(36, pointer.radius * minDim)
    const ptrActive = pointer.active

    // 0. Advance Abyssal Leviathan state machine
    if (leviathan.cooldown > 0) {
      leviathan.cooldown = Math.max(0, leviathan.cooldown - dt)
    }
    if (leviathan.shakeRemaining > 0) {
      leviathan.shakeRemaining = Math.max(0, leviathan.shakeRemaining - dt)
    }
    if (leviathan.shockwaveActive) {
      leviathan.shockwaveAge += dt
      if (leviathan.shockwaveAge >= 0.95) {
        leviathan.shockwaveActive = false
      }
    }
    if (leviathan.phase !== 'idle') {
      leviathan.elapsed += dt
      if (leviathan.phase === 'telegraph' && leviathan.elapsed >= TELEGRAPH_DUR) {
        leviathan.phase = 'open'
        leviathan.elapsed = 0
      } else if (leviathan.phase === 'open' && leviathan.elapsed >= OPEN_DUR) {
        leviathan.phase = 'snap'
        leviathan.elapsed = 0
      } else if (leviathan.phase === 'snap') {
        if (!leviathan.snapped && leviathan.elapsed >= 0.14) {
          leviathan.snapped = true
          leviathan.shockwaveActive = true
          leviathan.shockwaveAge = 0
          leviathan.shakeRemaining = 0.25
          applySnapEcosystemReaction()
          onChompImpactCb?.()
        }
        if (leviathan.elapsed >= SNAP_DUR) {
          leviathan.phase = 'recede'
          leviathan.elapsed = 0
        }
      } else if (leviathan.phase === 'recede' && leviathan.elapsed >= RECEDE_DUR) {
        leviathan.phase = 'idle'
        leviathan.elapsed = 0
        leviathan.cooldown = CHOMP_COOLDOWN
      }
    }

    // 1. Update slow-rising bioluminescent motes
    for (const m of motes) {
      const swayX = Math.sin(simTime * m.swayFreq + m.phase) * m.swayAmp
      if (ptrActive > 0.01) {
        const dx = m.x - ptrX
        const dy = m.y - ptrY
        const distSq = dx * dx + dy * dy
        if (distSq < ptrRad * ptrRad && distSq > 1) {
          const dist = Math.sqrt(distSq)
          const falloff = (1 - dist / ptrRad) * ptrActive
          m.vx += ((-dy / dist) * 125 + ptrVx * 0.3) * falloff * dt
          m.vy += ((dx / dist) * 125 + ptrVy * 0.3) * falloff * dt
        }
      }

      m.vx *= Math.exp(-dt * 2.4)
      m.vy += (-(7 + (m.radius - 1.3) * 5) - m.vy) * (1 - Math.exp(-dt * 1.6))

      m.x += (m.vx + swayX) * dt
      m.y += m.vy * dt

      if (m.y < -12) {
        m.y = height + 12
        m.x = ((m.x % width) + width) % width
      } else if (m.y > height + 12) {
        m.y = -12
      }
      if (m.x < -12) m.x += width + 24
      if (m.x > width + 12) m.x -= width + 24
    }

    // 2. Update ethereal manta rays (0.55x suction mass/inertia + swallow/respawn)
    for (let mi = 0; mi < mantas.length; mi++) {
      const m = mantas[mi]
      m.flapPhase = (m.flapPhase + m.flapSpeed * dt) % (Math.PI * 2)
      m.wavePhase += dt * 0.42

      if (m.lifeState === 'swallowed') {
        m.swallowProgress += dt / 0.25
        const pullAlpha = 1 - Math.exp(-dt * 20)
        m.x += (leviathan.cx - m.x) * pullAlpha
        m.y += (leviathan.cy - m.y) * pullAlpha
        for (const node of m.tailNodes) {
          node.x += (leviathan.cx - node.x) * pullAlpha
          node.y += (leviathan.cy - node.y) * pullAlpha
        }
        if (m.swallowProgress >= 1) {
          m.lifeState = 'respawning'
          m.respawnTimer = 4.0 + (mi % 3) * 0.9
        }
        continue
      }

      if (m.lifeState === 'respawning') {
        m.respawnTimer -= dt
        if (m.respawnTimer <= 0) {
          m.lifeState = 'active'
          m.evadeBoost = 0
          m.x =
            m.direction === 1
              ? -m.wingspan * 1.45
              : width + m.wingspan * 1.45
          m.y = height * m.laneYRatio
          m.vx = m.direction * m.speed
          m.vy = 0
          m.heading = m.direction === 1 ? 0 : Math.PI
          const tailSeg = m.wingspan * 0.095
          for (let i = 0; i < m.tailNodes.length; i++) {
            m.tailNodes[i].x =
              m.x - m.direction * (m.wingspan * 0.34 + i * tailSeg)
            m.tailNodes[i].y = m.y
          }
        }
        continue
      }

      m.evadeBoost *= Math.exp(-dt * 1.8)

      const desiredY =
        height * m.laneYRatio + Math.sin(m.wavePhase) * height * 0.11
      const targetVy = (desiredY - m.y) * 0.65
      const boostSpeed = m.speed * (1 + m.evadeBoost * 0.65)
      const targetVx = m.direction * boostSpeed

      m.vx += (targetVx - m.vx) * (1 - Math.exp(-dt * 1.8))
      m.vy += (targetVy - m.vy) * (1 - Math.exp(-dt * 1.8))

      // Smooth banking away from cursor
      if (ptrActive > 0.01) {
        const dx = m.x - ptrX
        const dy = m.y - ptrY
        const reach = ptrRad + m.wingspan * 0.65
        const distSq = dx * dx + dy * dy
        if (distSq < reach * reach && distSq > 1) {
          const dist = Math.sqrt(distSq)
          const falloff = (1 - dist / reach) * ptrActive
          const nx = dx / dist
          const ny = dy / dist
          m.vx += (nx * 240 - ny * 75 + ptrVx * 0.25) * falloff * dt
          m.vy += (ny * 240 + nx * 75 + ptrVy * 0.25) * falloff * dt
          m.evadeBoost = Math.max(m.evadeBoost, falloff * 0.9)
        }
      }

      // Leviathan suction vortex (0.55x mass) vs outer panic
      if (leviathan.phase === 'telegraph') {
        const dx = m.x - leviathan.cx
        const dy = m.y - leviathan.cy
        const dist = Math.hypot(dx, dy) || 1
        if (dist > suctionRadius * 0.95 && dist < suctionRadius * 1.9) {
          m.vx += (dx / dist) * 55 * dt
          m.vy += (dy / dist) * 55 * dt
        }
      } else if (leviathan.phase === 'open') {
        const dx = leviathan.cx - m.x
        const dy = leviathan.cy - m.y
        const dist = Math.hypot(dx, dy) || 1
        if (dist < throatRadius) {
          m.lifeState = 'swallowed'
          m.swallowProgress = 0
          continue
        } else if (dist < suctionRadius) {
          const prox = 1 - dist / suctionRadius
          const pull = (280 + 960 * prox * prox) * 0.55
          const nx = dx / dist
          const ny = dy / dist
          m.vx += (nx * pull - ny * 45 * prox) * dt
          m.vy += (ny * pull + nx * 45 * prox) * dt
          m.evadeBoost = Math.max(m.evadeBoost, 0.5 + prox * 0.8)
        } else if (dist < suctionRadius * 2.0) {
          const panic = 1 - (dist - suctionRadius) / suctionRadius
          m.vx += (-dx / dist) * 260 * panic * dt
          m.vy += (-dy / dist) * 260 * panic * dt
          m.evadeBoost = Math.max(m.evadeBoost, 0.75 + panic * 0.5)
        }
      }

      m.x += m.vx * dt
      m.y += m.vy * dt

      const curHeading = Math.atan2(m.vy, m.vx)
      m.heading += wrapAngleDiff(curHeading, m.heading) * (1 - Math.exp(-dt * 3.0))

      const margin = m.wingspan * 1.65
      let wrapDx = 0
      if (m.direction === 1 && m.x > width + margin) {
        wrapDx = -(width + margin * 2)
      } else if (m.direction === -1 && m.x < -margin) {
        wrapDx = width + margin * 2
      }
      if (wrapDx !== 0) {
        m.x += wrapDx
        for (const node of m.tailNodes) {
          node.x += wrapDx
        }
      }

      const cosH = Math.cos(m.heading)
      const sinH = Math.sin(m.heading)
      const perpX = -sinH
      const perpY = cosH
      const tailBaseOffset = m.wingspan * 0.34
      m.tailNodes[0].x = m.x - cosH * tailBaseOffset
      m.tailNodes[0].y = m.y - sinH * tailBaseOffset

      const tailSeg = m.wingspan * 0.095
      for (let i = 1; i < m.tailNodes.length; i++) {
        const prev = m.tailNodes[i - 1]
        const curr = m.tailNodes[i]
        const wave = Math.sin(m.flapPhase - i * 0.45) * (6 + i * 1.1) * m.scale
        curr.x += (-cosH * 12 + perpX * wave) * dt
        curr.y += (-sinH * 12 + perpY * wave) * dt

        if (ptrActive > 0.01) {
          const dx = curr.x - ptrX
          const dy = curr.y - ptrY
          const distSq = dx * dx + dy * dy
          if (distSq < ptrRad * ptrRad && distSq > 1) {
            const dist = Math.sqrt(distSq)
            const falloff = (1 - dist / ptrRad) * ptrActive
            curr.x += ((dx / dist) * 165 + ptrVx * 0.35) * falloff * dt
            curr.y += ((dy / dist) * 165 + ptrVy * 0.35) * falloff * dt
          }
        }

        const sdx = curr.x - prev.x
        const sdy = curr.y - prev.y
        const sdist = Math.hypot(sdx, sdy) || 0.001
        curr.x = prev.x + (sdx / sdist) * tailSeg
        curr.y = prev.y + (sdy / sdist) * tailSeg
      }
    }

    // 3. Update fantasy veil-tail koi (0.75x suction mass/inertia + swallow/respawn)
    for (let ki = 0; ki < kois.length; ki++) {
      const k = kois[ki]
      k.swimPhase += dt * (3.4 + k.evadeBoost * 2.2)

      if (k.lifeState === 'swallowed') {
        k.swallowProgress += dt / 0.25
        const pullAlpha = 1 - Math.exp(-dt * 22)
        k.x += (leviathan.cx - k.x) * pullAlpha
        k.y += (leviathan.cy - k.y) * pullAlpha
        for (const n of k.spine) {
          n.x += (leviathan.cx - n.x) * pullAlpha
          n.y += (leviathan.cy - n.y) * pullAlpha
        }
        for (const n of k.ribbonLeft) {
          n.x += (leviathan.cx - n.x) * pullAlpha
          n.y += (leviathan.cy - n.y) * pullAlpha
        }
        for (const n of k.ribbonRight) {
          n.x += (leviathan.cx - n.x) * pullAlpha
          n.y += (leviathan.cy - n.y) * pullAlpha
        }
        if (k.swallowProgress >= 1) {
          k.lifeState = 'respawning'
          k.respawnTimer = 4.0 + (ki % 3) * 0.85
        }
        continue
      }

      if (k.lifeState === 'respawning') {
        k.respawnTimer -= dt
        if (k.respawnTimer <= 0) {
          k.lifeState = 'active'
          k.evadeBoost = 0
          k.x =
            k.direction === 1
              ? -k.bodyLength * 2.1
              : width + k.bodyLength * 2.1
          k.y = height * k.laneYRatio
          k.vx = k.direction * k.speed
          k.vy = 0
          k.heading = k.direction === 1 ? 0 : Math.PI
          const spineSeg = k.bodyLength / (KOI_SPINE_NODES - 1)
          for (let i = 0; i < k.spine.length; i++) {
            k.spine[i].x = k.x - k.direction * i * spineSeg
            k.spine[i].y = k.y
          }
          const tailTip = k.spine[k.spine.length - 1]
          const ribSeg = k.bodyLength * 0.11
          for (let i = 0; i < k.ribbonLeft.length; i++) {
            k.ribbonLeft[i].x = tailTip.x - k.direction * i * ribSeg
            k.ribbonLeft[i].y = tailTip.y - i * 0.8
            k.ribbonRight[i].x = tailTip.x - k.direction * i * ribSeg
            k.ribbonRight[i].y = tailTip.y + i * 0.8
          }
        }
        continue
      }

      k.evadeBoost *= Math.exp(-dt * 2.0)

      const targetY =
        height * k.laneYRatio +
        Math.sin(simTime * 0.55 + k.laneYRatio * 7.0) * height * 0.09
      const boostSpeed = k.speed * (1 + k.evadeBoost * 0.65)
      const targetVx = k.direction * boostSpeed
      const targetVy = (targetY - k.y) * 0.8

      k.vx += (targetVx - k.vx) * (1 - Math.exp(-dt * 2.2))
      k.vy += (targetVy - k.vy) * (1 - Math.exp(-dt * 2.2))

      // Smooth banking & slight acceleration away from cursor
      if (ptrActive > 0.01) {
        const dx = k.x - ptrX
        const dy = k.y - ptrY
        const reach = ptrRad + k.bodyLength * 0.85
        const distSq = dx * dx + dy * dy
        if (distSq < reach * reach && distSq > 1) {
          const dist = Math.sqrt(distSq)
          const falloff = (1 - dist / reach) * ptrActive
          const nx = dx / dist
          const ny = dy / dist
          k.vx += (nx * 280 - ny * 85 + ptrVx * 0.3) * falloff * dt
          k.vy += (ny * 280 + nx * 85 + ptrVy * 0.3) * falloff * dt
          k.evadeBoost = Math.max(k.evadeBoost, falloff * 0.95)
        }
      }

      // Leviathan suction vortex (0.75x mass) vs outer panic
      if (leviathan.phase === 'telegraph') {
        const dx = k.x - leviathan.cx
        const dy = k.y - leviathan.cy
        const dist = Math.hypot(dx, dy) || 1
        if (dist > suctionRadius * 0.95 && dist < suctionRadius * 1.85) {
          k.vx += (dx / dist) * 75 * dt
          k.vy += (dy / dist) * 75 * dt
        }
      } else if (leviathan.phase === 'open') {
        const dx = leviathan.cx - k.x
        const dy = leviathan.cy - k.y
        const dist = Math.hypot(dx, dy) || 1
        if (dist < throatRadius) {
          k.lifeState = 'swallowed'
          k.swallowProgress = 0
          continue
        } else if (dist < suctionRadius) {
          const prox = 1 - dist / suctionRadius
          const pull = (280 + 960 * prox * prox) * 0.75
          const nx = dx / dist
          const ny = dy / dist
          k.vx += (nx * pull - ny * 60 * prox) * dt
          k.vy += (ny * pull + nx * 60 * prox) * dt
          k.evadeBoost = Math.max(k.evadeBoost, 0.6 + prox * 0.9)
        } else if (dist < suctionRadius * 2.0) {
          const panic = 1 - (dist - suctionRadius) / suctionRadius
          k.vx += (-dx / dist) * 340 * panic * dt
          k.vy += (-dy / dist) * 340 * panic * dt
          k.evadeBoost = Math.max(k.evadeBoost, 0.85 + panic * 0.5)
        }
      }

      k.x += k.vx * dt
      k.y += k.vy * dt

      const curH = Math.atan2(k.vy, k.vx)
      k.heading += wrapAngleDiff(curH, k.heading) * (1 - Math.exp(-dt * 3.6))

      const margin = k.bodyLength * 2.4
      let wrapDx = 0
      if (k.direction === 1 && k.x > width + margin) {
        wrapDx = -(width + margin * 2)
      } else if (k.direction === -1 && k.x < -margin) {
        wrapDx = width + margin * 2
      }
      if (wrapDx !== 0) {
        k.x += wrapDx
        for (const n of k.spine) n.x += wrapDx
        for (const n of k.ribbonLeft) n.x += wrapDx
        for (const n of k.ribbonRight) n.x += wrapDx
      }

      const spineSeg = k.bodyLength / (KOI_SPINE_NODES - 1)
      k.spine[0].x = k.x
      k.spine[0].y = k.y
      const cosK = Math.cos(k.heading)
      const sinK = Math.sin(k.heading)
      const perpX = -sinK
      const perpY = cosK

      for (let i = 1; i < k.spine.length; i++) {
        const prev = k.spine[i - 1]
        const curr = k.spine[i]
        const wave = Math.sin(k.swimPhase - i * 0.52) * (5 + i * 1.4) * k.scale
        curr.x += (-cosK * 10 + perpX * wave) * dt
        curr.y += (-sinK * 10 + perpY * wave) * dt

        const sdx = curr.x - prev.x
        const sdy = curr.y - prev.y
        const sdist = Math.hypot(sdx, sdy) || 0.001
        curr.x = prev.x + (sdx / sdist) * spineSeg
        curr.y = prev.y + (sdy / sdist) * spineSeg
      }

      const tailAnchor = k.spine[k.spine.length - 1]
      const ribSeg = k.bodyLength * 0.11
      const ribbons = [
        { nodes: k.ribbonLeft, side: -1 },
        { nodes: k.ribbonRight, side: 1 },
      ]
      for (const rib of ribbons) {
        rib.nodes[0].x = tailAnchor.x + perpX * rib.side * 1.5
        rib.nodes[0].y = tailAnchor.y + perpY * rib.side * 1.5
        for (let i = 1; i < rib.nodes.length; i++) {
          const prev = rib.nodes[i - 1]
          const curr = rib.nodes[i]
          const flutter =
            Math.sin(k.swimPhase * 0.95 - i * 0.48 + rib.side * 0.9) *
            (8 + i * 1.2) *
            k.scale
          curr.x +=
            (-cosK * 14 + perpX * (flutter + rib.side * 3.5 * k.scale)) * dt
          curr.y +=
            (-sinK * 14 + perpY * (flutter + rib.side * 3.5 * k.scale)) * dt

          if (ptrActive > 0.01) {
            const dx = curr.x - ptrX
            const dy = curr.y - ptrY
            const distSq = dx * dx + dy * dy
            if (distSq < ptrRad * ptrRad && distSq > 1) {
              const dist = Math.sqrt(distSq)
              const falloff = (1 - dist / ptrRad) * ptrActive
              curr.x += ((dx / dist) * 220 + ptrVx * 0.45) * falloff * dt
              curr.y += ((dy / dist) * 220 + ptrVy * 0.45) * falloff * dt
            }
          }

          const rdx = curr.x - prev.x
          const rdy = curr.y - prev.y
          const rdist = Math.hypot(rdx, rdy) || 0.001
          curr.x = prev.x + (rdx / rdist) * ribSeg
          curr.y = prev.y + (rdy / rdist) * ribSeg
        }
      }
    }

    // 4. Update ethereal jellyfish (0.55x suction mass/inertia + swallow/respawn)
    for (let ji = 0; ji < jellyfish.length; ji++) {
      const j = jellyfish[ji]
      j.pulsePhase = (j.pulsePhase + j.pulseSpeed * dt) % (Math.PI * 2)

      if (j.lifeState === 'swallowed') {
        j.swallowProgress += dt / 0.25
        const pullAlpha = 1 - Math.exp(-dt * 20)
        j.x += (leviathan.cx - j.x) * pullAlpha
        j.y += (leviathan.cy - j.y) * pullAlpha
        for (const tent of j.tentacles) {
          for (const node of tent.nodes) {
            node.x += (leviathan.cx - node.x) * pullAlpha
            node.y += (leviathan.cy - node.y) * pullAlpha
          }
        }
        if (j.swallowProgress >= 1) {
          j.lifeState = 'respawning'
          j.respawnTimer = 4.0 + (ji % 3) * 0.95
        }
        continue
      }

      if (j.lifeState === 'respawning') {
        j.respawnTimer -= dt
        if (j.respawnTimer <= 0) {
          j.lifeState = 'active'
          const [laneX] = JELLY_POSITIONS[ji % JELLY_POSITIONS.length]
          j.x = width * laneX
          j.y = height + j.bellRadius * 3.2
          j.vx = -3.5 * j.scale
          j.vy = -9.5 * j.scale
          j.heading = -Math.PI / 2 - 0.18 + (ji % 2 === 0 ? -0.08 : 0.1)
          for (let t = 0; t < j.tentacles.length; t++) {
            const tent = j.tentacles[t]
            const startX = j.x + tent.anchorOffsetRatio * j.bellRadius
            const startY = j.y + j.bellRadius * 0.22
            for (let n = 0; n < tent.nodes.length; n++) {
              tent.nodes[n].x = startX + Math.sin(n * 0.35 + t) * 2.5
              tent.nodes[n].y = startY + n * tent.segLen
            }
          }
        }
        continue
      }

      const contraction = Math.pow(
        Math.max(0, Math.sin(j.pulsePhase)),
        1.65
      )
      const thrust = (9 + 25 * contraction) * j.scale
      const desiredAngle =
        j.driftAngle + Math.sin(simTime * 0.28 + ji * 1.7) * 0.22

      j.vx += (Math.cos(desiredAngle) * thrust - j.vx) * (1 - Math.exp(-dt * 2.2))
      j.vy += (Math.sin(desiredAngle) * thrust - j.vy) * (1 - Math.exp(-dt * 2.2))

      // Bell nudge in cursor wake
      if (ptrActive > 0.01) {
        const dx = j.x - ptrX
        const dy = j.y - ptrY
        const reach = ptrRad + j.bellRadius * 1.35
        const distSq = dx * dx + dy * dy
        if (distSq < reach * reach && distSq > 1) {
          const dist = Math.sqrt(distSq)
          const falloff = (1 - dist / reach) * ptrActive
          j.vx += ((dx / dist) * 145 + ptrVx * 0.22) * falloff * dt
          j.vy += ((dy / dist) * 145 + ptrVy * 0.22) * falloff * dt
        }
      }

      // Leviathan suction vortex (0.55x mass) vs outer drift
      if (leviathan.phase === 'open') {
        const dx = leviathan.cx - j.x
        const dy = leviathan.cy - j.y
        const dist = Math.hypot(dx, dy) || 1
        if (dist < throatRadius) {
          j.lifeState = 'swallowed'
          j.swallowProgress = 0
          continue
        } else if (dist < suctionRadius) {
          const prox = 1 - dist / suctionRadius
          const pull = (260 + 880 * prox * prox) * 0.55
          const nx = dx / dist
          const ny = dy / dist
          j.vx += (nx * pull - ny * 40 * prox) * dt
          j.vy += (ny * pull + nx * 40 * prox) * dt
        } else if (dist < suctionRadius * 1.8) {
          const panic = 1 - (dist - suctionRadius) / (suctionRadius * 0.8)
          j.vx += (-dx / dist) * 110 * panic * dt
          j.vy += (-dy / dist) * 110 * panic * dt
        }
      }

      j.x += j.vx * dt
      j.y += j.vy * dt

      const speed = Math.hypot(j.vx, j.vy)
      if (speed > 1) {
        const targetHeading = Math.atan2(j.vy, j.vx)
        j.heading +=
          wrapAngleDiff(targetHeading, j.heading) * (1 - Math.exp(-dt * 2.5))
      }

      const margin = j.bellRadius * 4.8
      let wrappedDx = 0
      let wrappedDy = 0
      if (j.y < -margin) {
        wrappedDy = height + margin * 2
      } else if (j.y > height + margin) {
        wrappedDy = -(height + margin * 2)
      }
      if (j.x < -margin) {
        wrappedDx = width + margin * 2
      } else if (j.x > width + margin) {
        wrappedDx = -(width + margin * 2)
      }
      if (wrappedDx !== 0 || wrappedDy !== 0) {
        j.x += wrappedDx
        j.y += wrappedDy
        for (const tent of j.tentacles) {
          for (const node of tent.nodes) {
            node.x += wrappedDx
            node.y += wrappedDy
          }
        }
      }

      const cosH = Math.cos(j.heading)
      const sinH = Math.sin(j.heading)
      const perpX = -sinH
      const perpY = cosH
      const bellWidthScale = 1 - 0.18 * contraction

      for (const tent of j.tentacles) {
        const anchorX =
          j.x -
          cosH * (j.bellRadius * 0.12) +
          perpX * (tent.anchorOffsetRatio * j.bellRadius * bellWidthScale)
        const anchorY =
          j.y -
          sinH * (j.bellRadius * 0.12) +
          perpY * (tent.anchorOffsetRatio * j.bellRadius * bellWidthScale)

        tent.nodes[0].x = anchorX
        tent.nodes[0].y = anchorY

        for (let n = 1; n < tent.nodes.length; n++) {
          const prev = tent.nodes[n - 1]
          const curr = tent.nodes[n]

          const wave =
            Math.sin(simTime * 2.1 - n * 0.48 + tent.phaseOffset) *
            (11 + n * 1.4) *
            j.scale
          curr.x += (-cosH * 14 * j.scale + perpX * wave) * dt
          curr.y += (-sinH * 14 * j.scale + perpY * wave + 6 * j.scale) * dt

          // Swirl & brush trailing tentacles in cursor wake
          if (ptrActive > 0.01) {
            const dx = curr.x - ptrX
            const dy = curr.y - ptrY
            const distSq = dx * dx + dy * dy
            if (distSq < ptrRad * ptrRad && distSq > 1) {
              const dist = Math.sqrt(distSq)
              const falloff = (1 - dist / ptrRad) * ptrActive
              const nx = dx / dist
              const ny = dy / dist
              curr.x += (nx * 230 - ny * 95 + ptrVx * 0.45) * falloff * dt
              curr.y += (ny * 230 + nx * 95 + ptrVy * 0.45) * falloff * dt
            }
          }

          const segDx = curr.x - prev.x
          const segDy = curr.y - prev.y
          const segDist = Math.hypot(segDx, segDy) || 0.001
          curr.x = prev.x + (segDx / segDist) * tent.segLen
          curr.y = prev.y + (segDy / segDist) * tent.segLen
        }
      }
    }

    // 5. Update 3 opposing S-curve schools of fish (including swallowed/respawning lifecycle)
    const sepRadius = Math.max(24, minDim * 0.075)
    const alignRadius = Math.max(54, minDim * 0.17)
    const cohRadius = Math.max(72, minDim * 0.22)
    const sepSq = sepRadius * sepRadius
    const alignSq = alignRadius * alignRadius
    const cohSq = cohRadius * cohRadius

    const schoolDirs = [1, -1, 1]
    const schoolBaseY = [0.27, 0.67, 0.47]
    const schoolAmpY = [0.1, 0.09, 0.11]

    for (let i = 0; i < fishes.length; i++) {
      const f = fishes[i]
      const dirX = schoolDirs[f.schoolId]

      if (f.lifeState === 'swallowed') {
        f.swallowProgress += dt / 0.2
        f.x += (leviathan.cx - f.x) * (1 - Math.exp(-dt * 24))
        f.y += (leviathan.cy - f.y) * (1 - Math.exp(-dt * 24))
        for (const pt of f.trail) {
          pt.x += (f.x - pt.x) * 0.55
          pt.y += (f.y - pt.y) * 0.55
        }
        if (f.swallowProgress >= 1) {
          f.lifeState = 'respawning'
          f.respawnTimer = 3.0 + (i % 5) * 0.5
        }
        continue
      }

      if (f.lifeState === 'respawning') {
        f.respawnTimer -= dt
        if (f.respawnTimer <= 0) {
          f.lifeState = 'active'
          const margin = f.length * 1.8
          f.x = dirX === 1 ? -margin : width + margin
          f.y =
            height *
            (schoolBaseY[f.schoolId] +
              Math.sin(i * 1.1) * schoolAmpY[f.schoolId])
          f.vx = dirX * f.baseSpeed
          f.vy = 0
          f.dartBoost = 0
          for (let t = 0; t < f.trail.length; t++) {
            f.trail[t].x = f.x - f.vx * 0.014 * t
            f.trail[t].y = f.y
          }
        }
        continue
      }

      let sepX = 0
      let sepY = 0
      let alignX = 0
      let alignY = 0
      let alignCount = 0
      let cohX = 0
      let cohY = 0
      let cohCount = 0

      for (let k = 0; k < fishes.length; k++) {
        if (i === k) continue
        const o = fishes[k]
        if (o.lifeState !== 'active' || o.schoolId !== f.schoolId) continue

        const dx = f.x - o.x
        const dy = f.y - o.y
        const dSq = dx * dx + dy * dy

        if (dSq < sepSq && dSq > 0.01) {
          const dist = Math.sqrt(dSq)
          const inv = 1 / dist
          sepX += dx * inv * (1 - dist / sepRadius)
          sepY += dy * inv * (1 - dist / sepRadius)
        }
        if (dSq < alignSq) {
          alignX += o.vx
          alignY += o.vy
          alignCount++
        }
        if (dSq < cohSq) {
          cohX += o.x
          cohY += o.y
          cohCount++
        }
      }

      let steerX = sepX * 155
      let steerY = sepY * 155

      if (alignCount > 0) {
        steerX += (alignX / alignCount - f.vx) * 1.4
        steerY += (alignY / alignCount - f.vy) * 1.4
      }
      if (cohCount > 0) {
        steerX += (cohX / cohCount - f.x) * 0.72
        steerY += (cohY / cohCount - f.y) * 0.72
      }

      const nx = clamp(f.x / width, 0, 1)
      const sCurveTargetY =
        height *
        (schoolBaseY[f.schoolId] +
          Math.sin(nx * Math.PI * 2 + simTime * 0.45 + f.schoolId * 1.9) *
            schoolAmpY[f.schoolId])

      steerX += (dirX * f.baseSpeed - f.vx) * 1.1
      steerY +=
        (sCurveTargetY - f.y) * 1.15 +
        Math.sin(simTime * 1.4 + f.phaseOffset) * 8

      if (f.y < height * 0.08) steerY += (height * 0.08 - f.y) * 2.5
      if (f.y > height * 0.8) steerY -= (f.y - height * 0.8) * 2.5

      // Strong pointer parting & darting across ALL 3 schools
      if (ptrActive > 0.01) {
        const dx = f.x - ptrX
        const dy = f.y - ptrY
        const distSq = dx * dx + dy * dy
        if (distSq < ptrRad * ptrRad && distSq > 0.5) {
          const dist = Math.sqrt(distSq)
          const falloff = (1 - dist / ptrRad) * ptrActive
          const unx = dx / dist
          const uny = dy / dist
          const swirlSign = f.phaseOffset % 2 > 1 ? 1 : -1
          steerX +=
            (unx * 540 - uny * 140 * swirlSign + ptrVx * 0.45) * falloff
          steerY +=
            (uny * 540 + unx * 140 * swirlSign + ptrVy * 0.45) * falloff
          f.dartBoost = Math.max(f.dartBoost, falloff * 1.45)
        }
      }

      // Leviathan suction-feeding vortex vs. outer panic impulse
      if (leviathan.phase === 'telegraph') {
        const dx = f.x - leviathan.cx
        const dy = f.y - leviathan.cy
        const dist = Math.hypot(dx, dy) || 1
        if (dist > suctionRadius * 0.95 && dist < suctionRadius * 1.8) {
          steerX += (dx / dist) * 95
          steerY += (dy / dist) * 95
        }
      } else if (leviathan.phase === 'open') {
        const dx = leviathan.cx - f.x
        const dy = leviathan.cy - f.y
        const dist = Math.hypot(dx, dy) || 1
        if (dist < throatRadius) {
          f.lifeState = 'swallowed'
          f.swallowProgress = 0
          continue
        } else if (dist < suctionRadius) {
          const prox = 1 - dist / suctionRadius
          const pull = 280 + 960 * prox * prox
          const nx = dx / dist
          const ny = dy / dist
          steerX += nx * pull - ny * 75 * prox
          steerY += ny * pull + nx * 75 * prox
          f.dartBoost = Math.max(f.dartBoost, 0.7 + prox * 1.1)
        } else if (dist < suctionRadius * 2.0) {
          const panic = 1 - (dist - suctionRadius) / suctionRadius
          steerX += (-dx / dist) * 440 * panic
          steerY += (-dy / dist) * 440 * panic
          f.dartBoost = Math.max(f.dartBoost, 0.9 + panic * 0.6)
        }
      }

      f.dartBoost *= Math.exp(-dt * 2.2)
      f.vx += steerX * dt
      f.vy += steerY * dt

      const targetSpeed = f.baseSpeed * (1 + f.dartBoost * 1.25)
      const curSpeed = Math.hypot(f.vx, f.vy) || 1
      const blendedSpeed =
        curSpeed + (targetSpeed - curSpeed) * (1 - Math.exp(-dt * 4.5))
      f.vx = (f.vx / curSpeed) * blendedSpeed
      f.vy = (f.vy / curSpeed) * blendedSpeed

      f.x += f.vx * dt
      f.y += f.vy * dt
      f.tailPhase += dt * (10 + f.dartBoost * 12)

      const fishMargin = f.length * 2.2
      let wrapDx = 0
      if (dirX === 1 && f.x > width + fishMargin) {
        wrapDx = -(width + fishMargin * 2)
      } else if (dirX === -1 && f.x < -fishMargin) {
        wrapDx = width + fishMargin * 2
      }
      if (wrapDx !== 0) {
        f.x += wrapDx
        for (const pt of f.trail) {
          pt.x += wrapDx
        }
      }

      for (let t = f.trail.length - 1; t > 0; t--) {
        f.trail[t].x = f.trail[t - 1].x
        f.trail[t].y = f.trail[t - 1].y
      }
      f.trail[0].x = f.x
      f.trail[0].y = f.y
    }
  }

  const renderLeviathan = (ctx: CanvasRenderingContext2D) => {
    if (leviathan.phase === 'idle' && !leviathan.shockwaveActive) {
      return
    }

    const { minDim, jawHalfW, maxGap } = getMouthGeometry()
    const cx = leviathan.cx
    let cy = leviathan.cy

    let visibility = 0
    let jawOpen = 0
    let eyeGlow = 0

    if (leviathan.phase === 'telegraph') {
      const p = clamp(leviathan.elapsed / TELEGRAPH_DUR, 0, 1)
      eyeGlow = easeOutCubic(p) * 0.9
      visibility = p * 0.25
      jawOpen = 0.08
    } else if (leviathan.phase === 'open') {
      const p = clamp(leviathan.elapsed / OPEN_DUR, 0, 1)
      visibility = 0.25 + 0.75 * easeOutCubic(p)
      jawOpen = 0.08 + 0.92 * easeOutCubic(p)
      eyeGlow = 0.9 + 0.1 * p
    } else if (leviathan.phase === 'snap') {
      const p = clamp(leviathan.elapsed / SNAP_DUR, 0, 1)
      visibility = 1.0
      jawOpen = 1.0 - easeInOutQuad(Math.min(1, p * 2.3))
      eyeGlow = 1.0
    } else if (leviathan.phase === 'recede') {
      const p = clamp(leviathan.elapsed / RECEDE_DUR, 0, 1)
      const fade = 1 - easeInOutQuad(p)
      visibility = fade
      jawOpen = 0
      eyeGlow = fade * 0.85
      cy += p * minDim * 0.2
    }

    if (leviathan.phase !== 'idle') {
      const upperHalfW = jawHalfW * 1.08
      const lowerHalfW = jawHalfW * 0.94
      const upperY = cy - maxGap * jawOpen
      const lowerY = cy + maxGap * jawOpen
      const archH = minDim * 0.2 * chompScale

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(-0.065)
      ctx.translate(-cx, -cy)

      // 1. Looming asymmetrical dark head silhouette & cavernous pitch-black gullet
      if (visibility > 0.06) {
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = `rgba(0, 0, 0, ${0.96 * visibility})`
        ctx.beginPath()
        ctx.moveTo(cx - upperHalfW * 1.24, cy - archH * 0.15)
        ctx.lineTo(cx - upperHalfW * 1.04, upperY - archH * 1.05)
        ctx.lineTo(cx - upperHalfW * 0.56, upperY - archH * 1.52)
        ctx.lineTo(cx - upperHalfW * 0.08, upperY - archH * 1.22)
        ctx.lineTo(cx + upperHalfW * 0.44, upperY - archH * 1.46)
        ctx.lineTo(cx + upperHalfW * 0.98, upperY - archH * 0.98)
        ctx.lineTo(cx + upperHalfW * 1.22, cy + archH * 0.08)
        ctx.lineTo(cx + lowerHalfW * 0.96, lowerY + archH * 0.88)
        ctx.lineTo(cx + lowerHalfW * 0.38, lowerY + archH * 1.18)
        ctx.lineTo(cx - lowerHalfW * 0.12, lowerY + archH * 1.06)
        ctx.lineTo(cx - lowerHalfW * 0.72, lowerY + archH * 0.94)
        ctx.lineTo(cx - lowerHalfW * 1.08, cy + archH * 0.25)
        ctx.closePath()
        ctx.fill()
      }

      ctx.globalCompositeOperation = 'lighter'

      // Telegraph disturbance ripple
      if (leviathan.phase === 'telegraph') {
        const tp = clamp(leviathan.elapsed / TELEGRAPH_DUR, 0, 1)
        const rippleR = jawHalfW * (0.35 + tp * 0.9)
        ctx.strokeStyle = `rgba(195, 240, 255, ${(1 - tp) * 0.34})`
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.arc(cx, cy, rippleR, 0, Math.PI * 2)
        ctx.stroke()
      }

      // 2. Eerie pulsing bioluminescent glow deep inside the cavernous throat + suction streaks
      if (visibility > 0.12 && jawOpen > 0.1) {
        const throatPulse = 0.65 + 0.35 * Math.sin(simTime * 6.0)
        const throatR = jawHalfW * 0.44 * jawOpen
        const tg = ctx.createRadialGradient(cx, cy, 0, cx, cy, throatR)
        tg.addColorStop(
          0,
          `rgba(185, 242, 255, ${0.34 * visibility * throatPulse})`
        )
        tg.addColorStop(
          0.5,
          `rgba(165, 228, 250, ${0.14 * visibility * throatPulse})`
        )
        tg.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = tg
        ctx.beginPath()
        ctx.arc(cx, cy, throatR, 0, Math.PI * 2)
        ctx.fill()

        if (leviathan.phase === 'open') {
          ctx.strokeStyle = `rgba(195, 244, 255, ${0.22 * visibility})`
          ctx.lineWidth = 1.4
          for (let s = 0; s < 6; s++) {
            const ang = (s / 6) * Math.PI * 2 + simTime * 1.6
            const rOut = jawHalfW * 0.92
            const rIn = jawHalfW * 0.24
            ctx.beginPath()
            ctx.moveTo(cx + Math.cos(ang) * rOut, cy + Math.sin(ang) * rOut * 0.65)
            ctx.lineTo(cx + Math.cos(ang) * rIn, cy + Math.sin(ang) * rIn * 0.65)
            ctx.stroke()
          }
        }
      }

      // 3. Narrow, slanted predatory slit eyes + cold brow eye glints
      if (eyeGlow > 0.02) {
        const eyeBaseY = upperY - archH * 0.88
        const mainEyes = [
          { x: cx - upperHalfW * 0.42, y: eyeBaseY - archH * 0.06, tilt: 0.34, s: 1.0 },
          { x: cx + upperHalfW * 0.38, y: eyeBaseY + archH * 0.04, tilt: -0.34, s: 0.95 },
        ]
        for (const e of mainEyes) {
          const er = Math.max(6, minDim * 0.03 * chompScale * e.s)
          const eg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, er * 2.4)
          eg.addColorStop(0, `rgba(225, 254, 255, ${0.9 * eyeGlow})`)
          eg.addColorStop(0.45, `rgba(185, 240, 255, ${0.35 * eyeGlow})`)
          eg.addColorStop(1, 'rgba(0, 0, 0, 0)')
          ctx.fillStyle = eg
          ctx.beginPath()
          ctx.arc(e.x, e.y, er * 2.4, 0, Math.PI * 2)
          ctx.fill()

          ctx.save()
          ctx.translate(e.x, e.y)
          ctx.rotate(e.tilt)
          ctx.fillStyle = `rgba(235, 255, 255, ${eyeGlow})`
          ctx.beginPath()
          ctx.moveTo(-er * 1.35, 0)
          ctx.quadraticCurveTo(0, -er * 0.42, er * 1.35, 0)
          ctx.quadraticCurveTo(0, er * 0.42, -er * 1.35, 0)
          ctx.closePath()
          ctx.fill()
          ctx.restore()
        }

        // 4 smaller cold abyssal eye glints clustered asymmetrically on brow
        const glints = [
          { x: cx - upperHalfW * 0.56, y: eyeBaseY + archH * 0.14, r: 0.45 },
          { x: cx - upperHalfW * 0.29, y: eyeBaseY - archH * 0.22, r: 0.38 },
          { x: cx + upperHalfW * 0.53, y: eyeBaseY + archH * 0.18, r: 0.42 },
          { x: cx + upperHalfW * 0.24, y: eyeBaseY - archH * 0.16, r: 0.36 },
        ]
        for (const g of glints) {
          const gr = Math.max(2.5, minDim * 0.015 * chompScale * g.r)
          ctx.fillStyle = `rgba(220, 252, 255, ${0.78 * eyeGlow})`
          ctx.beginPath()
          ctx.arc(g.x, g.y, gr, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // 4. Jagged asymmetrical gnarled jaws + needle-thin inward-curving viperfish fangs
      if (visibility > 0.03) {
        const evalPolyline = (pts: Vec2Node[], u: number) => {
          const scaled = clamp(u, 0, 1) * (pts.length - 1)
          const idx = Math.min(pts.length - 2, Math.floor(scaled))
          const frac = scaled - idx
          return {
            x: pts[idx].x + (pts[idx + 1].x - pts[idx].x) * frac,
            y: pts[idx].y + (pts[idx + 1].y - pts[idx].y) * frac,
          }
        }

        const upperPts: Vec2Node[] = [
          { x: cx - upperHalfW, y: cy - archH * 0.04 },
          { x: cx - upperHalfW * 0.72, y: upperY - archH * 0.42 },
          { x: cx - upperHalfW * 0.36, y: upperY - archH * 0.74 },
          { x: cx + upperHalfW * 0.04, y: upperY - archH * 0.62 },
          { x: cx + upperHalfW * 0.45, y: upperY - archH * 0.78 },
          { x: cx + upperHalfW * 0.78, y: upperY - archH * 0.36 },
          { x: cx + upperHalfW, y: cy + archH * 0.06 },
        ]

        const lowerPts: Vec2Node[] = [
          { x: cx - lowerHalfW, y: cy + archH * 0.08 },
          { x: cx - lowerHalfW * 0.68, y: lowerY + archH * 0.48 },
          { x: cx - lowerHalfW * 0.28, y: lowerY + archH * 0.7 },
          { x: cx + lowerHalfW * 0.1, y: lowerY + archH * 0.62 },
          { x: cx + lowerHalfW * 0.48, y: lowerY + archH * 0.74 },
          { x: cx + lowerHalfW * 0.78, y: lowerY + archH * 0.4 },
          { x: cx + lowerHalfW, y: cy + archH * 0.02 },
        ]

        const strokeJaw = (pts: Vec2Node[]) => {
          ctx.strokeStyle = `rgba(205, 248, 255, ${0.88 * visibility})`
          ctx.lineWidth = Math.max(4, minDim * 0.024 * chompScale)
          ctx.lineJoin = 'round'
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(pts[0].x, pts[0].y)
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y)
          }
          ctx.stroke()
        }

        const upperFangs: Array<[number, number]> = [
          [0.12, 0.55],
          [0.19, 0.85],
          [0.27, 1.38],
          [0.34, 0.62],
          [0.42, 1.15],
          [0.5, 0.72],
          [0.58, 1.42],
          [0.66, 0.58],
          [0.74, 1.24],
          [0.82, 0.78],
          [0.88, 0.5],
        ]
        const lowerFangs: Array<[number, number]> = [
          [0.15, 0.65],
          [0.23, 1.25],
          [0.31, 0.55],
          [0.39, 1.35],
          [0.47, 0.75],
          [0.55, 1.18],
          [0.63, 0.6],
          [0.71, 1.32],
          [0.79, 0.85],
          [0.86, 0.52],
        ]

        const drawFangs = (
          pts: Vec2Node[],
          specs: Array<[number, number]>,
          isUpper: boolean
        ) => {
          const dir = isUpper ? 1 : -1
          const baseLen = minDim * 0.115 * chompScale
          const baseHalfW = Math.max(2.2, minDim * 0.01 * chompScale)

          for (const [u, lenMul] of specs) {
            const p = evalPolyline(pts, u)
            const len = baseLen * lenMul
            const hw = baseHalfW * (0.75 + 0.35 * lenMul)
            // Curve inward toward the throat center
            const inwardX = (cx - p.x) * 0.18
            const tipX = p.x + inwardX
            const tipY = p.y + dir * len
            const ctrlX = p.x + inwardX * 0.25
            const ctrlY = p.y + dir * len * 0.55

            ctx.fillStyle = `rgba(225, 254, 255, ${0.95 * visibility})`
            ctx.beginPath()
            ctx.moveTo(p.x - hw, p.y)
            ctx.quadraticCurveTo(ctrlX - hw * 0.35, ctrlY, tipX, tipY)
            ctx.quadraticCurveTo(ctrlX + hw * 0.35, ctrlY, p.x + hw, p.y)
            ctx.closePath()
            ctx.fill()
          }
        }

        strokeJaw(upperPts)
        strokeJaw(lowerPts)
        drawFangs(upperPts, upperFangs, true)
        drawFangs(lowerPts, lowerFangs, false)
      }

      ctx.restore()
    }

    // Expanding bioluminescent shockwave ring on snap
    if (leviathan.shockwaveActive) {
      const sp = clamp(leviathan.shockwaveAge / 0.95, 0, 1)
      const ringR = minDim * (0.14 + easeOutCubic(sp) * 0.78) * chompScale
      const ringAlpha = (1 - sp) * (1 - sp) * 0.9
      ctx.globalCompositeOperation = 'lighter'
      ctx.strokeStyle = `rgba(222, 254, 255, ${ringAlpha})`
      ctx.lineWidth = Math.max(2, (1 - sp) * 9)
      ctx.beginPath()
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  const render = (ctx: CanvasRenderingContext2D) => {
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    if (leviathan.shakeRemaining > 0) {
      const decay = clamp(leviathan.shakeRemaining / 0.25, 0, 1)
      const amp = 1.0 * decay * decay
      const shakeX = Math.sin(simTime * 118) * amp
      const shakeY = Math.cos(simTime * 143) * amp
      ctx.translate(shakeX, shakeY)
    }

    ctx.globalCompositeOperation = 'lighter'

    // 1. Deep-sea nebula haze & 5 slow-drifting diagonal underwater god rays
    const hazeCenters = [
      {
        x: width * (0.68 + Math.sin(simTime * 0.11) * 0.06),
        y: height * (0.42 + Math.cos(simTime * 0.09) * 0.05),
        r: Math.max(width, height) * 0.44,
        a: 0.13,
      },
      {
        x: width * (0.3 + Math.cos(simTime * 0.08) * 0.05),
        y: height * (0.34 + Math.sin(simTime * 0.12) * 0.05),
        r: Math.max(width, height) * 0.36,
        a: 0.09,
      },
      {
        x: width * (0.82 + Math.sin(simTime * 0.13 + 2.0) * 0.05),
        y: height * (0.66 + Math.cos(simTime * 0.1 + 1.0) * 0.04),
        r: Math.max(width, height) * 0.32,
        a: 0.1,
      },
    ]

    for (const h of hazeCenters) {
      const grad = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r)
      grad.addColorStop(0, `rgba(210, 218, 224, ${h.a})`)
      grad.addColorStop(0.55, `rgba(180, 192, 200, ${h.a * 0.35})`)
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
    }

    for (let s = 0; s < 5; s++) {
      const sx =
        width * (0.12 + s * 0.2 + Math.sin(simTime * 0.13 + s * 1.3) * 0.04)
      const beamW = width * (0.08 + (s % 2) * 0.045)
      const breathe = 0.065 + 0.035 * Math.sin(simTime * 0.32 + s * 1.7)
      const beamGrad = ctx.createLinearGradient(
        sx,
        0,
        sx - width * 0.16,
        height * 0.88
      )
      beamGrad.addColorStop(0, `rgba(208, 218, 224, ${breathe})`)
      beamGrad.addColorStop(0.55, `rgba(195, 205, 214, ${breathe * 0.35})`)
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = beamGrad
      ctx.beginPath()
      ctx.moveTo(sx - beamW * 0.5, 0)
      ctx.lineTo(sx + beamW * 0.5, 0)
      ctx.lineTo(sx + beamW * 0.1, height * 0.88)
      ctx.lineTo(sx - beamW * 1.1, height * 0.88)
      ctx.closePath()
      ctx.fill()
    }

    // 2. Slow-rising bioluminescent motes
    for (const m of motes) {
      const twinkle = 0.65 + 0.35 * Math.sin(simTime * 2.1 + m.phase)
      const alpha = m.baseAlpha * twinkle
      const grad = ctx.createRadialGradient(
        m.x,
        m.y,
        0,
        m.x,
        m.y,
        m.radius * 2.4
      )
      grad.addColorStop(0, `rgba(220, 244, 255, ${alpha})`)
      grad.addColorStop(0.5, `rgba(190, 228, 250, ${alpha * 0.35})`)
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(m.x, m.y, m.radius * 2.4, 0, Math.PI * 2)
      ctx.fill()
    }

    // 3. Ethereal Manta Rays
    for (const m of mantas) {
      if (m.lifeState === 'respawning') continue
      const swallowFade =
        m.lifeState === 'swallowed' ? Math.max(0, 1 - m.swallowProgress) : 1
      if (swallowFade <= 0.01) continue

      const ws = m.wingspan * (0.25 + 0.75 * swallowFade)
      const depthAlpha = (0.62 + 0.38 * m.scale) * swallowFade

      ctx.beginPath()
      ctx.moveTo(m.tailNodes[0].x, m.tailNodes[0].y)
      for (let i = 1; i < m.tailNodes.length - 1; i++) {
        const xc = (m.tailNodes[i].x + m.tailNodes[i + 1].x) * 0.5
        const yc = (m.tailNodes[i].y + m.tailNodes[i + 1].y) * 0.5
        ctx.quadraticCurveTo(m.tailNodes[i].x, m.tailNodes[i].y, xc, yc)
      }
      const lastTail = m.tailNodes[m.tailNodes.length - 1]
      ctx.lineTo(lastTail.x, lastTail.y)
      ctx.strokeStyle = `rgba(200, 242, 255, ${0.55 * depthAlpha})`
      ctx.lineWidth = Math.max(1.5, 2.6 * m.scale)
      ctx.lineCap = 'round'
      ctx.stroke()

      ctx.save()
      ctx.translate(m.x, m.y)
      ctx.rotate(m.heading)

      const halo = ctx.createRadialGradient(0, 0, ws * 0.08, 0, 0, ws * 0.85)
      halo.addColorStop(0, `rgba(190, 242, 255, ${0.24 * depthAlpha})`)
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(0, 0, ws * 0.85, 0, Math.PI * 2)
      ctx.fill()

      const innerFlap = Math.sin(m.flapPhase) * 0.14
      const tipFlap = Math.sin(m.flapPhase - 0.85) * 0.22
      const halfSpan = ws * (0.52 - Math.abs(tipFlap) * 0.18)
      const tipSweep = -ws * 0.16 + tipFlap * ws * 0.25
      const noseX = ws * 0.26
      const tailX = -ws * 0.34

      const wingGrad = ctx.createRadialGradient(
        ws * 0.04,
        0,
        ws * 0.04,
        0,
        0,
        halfSpan * 1.1
      )
      wingGrad.addColorStop(0, `rgba(222, 252, 255, ${0.95 * depthAlpha})`)
      wingGrad.addColorStop(0.55, `rgba(195, 240, 255, ${0.72 * depthAlpha})`)
      wingGrad.addColorStop(1, `rgba(175, 226, 250, ${0.42 * depthAlpha})`)

      ctx.fillStyle = wingGrad
      ctx.beginPath()
      ctx.moveTo(noseX + ws * 0.06, -ws * 0.075)
      ctx.quadraticCurveTo(noseX * 0.85, -ws * 0.03, noseX * 0.92, 0)
      ctx.quadraticCurveTo(noseX * 0.85, ws * 0.03, noseX + ws * 0.06, ws * 0.075)
      ctx.bezierCurveTo(
        ws * 0.16,
        halfSpan * (0.48 + innerFlap),
        tipSweep + ws * 0.18,
        halfSpan * 0.98,
        tipSweep,
        halfSpan
      )
      ctx.quadraticCurveTo(
        tailX * 0.65,
        halfSpan * 0.42,
        tailX,
        ws * 0.035
      )
      ctx.lineTo(tailX, -ws * 0.035)
      ctx.quadraticCurveTo(
        tailX * 0.65,
        -halfSpan * 0.42,
        tipSweep,
        -halfSpan
      )
      ctx.bezierCurveTo(
        tipSweep + ws * 0.18,
        -halfSpan * 0.98,
        ws * 0.16,
        -halfSpan * (0.48 + innerFlap),
        noseX + ws * 0.06,
        -ws * 0.075
      )
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = `rgba(215, 253, 255, ${0.75 * depthAlpha})`
      ctx.lineWidth = Math.max(1.5, 2.8 * m.scale)
      ctx.beginPath()
      ctx.moveTo(noseX * 0.72, 0)
      ctx.lineTo(tailX * 0.85, 0)
      ctx.moveTo(ws * 0.08, -ws * 0.06)
      ctx.quadraticCurveTo(
        tipSweep * 0.35,
        -halfSpan * 0.45,
        tipSweep * 0.78,
        -halfSpan * 0.78
      )
      ctx.moveTo(ws * 0.08, ws * 0.06)
      ctx.quadraticCurveTo(
        tipSweep * 0.35,
        halfSpan * 0.45,
        tipSweep * 0.78,
        halfSpan * 0.78
      )
      ctx.stroke()

      ctx.restore()
    }

    // 4. Fantasy Veil-Tail Koi / Sea Ribbons
    for (const k of kois) {
      if (k.lifeState === 'respawning') continue
      const swallowFade =
        k.lifeState === 'swallowed' ? Math.max(0, 1 - k.swallowProgress) : 1
      if (swallowFade <= 0.01) continue

      const depthAlpha = (0.68 + 0.32 * k.scale) * swallowFade
      const bodyLen = k.bodyLength * (0.25 + 0.75 * swallowFade)

      const ribbons = [k.ribbonLeft, k.ribbonRight]
      for (const nodes of ribbons) {
        for (let i = 0; i < nodes.length - 1; i++) {
          const t = 1 - i / nodes.length
          ctx.strokeStyle = `rgba(202, 245, 255, ${0.62 * t * depthAlpha})`
          ctx.lineWidth = Math.max(1.2, 5.2 * k.scale * t)
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(nodes[i].x, nodes[i].y)
          ctx.lineTo(nodes[i + 1].x, nodes[i + 1].y)
          ctx.stroke()
        }
      }

      const head = k.spine[0]
      const neck = k.spine[2]
      const headAngle = Math.atan2(head.y - neck.y, head.x - neck.x)
      ctx.save()
      ctx.translate(k.spine[1].x, k.spine[1].y)
      ctx.rotate(headAngle)
      const finSpread = bodyLen * 0.42
      const finSweep = -bodyLen * 0.32
      const finFlap = Math.sin(k.swimPhase * 0.9) * bodyLen * 0.06
      ctx.fillStyle = `rgba(200, 242, 255, ${0.52 * depthAlpha})`
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(0, side * 2.5)
        ctx.quadraticCurveTo(
          finSweep * 0.35,
          side * (finSpread + finFlap),
          finSweep,
          side * (finSpread * 0.62)
        )
        ctx.quadraticCurveTo(
          finSweep * 0.6,
          side * 3,
          -bodyLen * 0.16,
          side * 2
        )
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()

      const leftPts: Vec2Node[] = []
      const rightPts: Vec2Node[] = []
      for (let i = 0; i < k.spine.length; i++) {
        const curr = k.spine[i]
        const prev = i > 0 ? k.spine[i - 1] : curr
        const next = i < k.spine.length - 1 ? k.spine[i + 1] : curr
        const tx = prev.x - next.x
        const ty = prev.y - next.y
        const tLen = Math.hypot(tx, ty) || 1
        const nx = -ty / tLen
        const ny = tx / tLen

        const u = i / (k.spine.length - 1)
        const profile =
          Math.sin(Math.pow(u, 0.72) * Math.PI) * 0.85 + (1 - u) * 0.25
        const halfW = bodyLen * 0.18 * profile

        leftPts.push({ x: curr.x + nx * halfW, y: curr.y + ny * halfW })
        rightPts.push({ x: curr.x - nx * halfW, y: curr.y - ny * halfW })
      }

      ctx.fillStyle = `rgba(218, 250, 255, ${0.9 * depthAlpha})`
      ctx.beginPath()
      ctx.moveTo(k.spine[0].x, k.spine[0].y)
      for (let i = 0; i < leftPts.length; i++) {
        ctx.lineTo(leftPts[i].x, leftPts[i].y)
      }
      for (let i = rightPts.length - 1; i >= 0; i--) {
        ctx.lineTo(rightPts[i].x, rightPts[i].y)
      }
      ctx.closePath()
      ctx.fill()
    }

    // 5. Ethereal Jellyfish
    for (const j of jellyfish) {
      if (j.lifeState === 'respawning') continue
      const swallowFade =
        j.lifeState === 'swallowed' ? Math.max(0, 1 - j.swallowProgress) : 1
      if (swallowFade <= 0.01) continue

      const contraction = Math.pow(
        Math.max(0, Math.sin(j.pulsePhase)),
        1.65
      )
      const depthAlpha = (0.5 + 0.5 * clamp(j.scale, 0.4, 1.05)) * swallowFade
      const r = j.bellRadius * (0.25 + 0.75 * swallowFade)

      for (const tent of j.tentacles) {
        const nodes = tent.nodes
        ctx.beginPath()
        ctx.moveTo(nodes[0].x, nodes[0].y)
        for (let n = 1; n < nodes.length - 1; n++) {
          const xc = (nodes[n].x + nodes[n + 1].x) * 0.5
          const yc = (nodes[n].y + nodes[n + 1].y) * 0.5
          ctx.quadraticCurveTo(nodes[n].x, nodes[n].y, xc, yc)
        }
        const last = nodes[nodes.length - 1]
        ctx.lineTo(last.x, last.y)

        ctx.strokeStyle = `rgba(198, 243, 255, ${0.54 * depthAlpha})`
        ctx.lineWidth = Math.max(1.3, 2.4 * j.scale)
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      ctx.save()
      ctx.translate(j.x, j.y)
      ctx.rotate(j.heading + Math.PI / 2)

      const bellW = r * (1.02 - 0.2 * contraction)
      const bellH = r * (0.76 + 0.2 * contraction)

      const halo = ctx.createRadialGradient(
        0,
        -bellH * 0.2,
        r * 0.1,
        0,
        0,
        r * 2.0
      )
      halo.addColorStop(0, `rgba(190, 245, 255, ${0.34 * depthAlpha})`)
      halo.addColorStop(0.5, `rgba(170, 225, 255, ${0.12 * depthAlpha})`)
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(0, 0, r * 2.0, 0, Math.PI * 2)
      ctx.fill()

      for (let fIdx = 0; fIdx < j.frillPhases.length; fIdx++) {
        const fOffset = (fIdx - 1) * bellW * 0.24
        const frillLen = r * (1.25 + 0.16 * Math.sin(j.pulsePhase + fIdx))
        ctx.beginPath()
        ctx.moveTo(fOffset, bellH * 0.08)
        for (let seg = 1; seg <= 6; seg++) {
          const st = seg / 6
          const wx =
            fOffset +
            Math.sin(simTime * 3.1 - st * 4.5 + j.frillPhases[fIdx]) *
              r *
              0.16 *
              st
          const wy = bellH * 0.08 + frillLen * st
          ctx.lineTo(wx, wy)
        }
        ctx.strokeStyle = `rgba(205, 248, 255, ${0.58 * depthAlpha})`
        ctx.lineWidth = Math.max(1.2, 2.4 * j.scale)
        ctx.stroke()
      }

      const bellGrad = ctx.createRadialGradient(
        0,
        -bellH * 0.45,
        bellW * 0.08,
        0,
        -bellH * 0.15,
        bellW * 1.15
      )
      bellGrad.addColorStop(0, `rgba(220, 253, 255, ${0.94 * depthAlpha})`)
      bellGrad.addColorStop(0.55, `rgba(195, 242, 255, ${0.62 * depthAlpha})`)
      bellGrad.addColorStop(1, `rgba(170, 220, 250, ${0.2 * depthAlpha})`)

      ctx.fillStyle = bellGrad
      ctx.beginPath()
      ctx.moveTo(-bellW, bellH * 0.12)
      ctx.bezierCurveTo(
        -bellW * 0.95,
        -bellH * 1.15,
        bellW * 0.95,
        -bellH * 1.15,
        bellW,
        bellH * 0.12
      )
      const scallops = 4
      for (let s = scallops; s > 0; s--) {
        const x1 = -bellW + ((2 * bellW) / scallops) * s
        const x0 = -bellW + ((2 * bellW) / scallops) * (s - 1)
        const xm = (x0 + x1) * 0.5
        ctx.quadraticCurveTo(xm, bellH * 0.28, x0, bellH * 0.12)
      }
      ctx.closePath()
      ctx.fill()

      const coreGrad = ctx.createRadialGradient(
        0,
        -bellH * 0.38,
        0,
        0,
        -bellH * 0.35,
        bellW * 0.56
      )
      coreGrad.addColorStop(
        0,
        `rgba(210, 252, 255, ${(0.84 + 0.15 * contraction) * depthAlpha})`
      )
      coreGrad.addColorStop(1, 'rgba(180, 240, 255, 0)')
      ctx.fillStyle = coreGrad
      ctx.beginPath()
      ctx.arc(0, -bellH * 0.35, bellW * 0.56, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    // 6. Three Schools of Halftone-Readable Fish
    for (const f of fishes) {
      if (f.lifeState === 'respawning') continue
      const swallowFade =
        f.lifeState === 'swallowed' ? Math.max(0, 1 - f.swallowProgress) : 1
      if (swallowFade <= 0.01) continue

      for (let t = 0; t < f.trail.length - 1; t++) {
        const p0 = f.trail[t]
        const p1 = f.trail[t + 1]
        const ratio = 1 - t / f.trail.length
        ctx.strokeStyle = `rgba(195, 242, 255, ${0.24 * ratio * ratio * swallowFade})`
        ctx.lineWidth = Math.max(1.0, f.width * 0.35 * ratio * swallowFade)
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.stroke()
      }

      const angle = Math.atan2(f.vy, f.vx)
      const wag = Math.sin(f.tailPhase) * f.width * 0.62
      const L = f.length * (0.35 + 0.65 * swallowFade)
      const W = f.width * 0.5 * (0.35 + 0.65 * swallowFade)

      ctx.save()
      ctx.translate(f.x, f.y)
      ctx.rotate(angle)

      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, L * 0.72)
      glow.addColorStop(0, `rgba(205, 248, 255, ${0.32 * swallowFade})`)
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(0, 0, L * 0.72, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = `rgba(202, 244, 255, ${0.72 * swallowFade})`
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(L * 0.14, side * W * 0.6)
        ctx.lineTo(-L * 0.08, side * (W * 1.65))
        ctx.lineTo(-L * 0.16, side * W * 0.45)
        ctx.closePath()
        ctx.fill()
      }

      ctx.fillStyle = `rgba(218, 250, 255, ${0.94 * swallowFade})`
      ctx.beginPath()
      ctx.moveTo(L * 0.52, 0)
      ctx.quadraticCurveTo(
        L * 0.18,
        -W * 1.15,
        -L * 0.32,
        wag * 0.32 - W * 0.22
      )
      ctx.lineTo(-L * 0.66, wag - W * 1.15)
      ctx.lineTo(-L * 0.48, wag * 0.55)
      ctx.lineTo(-L * 0.66, wag + W * 1.15)
      ctx.lineTo(-L * 0.32, wag * 0.32 + W * 0.22)
      ctx.quadraticCurveTo(L * 0.18, W * 1.15, L * 0.52, 0)
      ctx.closePath()
      ctx.fill()

      ctx.restore()
    }

    // 7. Giant Abyssal Leviathan (4-Stage Chomp Event)
    renderLeviathan(ctx)

    ctx.restore()
    ctx.globalCompositeOperation = 'source-over'
  }

  // Pre-warm simulation so initial paint & reduced-motion frames show cohesive schools & flowing tails
  for (let i = 0; i < 60; i++) {
    step(1 / 30)
  }

  const setOnChompImpact = (cb: (() => void) | null) => {
    onChompImpactCb = cb
  }

  return {
    resize,
    setCounts,
    setPointer,
    setChompScale,
    setOnChompImpact,
    triggerChomp,
    step,
    render,
  }
}
