import { createContext, useContext } from 'react'

export type ItemPhase =
  | 'idle'
  | 'typing'
  | 'typed'
  | 'materializing'
  | 'rendered'

export interface ItemRevealState {
  phase: ItemPhase
  progress: number
}

export interface RevealSectionContextValue {
  manualInspect: boolean
  prefersReducedMotion: boolean
  getItemState: (id: string) => ItemRevealState
  subscribeItem: (id: string, listener: () => void) => () => void
  registerItem: (
    id: string,
    element: HTMLElement,
    deferToViewport?: boolean
  ) => () => void
}

const DEFAULT_ITEM_STATE: ItemRevealState = {
  phase: 'idle',
  progress: 0,
}

export const RevealSectionContext = createContext<RevealSectionContextValue>({
  manualInspect: false,
  prefersReducedMotion: false,
  getItemState: () => DEFAULT_ITEM_STATE,
  subscribeItem: () => () => {},
  registerItem: () => () => {},
})

/**
 * Subscribes a `CodeRevealItem` to its parent `RevealSection`'s per-item
 * lifecycle registry and manual source-inspection state.
 */
export function useRevealSection(): RevealSectionContextValue {
  return useContext(RevealSectionContext)
}
