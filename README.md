# jorizenriquez.me

Personal developer portfolio for **Joriz Enriquez** (`@roam-cmd`), showcasing full-stack projects, technical skills, certifications, and interactive WebGL graphics.

Live site: **https://jorizenriquez.me**

## Highlights

- **Interactive Deep-Sea WebGL Halftone Hero**:
  - Real-time ecosystem simulated on an offscreen `0.5x` HTML5 2D `<canvas>` (`src/components/motion/deepSeaSimulation.ts`) featuring three opposing S-curve fish schools (boids flocking), two gliding manta rays, four veil-tail koi, six depth-layered pulsing jellyfish, underwater god rays, and rising bioluminescent motes.
  - Rendered through a raw WebGL 1.0 halftone dot-matrix fragment shader (`src/components/motion/HalftoneShaderBackground.tsx`) with two-tone bioluminescent dot tinting and directional readability masking behind hero typography.
  - All-species pointer reactivity (fish part and dart, manta rays and koi bank away, jellyfish tentacles and motes swirl in the wake) plus a 4-stage abyssal leviathan **chomp** event triggered automatically on a timer or by clicking empty hero background space, paired with synchronized hero screen shake and mobile haptic feedback (`navigator.vibrate`).
- **Code-to-UI Source Reveal**: Per-section `</> Source` toggle letting visitors inspect TypeScript/component source snippets alongside the rendered interface.
- **3 Switchable Themes**: `Midnight` (default dark teal), `Slate Sand`, and `Sage Stone` palettes synced across CSS custom properties and live WebGL shader uniforms.
- **Portfolio Sections**: About & Profile Snapshot, Technical Stack, Selected Work with implementation detail views, Experience & Certifications (`public/certificates/`), and Contact actions.
- **Accessibility & Performance**: Honors `prefers-reduced-motion` (disables shakes/haptics and motion loops, falling back to static frames), pauses offscreen WebGL/canvas loops via `IntersectionObserver` and `visibilitychange`, caps DPR at `2`, and cleans up all GPU and DOM resources on unmount.

## Tech Stack

- **Framework & Language**: React 19, TypeScript (~7.0)
- **Build & Tooling**: Vite 8, Oxlint
- **Styling & Animation**: Tailwind CSS v4, Motion
- **Graphics**: Raw WebGL 1.0 (GLSL ES 1.00) + HTML5 2D Canvas
- **Icons & Typography**: Lucide React, Geist Variable

## Project Structure

```text
public/
  certificates/              # Certificate PDFs and PNG/JPG assets served statically
src/
  assets/                    # Static imported imagery
  components/
    kokonutui/               # Section background effects (HalftoneBackground, TopoBackground)
    layout/                  # Navbar and Footer
    motion/                  # WebGL halftone shader, deep-sea simulation, CodeToUIReveal
    sections/                # Hero, About, Skills, Projects, Experience, Certifications, Contact
    ui/                      # Reusable UI primitives, cards, modals, CustomCursor, loader
  data/
    portfolio.ts             # Structured profile, skills, projects, experience, certifications data
    codeSnippets.ts          # Source snippets for the Code-to-UI reveal toggles
  hooks/                     # useTheme, usePrefersReducedMotion, helpers
```

## Local Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Run linter
npm run lint

# Type-check and build for production
npm run build

# Preview the production build locally
npm run preview
```

## Deployment (Cloudflare Pages)

- **Build command**: `npm run build`
- **Build output directory**: `dist`
