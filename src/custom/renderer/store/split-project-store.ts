import { create } from 'zustand'
import type { SplitOrientation, SplitProjectState } from '../../shared/multi-project-types'

const LOCAL_STORAGE_KEY = 'myorca:split-project-state'

function loadSavedSplitState(): Partial<SplitProjectState> | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: parsing persisted split state from local storage
      return JSON.parse(raw) as Partial<SplitProjectState>
    }
  } catch {
    // Ignore storage parse error
  }
  return null
}

function persistSplitState(state: SplitProjectState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage write error
  }
}

type SplitProjectStore = {
  splitState: SplitProjectState
  activeFocusedPane: 'primary' | 'secondary'
  enableSplit: (primaryId: string, secondaryId: string, orientation?: SplitOrientation) => void
  closeSplit: () => void
  toggleOrientation: () => void
  setRatio: (ratio: number) => void
  swapProjects: () => void
  setActiveFocusedPane: (pane: 'primary' | 'secondary') => void
}

const saved = loadSavedSplitState()

const initialSplitState: SplitProjectState = {
  active: false,
  primaryWorktreeId: null,
  secondaryWorktreeId: null,
  orientation: saved?.orientation ?? 'horizontal',
  ratio: saved?.ratio ?? 50
}

export const useSplitProjectStore = create<SplitProjectStore>((set, get) => ({
  splitState: initialSplitState,
  activeFocusedPane: 'primary',

  enableSplit: (primaryId, secondaryId, orientation = 'horizontal') => {
    const nextState: SplitProjectState = {
      active: true,
      primaryWorktreeId: primaryId,
      secondaryWorktreeId: secondaryId,
      orientation: orientation ?? get().splitState.orientation,
      ratio: get().splitState.ratio || 50
    }
    persistSplitState(nextState)
    set({ splitState: nextState, activeFocusedPane: 'secondary' })
  },

  closeSplit: () => {
    const nextState: SplitProjectState = {
      ...get().splitState,
      active: false,
      secondaryWorktreeId: null
    }
    persistSplitState(nextState)
    set({ splitState: nextState, activeFocusedPane: 'primary' })
  },

  toggleOrientation: () => {
    const current = get().splitState
    const nextOrientation: SplitOrientation =
      current.orientation === 'horizontal' ? 'vertical' : 'horizontal'
    const nextState: SplitProjectState = {
      ...current,
      orientation: nextOrientation
    }
    persistSplitState(nextState)
    set({ splitState: nextState })
  },

  setRatio: (ratio) => {
    const clamped = Math.min(80, Math.max(20, Math.round(ratio)))
    const nextState: SplitProjectState = {
      ...get().splitState,
      ratio: clamped
    }
    persistSplitState(nextState)
    set({ splitState: nextState })
  },

  swapProjects: () => {
    const current = get().splitState
    if (!current.primaryWorktreeId || !current.secondaryWorktreeId) {
      return
    }
    const nextState: SplitProjectState = {
      ...current,
      primaryWorktreeId: current.secondaryWorktreeId,
      secondaryWorktreeId: current.primaryWorktreeId
    }
    persistSplitState(nextState)
    set({
      splitState: nextState,
      activeFocusedPane: get().activeFocusedPane === 'primary' ? 'secondary' : 'primary'
    })
  },

  setActiveFocusedPane: (pane) => {
    set({ activeFocusedPane: pane })
  }
}))
