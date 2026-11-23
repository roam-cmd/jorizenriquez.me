"use client";

/**
 * @author: @dorianbaffier
 * @description: Page Flip
 * @version: 1.1.0
 * @date: 2026-10-21
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { animate, useReducedMotion } from "motion/react";
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

interface Pt {
  x: number;
  y: number;
}

/** A page being turned: which way, by which corner, and where that corner is. */
interface Turn {
  dir: 1 | -1;
  /** The corner's resting point, in book pixels. */
  corner: Pt;
  /** Where the corner is now. */
  at: Pt;
  /** Optional explicit destination spread/page index for chapter jumps. */
  target?: number;
}

export interface PageFlipHandle {
  flipToPage: (pageIndex: number) => void;
}

export interface PageFlipProps {
  /** Pages in reading order. The first is the cover, alone on the right. */
  pages?: ReactNode[];
  /** Called with the spread index and single-page mode flag after a page settles. */
  onSpreadChange?: (spread: number, isSingle: boolean) => void;
  /** Optional initial page index (0-based) when mounting or resetting via key. */
  initialPage?: number;
  ref?: Ref<PageFlipHandle>;
  className?: string;
}

/** Below this frame width (px) or on mobile viewports (< 768px), show one page at a time. */
const SINGLE_BELOW = 560;
const MOBILE_VIEWPORT_BELOW = 768;
/** Minimum horizontal swipe travel (px) and axis ratio to commit a touch flip. */
const SWIPE_THRESHOLD_PX = 40;
const SWIPE_AXIS_RATIO = 1.2;
const AXIS_LOCK_DISTANCE = 10;
/** Marks a layer that isn't drawn. */
const HIDDEN = Symbol("hidden");

interface Layers {
  left?: ReactNode;
  right?: ReactNode;
  /** The page being turned, on its own side. */
  turning?: ReactNode;
  /** What's printed on the back of the turning page. */
  back?: ReactNode | typeof HIDDEN;
  /** Whether the static right page is the front cover (page 0). */
  rightIsCover?: boolean;
  /** Whether the static left page is the back cover. */
  leftIsCover?: boolean;
  /** Whether the actively turning page is the front/back cover. */
  turningIsCover?: boolean;
  /** Whether the back of the turning page is a cover face. */
  backIsCover?: boolean;
}

/** Two pages open: the cover alone on the right, then pairs. */
function twoPages(
  pages: ReactNode[],
  spread: number,
  dir?: 1 | -1,
  targetOverride?: number
): Layers {
  const leftIdx = (s: number) => (s > 0 ? 2 * s - 1 : -1);
  const rightIdx = (s: number) => 2 * s;
  const leftOf = (s: number) => {
    const idx = leftIdx(s);
    return idx >= 0 ? pages[idx] : undefined;
  };
  const rightOf = (s: number) => pages[rightIdx(s)];
  const isCoverLeft = (s: number) =>
    leftOf(s) !== undefined && rightOf(s) === undefined;
  const isCoverRight = (s: number) => s === 0 && rightOf(s) !== undefined;

  if (!dir) {
    return {
      left: leftOf(spread),
      right: rightOf(spread),
      leftIsCover: isCoverLeft(spread),
      rightIsCover: isCoverRight(spread),
    };
  }
  // While turning, what shows under the page is the target spread's.
  const target = targetOverride ?? spread + dir;
  return dir === 1
    ? {
        left: leftOf(spread),
        right: rightOf(target),
        turning: rightOf(spread),
        back: leftOf(target),
        leftIsCover: isCoverLeft(spread),
        rightIsCover: isCoverRight(target),
        turningIsCover: isCoverRight(spread),
        backIsCover: isCoverLeft(target),
      }
    : {
        left: leftOf(target),
        right: rightOf(spread),
        turning: leftOf(spread),
        back: rightOf(target),
        leftIsCover: isCoverLeft(target),
        rightIsCover: isCoverRight(spread),
        turningIsCover: isCoverLeft(spread),
        backIsCover: isCoverRight(target),
      };
}

/**
 * One page at a time: a page turns off to the left with blank paper on its
 * back, and turning back brings the previous page in over the current one.
 */
function onePage(
  pages: ReactNode[],
  page: number,
  dir?: 1 | -1,
  targetOverride?: number
): Layers {
  if (dir === 1) {
    const target = targetOverride ?? page + 1;
    return {
      right: pages[target],
      turning: pages[page],
      back: null,
      rightIsCover: target === 0,
      turningIsCover: page === 0,
      backIsCover: false,
    };
  }
  if (dir === -1) {
    const target = targetOverride ?? page - 1;
    return {
      right: pages[page],
      back: pages[target] ?? HIDDEN,
      rightIsCover: page === 0,
      backIsCover: target === 0,
    };
  }
  return {
    right: pages[page],
    rightIsCover: page === 0,
  };
}

/** How far to slide a closed book so its one page sits in the middle. */
function centerShift({ left, right }: Layers) {
  if (left === undefined) {
    return -0.25;
  }
  return right === undefined ? 0.25 : 0;
}

/** Corner the pointer has to be within (px) for the page to lift on hover. */
const PEEK_ZONE = 64;
/** How far a hovered corner lifts toward the pointer, at most (px). */
const PEEK_MAX = 34;
/** Pointer travel that turns a press into a drag (px). */
const DRAG_SLOP = 6;
const TURN = { duration: 0.6, ease: [0.32, 0.72, 0, 1] } as const;
const SETTLE = { duration: 0.32, ease: [0.23, 1, 0.32, 1] } as const;

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;
const len = (a: Pt) => Math.hypot(a.x, a.y);
const lerp = (a: Pt, b: Pt, t: number): Pt => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** Keeps a point within `radius` of `center`. */
function within(p: Pt, center: Pt, radius: number): Pt {
  const d = sub(p, center);
  const l = len(d);
  if (l <= radius) {
    return p;
  }
  return { x: center.x + (d.x / l) * radius, y: center.y + (d.y / l) * radius };
}

/** The part of a polygon on one side of a line through `m` with normal `n`. */
function clipPolygon(poly: Pt[], m: Pt, n: Pt, keepNegative: boolean): Pt[] {
  const side = (p: Pt) => {
    const d = dot(sub(p, m), n);
    return keepNegative ? -d : d;
  };
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = side(a);
    const db = side(b);
    if (da >= 0) {
      out.push(a);
    }
    if (da >= 0 !== db >= 0) {
      out.push(lerp(a, b, da / (da - db)));
    }
  }
  return out;
}

const polygon = (points: Pt[], dx: number) =>
  points.length
    ? `polygon(${points.map((p) => `${(p.x - dx).toFixed(2)}px ${p.y.toFixed(2)}px`).join(", ")})`
    : "polygon(0 0)";

/**
 * Where everything goes for a corner at `at`: the fold is the line halfway
 * between the corner's rest and where it is now. The page keeps the spine
 * side, and the flap (its back) is mirrored across the fold.
 */
function foldStyles(turn: Turn, w: number, h: number) {
  const x0 = turn.dir === 1 ? w : 0;
  const page = [
    { x: x0, y: 0 },
    { x: x0 + w, y: 0 },
    { x: x0 + w, y: h },
    { x: x0, y: h },
  ];
  const d = sub(turn.at, turn.corner);
  const l = len(d);
  if (l < 0.5) {
    return null;
  }
  const n = { x: d.x / l, y: d.y / l };
  const m = lerp(turn.corner, turn.at, 0.5);
  const front = clipPolygon(page, m, n, false);
  const flap = clipPolygon(page, m, n, true);
  // Reflection across the fold: X -> A X + b.
  const a = 1 - 2 * n.x * n.x;
  const bc = -2 * n.x * n.y;
  const dd = 1 - 2 * n.y * n.y;
  const k = 2 * dot(m, n);
  const bx = k * n.x;
  const by = k * n.y;
  // The flap element sits at the page's spot; CSS moves it from there.
  const e = a * x0 + bx - x0;
  const f = bc * x0 + by;
  const progress = Math.min(1, l / (2 * w));
  return {
    front: {
      clipPath: polygon(front, x0),
      backfaceVisibility: "hidden",
    } satisfies CSSProperties,
    flap: {
      clipPath: polygon(flap, x0),
      transform: `matrix(${a}, ${bc}, ${bc}, ${dd}, ${e}, ${f})`,
      backfaceVisibility: "hidden",
    } satisfies CSSProperties,
    /** How far through the turn, for the shadow. */
    progress,
  };
}

interface PressState {
  start: Pt;
  clientStart: Pt;
  pointerId: number;
  pointerType: string;
  axis: "undecided" | "horizontal" | "vertical";
  dir: 1 | -1;
  dragging: boolean;
  back?: boolean;
}

export default function PageFlip({
  pages = [],
  onSpreadChange,
  initialPage = 0,
  ref,
  className,
}: PageFlipProps) {
  const reduceMotion = useReducedMotion();
  const bookRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const frameRef = useRef<HTMLDivElement>(null);
  /** Narrow frames or mobile screens (< 768px) show one page at a time. */
  const [single, setSingle] = useState(false);
  const singleRef = useRef(false);
  // The spread on two pages, or the page on one.
  const [spread, setSpread] = useState(() => {
    const clamped = Math.max(0, Math.min(pages.length - 1, initialPage));
    return Math.ceil(clamped / 2);
  });
  const spreadRef = useRef(spread);
  const [turn, setTurn] = useState<Turn | null>(null);
  /** The spread a committed turn is heading for, so the book recenters with it. */
  const [heading, setHeading] = useState<number | null>(null);
  const turnRef = useRef<Turn | null>(null);
  const pressRef = useRef<PressState | null>(null);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const playingRef = useRef(false);
  /** A turn that will finish on its own: presses wait for it. */
  const committingRef = useRef(false);
  const onSpreadChangeRef = useRef(onSpreadChange);

  useEffect(() => {
    onSpreadChangeRef.current = onSpreadChange;
  }, [onSpreadChange]);

  useEffect(() => {
    spreadRef.current = spread;
  }, [spread]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  const spreads = single ? pages.length : Math.floor(pages.length / 2) + 1;

  useLayoutEffect(() => {
    const book = bookRef.current;
    const frame = frameRef.current;
    if (!(book && frame)) {
      return;
    }
    const measure = () => {
      const viewportNarrow =
        typeof window !== "undefined" &&
        window.innerWidth < MOBILE_VIEWPORT_BELOW;
      const narrow = viewportNarrow || frame.clientWidth < SINGLE_BELOW;
      if (narrow !== singleRef.current) {
        singleRef.current = narrow;
        setSingle(narrow);
        setSpread((s) => {
          const next = narrow ? Math.max(0, 2 * s - 1) : Math.ceil(s / 2);
          spreadRef.current = next;
          onSpreadChangeRef.current?.(next, narrow);
          return next;
        });
      }
      setSize({ w: book.clientWidth / 2, h: book.clientHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(book);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => () => animRef.current?.stop(), []);

  const stop = () => {
    animRef.current?.stop();
    playingRef.current = false;
  };

  const setAt = useCallback((next: Turn | null) => {
    turnRef.current = next;
    setTurn(next);
  }, []);

  /** Keeps the corner where paper can reach: the page stays on its spine. */
  const reach = useCallback(
    (p: Pt, corner: Pt) => {
      const { w, h } = size;
      const spineSame = { x: w, y: corner.y };
      const spineOther = { x: w, y: corner.y === 0 ? h : 0 };
      return within(within(p, spineSame, w), spineOther, Math.hypot(w, h));
    },
    [size]
  );

  const cornerFor = (dir: 1 | -1, y: number): Pt => ({
    x: dir === 1 ? 2 * size.w : 0,
    y: y < size.h / 2 ? 0 : size.h,
  });

  /** Runs the corner from where it is to `to`, lifting it on the way over. */
  const run = useCallback(
    (from: Turn, to: Pt, complete: boolean) => {
      animRef.current?.stop();
      playingRef.current = false;
      const { w: bookW, h: bookH } = sizeRef.current;
      const start = from.at;
      const lift = complete ? bookH * 0.14 * (from.corner.y === 0 ? 1 : -1) : 0;
      committingRef.current = complete;
      const next = from.target ?? spreadRef.current + from.dir;
      if (complete) {
        setHeading(next);
      }
      playingRef.current = true;
      animRef.current = animate(0, 1, {
        ...(complete ? TURN : SETTLE),
        onUpdate: (t) => {
          const p = lerp(start, to, t);
          setAt({
            ...from,
            at: { x: p.x, y: p.y + Math.sin(Math.PI * t) * lift },
          });
        },
        onComplete: () => {
          playingRef.current = false;
          committingRef.current = false;
          setAt(null);
          setHeading(null);
          if (complete) {
            spreadRef.current = next;
            setSpread(next);
            onSpreadChangeRef.current?.(next, singleRef.current);
          }
        },
      });
      void bookW;
    },
    [setAt]
  );

  useImperativeHandle(
    ref,
    () => ({
      flipToPage: (pageIndex: number) => {
        const { w: bookW, h: bookH } = sizeRef.current;
        if (!bookW || committingRef.current || pages.length === 0) {
          return;
        }
        const clamped = Math.max(0, Math.min(pages.length - 1, pageIndex));
        const targetSpread = singleRef.current
          ? clamped
          : Math.ceil(clamped / 2);
        const currentSpread = spreadRef.current;
        if (targetSpread === currentSpread) {
          return;
        }
        if (reduceMotion) {
          spreadRef.current = targetSpread;
          setSpread(targetSpread);
          onSpreadChangeRef.current?.(targetSpread, singleRef.current);
          return;
        }
        const dir: 1 | -1 = targetSpread > currentSpread ? 1 : -1;
        const corner: Pt = { x: dir === 1 ? 2 * bookW : 0, y: bookH };
        run(
          {
            dir,
            corner,
            at: { x: corner.x - dir * 1, y: corner.y - 1 },
            target: targetSpread,
          },
          { x: corner.x - dir * 2 * bookW, y: corner.y },
          true
        );
      },
    }),
    [pages.length, reduceMotion, run]
  );

  const canTurn = (dir: 1 | -1) =>
    dir === 1 ? spread < spreads - 1 : spread > 0;

  const go = (dir: 1 | -1) => {
    if (!(canTurn(dir) && size.w) || committingRef.current) {
      return;
    }
    if (reduceMotion) {
      const next = spread + dir;
      spreadRef.current = next;
      setSpread(next);
      onSpreadChangeRef.current?.(next, singleRef.current);
      return;
    }
    const corner = cornerFor(dir, size.h);
    run(
      { dir, corner, at: { x: corner.x - dir * 1, y: corner.y - 1 } },
      { x: corner.x - dir * 2 * size.w, y: corner.y },
      true
    );
  };

  const local = (event: PointerEvent): Pt => {
    const rect = bookRef.current?.getBoundingClientRect();
    return rect
      ? { x: event.clientX - rect.left, y: event.clientY - rect.top }
      : { x: 0, y: 0 };
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (
      (event.target as HTMLElement | null)?.closest(
        'a, button, [role="button"]'
      )
    ) {
      return;
    }
    if (event.button !== 0 || !size.w || committingRef.current) {
      return;
    }
    const p = local(event);
    const clientStart = { x: event.clientX, y: event.clientY };
    // On one page, its left third goes back and the rest turns forward.
    const backZone = single && p.x < size.w * 1.32;
    const dir: 1 | -1 = p.x >= size.w && !backZone ? 1 : -1;

    // For touch/pen, wait for axis lock before capturing pointer or starting turn
    if (event.pointerType !== "mouse") {
      pressRef.current = {
        start: p,
        clientStart,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        axis: "undecided",
        dir,
        dragging: false,
        back: single && dir === -1,
      };
      return;
    }

    if (!canTurn(dir)) {
      return;
    }
    if (reduceMotion) {
      go(dir);
      return;
    }
    stop();
    event.currentTarget.setPointerCapture(event.pointerId);
    pressRef.current = {
      start: p,
      clientStart,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      axis: "horizontal",
      dir,
      dragging: false,
      back: single && dir === -1,
    };
    if (single && dir === -1) {
      return;
    }
    const current = turnRef.current;
    const corner = current?.dir === dir ? current.corner : cornerFor(dir, p.y);
    setAt({ dir, corner, at: current?.dir === dir ? current.at : corner });
  };

  /** A corner near the pointer lifts a little, inviting the turn. */
  const peek = (p: Pt) => {
    const dir: 1 | -1 = p.x >= size.w ? 1 : -1;
    const corner = cornerFor(dir, p.y);
    const near = canTurn(dir) && len(sub(p, corner)) < PEEK_ZONE;
    const current = turnRef.current;
    if (!near) {
      if (current) {
        run(current, current.corner, false);
      }
      return;
    }
    stop();
    const toward = sub(p, corner);
    const l = Math.max(1, len(toward));
    const lift = Math.min(PEEK_MAX, l * 0.6 + 14);
    setAt({
      dir,
      corner,
      at: reach(
        {
          x: corner.x + (toward.x / l) * lift,
          y: corner.y + (toward.y / l) * lift,
        },
        corner
      ),
    });
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const p = local(event);
    const press = pressRef.current;

    if (press && press.pointerType !== "mouse") {
      const dx = event.clientX - press.clientStart.x;
      const dy = event.clientY - press.clientStart.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (press.axis === "undecided") {
        if (absDy > AXIS_LOCK_DISTANCE && absDy >= absDx) {
          // Vertical scroll gesture: cancel page flip immediately
          pressRef.current = null;
          if (turnRef.current) {
            setAt(null);
          }
          return;
        }
        if (absDx > absDy * SWIPE_AXIS_RATIO && absDx > AXIS_LOCK_DISTANCE) {
          press.axis = "horizontal";
          // Swipe direction overrides initial tap zone: swipe left = next (1), swipe right = prev (-1)
          const swipeDir: 1 | -1 = dx < 0 ? 1 : -1;
          if (!canTurn(swipeDir)) {
            pressRef.current = null;
            return;
          }
          press.dir = swipeDir;
          press.back = single && swipeDir === -1;
          press.dragging = true;
          stop();
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // Pointer capture may fail if browser already started pan-y
          }
          if (!press.back && !reduceMotion) {
            const corner = cornerFor(swipeDir, p.y);
            setAt({ dir: swipeDir, corner, at: reach(p, corner) });
          }
        }
        return;
      }

      if (press.axis === "horizontal" && !press.back && turnRef.current) {
        setAt({
          ...turnRef.current,
          at: reach(p, turnRef.current.corner),
        });
      }
      return;
    }

    const current = turnRef.current;
    if (press?.back) {
      press.dragging ||= len(sub(p, press.start)) >= DRAG_SLOP;
      return;
    }
    if (press && current) {
      if (!press.dragging && len(sub(p, press.start)) < DRAG_SLOP) {
        return;
      }
      press.dragging = true;
      setAt({ ...current, at: reach(p, current.corner) });
      return;
    }
    if (event.pointerType === "mouse" && !playingRef.current && !reduceMotion) {
      peek(p);
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const press = pressRef.current;
    const current = turnRef.current;
    pressRef.current = null;

    if (!press) {
      return;
    }

    if (press.pointerType !== "mouse") {
      const dx = event.clientX - press.clientStart.x;
      const dy = event.clientY - press.clientStart.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const isSwipe =
        press.axis === "horizontal" &&
        absDx > absDy * SWIPE_AXIS_RATIO &&
        absDx > SWIPE_THRESHOLD_PX;
      const isCleanTap =
        press.axis === "undecided" && Math.hypot(dx, dy) < AXIS_LOCK_DISTANCE;

      if (press.back) {
        if (isSwipe || (isCleanTap && canTurn(press.dir))) {
          go(press.dir);
        }
        return;
      }

      if (current) {
        const crossed =
          current.dir === 1 ? current.at.x < size.w : current.at.x > size.w;
        const complete = isSwipe || crossed;
        run(
          current,
          complete
            ? {
                x: current.corner.x - current.dir * 2 * size.w,
                y: current.corner.y,
              }
            : current.corner,
          complete
        );
        return;
      }

      if (isCleanTap && canTurn(press.dir)) {
        go(press.dir);
      }
      return;
    }

    if (press.back) {
      if (!press.dragging) {
        go(-1);
      }
      return;
    }
    if (!current) {
      return;
    }
    const crossed =
      current.dir === 1 ? current.at.x < size.w : current.at.x > size.w;
    const complete = press.dragging ? crossed : true;
    run(
      current,
      complete
        ? {
            x: current.corner.x - current.dir * 2 * size.w,
            y: current.corner.y,
          }
        : current.corner,
      complete
    );
  };

  const onPointerCancel = () => {
    pressRef.current = null;
    const current = turnRef.current;
    if (current && !playingRef.current) {
      run(current, current.corner, false);
    }
  };

  const onPointerLeave = () => {
    const current = turnRef.current;
    if (!pressRef.current && current && !playingRef.current) {
      run(current, current.corner, false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      go(event.key === "ArrowRight" ? 1 : -1);
    }
  };

  const fold = turn && size.w ? foldStyles(turn, size.w, size.h) : null;
  const activeLayers = single
    ? onePage(pages, spread, turn?.dir, turn?.target)
    : twoPages(pages, spread, turn?.dir, turn?.target);
  const {
    left,
    right,
    turning,
    back,
    leftIsCover,
    rightIsCover,
    turningIsCover,
    backIsCover,
  } = activeLayers;
  // A closed book sits centered: the cover alone, or the back alone.
  const shift = single ? 0 : centerShift(twoPages(pages, heading ?? spread));
  const first = single ? spread + 1 : Math.max(1, 2 * spread);
  const last = single ? spread + 1 : Math.min(pages.length, 2 * spread + 1);
  const turnProgress = fold?.progress ?? 0;

  return (
    <div
      className={cn(
        "flex w-full max-w-2xl flex-col items-center overflow-x-clip touch-pan-y",
        single && "mx-auto max-w-[360px] sm:max-w-[420px]",
        className
      )}
      ref={frameRef}
      style={{ touchAction: "pan-y" }}
    >
      <div
        className={cn(
          "relative shrink-0 rounded-md motion-reduce:transition-none",
          single
            ? "w-[200%] self-start shadow-[0_20px_42px_-14px_rgba(0,0,0,0.58)]"
            : "w-full shadow-[0_24px_48px_-14px_rgba(0,0,0,0.62)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        )}
        style={{ transform: `translateX(${single ? -50 : shift * 100}%)` }}
      >
        <div
          className="relative aspect-[3/2] w-full touch-pan-y select-none"
          onPointerCancel={onPointerCancel}
          onPointerDown={onPointerDown}
          onPointerLeave={onPointerLeave}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          ref={bookRef}
          style={{ touchAction: "pan-y" }}
        >
          {left !== undefined && (
            <Paper
              isCover={leftIsCover}
              side="left"
              turnProgress={turnProgress}
            >
              {left}
            </Paper>
          )}
          {right !== undefined && (
            <Paper
              isCover={rightIsCover}
              side="right"
              turnProgress={turnProgress}
            >
              {right}
            </Paper>
          )}
          {turn && fold && turning !== undefined && (
            <Paper
              isCover={turningIsCover}
              side={turn.dir === 1 ? "right" : "left"}
              style={fold.front}
              turnProgress={turnProgress}
            >
              {turning}
            </Paper>
          )}
          {turn && !fold && turning !== undefined && (
            <Paper
              isCover={turningIsCover}
              side={turn.dir === 1 ? "right" : "left"}
              turnProgress={turnProgress}
            >
              {turning}
            </Paper>
          )}
          {turn && fold && back !== undefined && back !== HIDDEN && (
            // The shadow sits on a wrapper: a clip on the same element would cut it off.
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                filter: `drop-shadow(0 ${2 + fold.progress * 8}px ${8 + fold.progress * 12}px rgb(0 0 0 / ${0.18 + Math.sin(Math.PI * fold.progress) * 0.22}))`,
              }}
            >
              <Paper
                back
                isCover={backIsCover}
                side={turn.dir === 1 ? "right" : "left"}
                style={fold.flap}
                turnProgress={turnProgress}
              >
                {back}
              </Paper>
            </div>
          )}

          {/* Subtle mobile edge tap zones for effortless one-tap page turns */}
          {single && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-1/2 flex w-1/2 justify-between"
            >
              <span
                className={cn(
                  "h-full w-8 bg-gradient-to-r from-white/[0.02] to-transparent",
                  spread === 0 && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "h-full w-8 bg-gradient-to-l from-white/[0.02] to-transparent",
                  spread === spreads - 1 && "opacity-0"
                )}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex w-full items-center justify-center gap-3 font-mono text-xs text-[var(--fg-muted)]">
        <NavButton
          disabled={spread === 0}
          label="Previous page"
          onClick={() => go(-1)}
          onKeyDown={onKeyDown}
          text="Prev"
        >
          <path d="M10 4 6 8l4 4" />
        </NavButton>
        <span
          aria-live="polite"
          className="min-w-24 text-center text-xs tabular-nums"
        >
          {first === last ? `${first}` : `${first}–${last}`} of {pages.length}
        </span>
        <NavButton
          disabled={spread === spreads - 1}
          label="Next page"
          onClick={() => go(1)}
          onKeyDown={onKeyDown}
          text="Next"
          trailingIcon
        >
          <path d="m6 4 4 4-4 4" />
        </NavButton>
      </div>
    </div>
  );
}

function Paper({
  side,
  back = false,
  isCover = false,
  turnProgress = 0,
  style,
  children,
}: {
  side: "left" | "right";
  back?: boolean;
  isCover?: boolean;
  turnProgress?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  // Deepen the inner spine shadow naturally as the page rotates through 45°–90°
  const midTurnAngle = Math.sin(Math.PI * turnProgress);
  const spineShadowOpacity = Math.min(0.68, 0.32 + midTurnAngle * 0.28);

  return (
    <div
      className={cn(
        "@container absolute top-0 h-full w-1/2 origin-top-left overflow-hidden text-[var(--fg-primary)]",
        isCover
          ? "bg-[var(--bg-elevated)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_1px_0_0_rgba(255,255,255,0.08)]"
          : back
            ? "bg-[var(--bg-elevated)]/95"
            : "bg-[var(--bg-surface)]",
        side === "left" ? "left-0 rounded-l-md" : "left-1/2 rounded-r-md",
        "ring-1 ring-[var(--line-border)]"
      )}
      style={{
        backfaceVisibility: "hidden",
        ...style,
      }}
    >
      {/* The back of a page reads the right way round once it's folded over. */}
      <div
        className={cn("relative size-full", back && "-scale-x-100")}
        style={{ backfaceVisibility: "hidden" }}
      >
        <div className="size-full">{children}</div>

        {/* Cover lighting: subtle outer bevel & top-left ambient sheen, NO inner gutter crease */}
        {isCover ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.025) 38%, transparent 68%, rgba(0, 0, 0, 0.16) 100%)",
            }}
          />
        ) : (
          /* Inner page lighting: matte surface + spine/gutter shadow anchored strictly to binding edge */
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-y-0 w-[12%]",
              /* Inside the un-mirrored container, when `back` is true, a right page has flipped to the left so its binding edge is now on the right (`right-0`), and a left page flipped to the right has its binding edge on the left (`left-0`). */
              (back ? side === "right" : side === "left")
                ? "right-0"
                : "left-0"
            )}
            style={{
              background: (back ? side === "right" : side === "left")
                ? `linear-gradient(to left, rgba(0, 0, 0, ${spineShadowOpacity.toFixed(3)}) 0%, rgba(0, 0, 0, ${(spineShadowOpacity * 0.38).toFixed(3)}) 45%, transparent 100%)`
                : `linear-gradient(to right, rgba(0, 0, 0, ${spineShadowOpacity.toFixed(3)}) 0%, rgba(0, 0, 0, ${(spineShadowOpacity * 0.38).toFixed(3)}) 45%, transparent 100%)`,
            }}
          />
        )}
      </div>
    </div>
  );
}

function NavButton({
  children,
  label,
  text,
  trailingIcon = false,
  disabled,
  onClick,
  onKeyDown,
}: {
  children: ReactNode;
  label: string;
  text: string;
  trailingIcon?: boolean;
  disabled: boolean;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      aria-disabled={disabled || undefined}
      aria-label={label}
      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-[var(--bg-surface)]/90 px-4 py-2 font-mono text-xs text-[var(--fg-muted)] ring-1 ring-[var(--line-border)] transition-colors duration-150 ease-out hover:bg-[var(--bg-elevated)] hover:text-[var(--fg-primary)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--accent)] aria-disabled:cursor-default aria-disabled:opacity-35 aria-disabled:hover:bg-[var(--bg-surface)]/90 aria-disabled:hover:text-[var(--fg-muted)] sm:min-h-[38px] sm:px-3.5"
      onClick={disabled ? undefined : onClick}
      onKeyDown={onKeyDown}
      type="button"
    >
      {!trailingIcon && (
        <svg
          aria-hidden="true"
          className="size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          viewBox="0 0 16 16"
        >
          {children}
        </svg>
      )}
      <span>{text}</span>
      {trailingIcon && (
        <svg
          aria-hidden="true"
          className="size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          viewBox="0 0 16 16"
        >
          {children}
        </svg>
      )}
    </button>
  );
}
