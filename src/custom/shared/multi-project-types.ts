/**
 * Types for MyOrca multi-project split and multi-window features.
 */

export type SplitOrientation = 'horizontal' | 'vertical'

export type SplitProjectState = {
  active: boolean
  primaryWorktreeId: string | null
  secondaryWorktreeId: string | null
  orientation: SplitOrientation
  ratio: number // 20 to 80 (percentage)
}

export type ProjectWindowInfo = {
  worktreeId: string
  windowId: number
  displayId: number
  title: string
}
