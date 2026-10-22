import { useEffect } from 'react'
import { useAppStore } from '@/store'

export function useProjectWindowMode(): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.myorca) {
      return undefined
    }

    if (!window.myorca.isProjectWindow()) {
      return undefined
    }

    const initialWorkspaceId = window.myorca.getInitialWorkspaceId()
    const initialTitle = window.myorca.getInitialWindowTitle()

    document.title = initialTitle ? `MyOrca - ${initialTitle}` : 'MyOrca Project Window'

    if (initialWorkspaceId) {
      // Delay slightly to let catalog hydration run, then enforce workspace activation
      const timer = setTimeout(() => {
        const currentActive = useAppStore.getState().activeWorktreeId
        if (currentActive !== initialWorkspaceId) {
          useAppStore.getState().setActiveWorktree(initialWorkspaceId)
        }
      }, 100)

      return () => clearTimeout(timer)
    }

    return undefined
  }, [])
}
