import { ipcRenderer } from 'electron'
import type { ProjectWindowInfo } from '../shared/multi-project-types'

export const myorcaPreloadApi = {
  openProjectWindow: async (worktreeId: string, title?: string): Promise<boolean> => {
    return ipcRenderer.invoke('myorca:open-project-window', { worktreeId, title })
  },
  closeProjectWindow: async (worktreeId: string): Promise<boolean> => {
    return ipcRenderer.invoke('myorca:close-project-window', { worktreeId })
  },
  moveToNextDisplay: async (worktreeId: string): Promise<boolean> => {
    return ipcRenderer.invoke('myorca:move-to-next-display', { worktreeId })
  },
  getProjectWindows: async (): Promise<ProjectWindowInfo[]> => {
    return ipcRenderer.invoke('myorca:get-project-windows')
  },
  getDisplaysCount: async (): Promise<number> => {
    return ipcRenderer.invoke('myorca:get-displays-count')
  },
  isProjectWindow: (): boolean => {
    if (typeof window === 'undefined') {
      return false
    }
    const params = new URLSearchParams(window.location.search)
    return params.get('projectWindow') === 'true'
  },
  getInitialWorkspaceId: (): string | null => {
    if (typeof window === 'undefined') {
      return null
    }
    const params = new URLSearchParams(window.location.search)
    return params.get('workspaceId')
  },
  getInitialWindowTitle: (): string | null => {
    if (typeof window === 'undefined') {
      return null
    }
    const params = new URLSearchParams(window.location.search)
    return params.get('title')
  }
}

export type MyOrcaPreloadApi = typeof myorcaPreloadApi
