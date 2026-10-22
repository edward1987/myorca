import { beforeEach, describe, expect, it } from 'vitest'
import { useSplitProjectStore } from './split-project-store'

describe('useSplitProjectStore', () => {
  beforeEach(() => {
    useSplitProjectStore.getState().closeSplit()
  })

  it('initializes with inactive split state', () => {
    const state = useSplitProjectStore.getState().splitState
    expect(state.active).toBe(false)
    expect(state.secondaryWorktreeId).toBeNull()
  })

  it('enables split between primary and secondary project', () => {
    useSplitProjectStore.getState().enableSplit('project-1', 'project-2', 'horizontal')
    const state = useSplitProjectStore.getState().splitState
    expect(state.active).toBe(true)
    expect(state.primaryWorktreeId).toBe('project-1')
    expect(state.secondaryWorktreeId).toBe('project-2')
    expect(state.orientation).toBe('horizontal')
    expect(state.ratio).toBe(50)
  })

  it('toggles orientation between horizontal and vertical', () => {
    useSplitProjectStore.getState().enableSplit('project-1', 'project-2', 'horizontal')
    useSplitProjectStore.getState().toggleOrientation()
    expect(useSplitProjectStore.getState().splitState.orientation).toBe('vertical')

    useSplitProjectStore.getState().toggleOrientation()
    expect(useSplitProjectStore.getState().splitState.orientation).toBe('horizontal')
  })

  it('clamps ratio between 20 and 80', () => {
    useSplitProjectStore.getState().enableSplit('project-1', 'project-2')
    useSplitProjectStore.getState().setRatio(95)
    expect(useSplitProjectStore.getState().splitState.ratio).toBe(80)

    useSplitProjectStore.getState().setRatio(10)
    expect(useSplitProjectStore.getState().splitState.ratio).toBe(20)

    useSplitProjectStore.getState().setRatio(65)
    expect(useSplitProjectStore.getState().splitState.ratio).toBe(65)
  })

  it('swaps primary and secondary projects', () => {
    useSplitProjectStore.getState().enableSplit('project-1', 'project-2')
    useSplitProjectStore.getState().swapProjects()
    const state = useSplitProjectStore.getState().splitState
    expect(state.primaryWorktreeId).toBe('project-2')
    expect(state.secondaryWorktreeId).toBe('project-1')
  })

  it('closes split cleanly', () => {
    useSplitProjectStore.getState().enableSplit('project-1', 'project-2')
    useSplitProjectStore.getState().closeSplit()
    const state = useSplitProjectStore.getState().splitState
    expect(state.active).toBe(false)
    expect(state.secondaryWorktreeId).toBeNull()
  })
})
