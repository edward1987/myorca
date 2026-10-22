import React, { useEffect, useMemo } from 'react'
import { useAppStore } from '@/store'
import { useSplitProjectStore } from '../store/split-project-store'
import { SplitProjectDivider } from './SplitProjectDivider'

type SplitWorkspaceSurfaceManagerProps = {
  controller: {
    activeView: string
    mountedWorktreeIdsRef: React.MutableRefObject<Set<string>>
    renderedActiveWorktreeId: string | null
    workspaceSurfaces: readonly { id: string; path: string }[]
  }
  renderSurface: (workspaceId: string, isVisible: boolean) => React.ReactNode
}

export function SplitWorkspaceSurfaceManager({
  controller,
  renderSurface
}: SplitWorkspaceSurfaceManagerProps): React.JSX.Element {
  const { activeView, mountedWorktreeIdsRef, renderedActiveWorktreeId, workspaceSurfaces } =
    controller

  const splitState = useSplitProjectStore((s) => s.splitState)
  const activeFocusedPane = useSplitProjectStore((s) => s.activeFocusedPane)
  const setActiveFocusedPane = useSplitProjectStore((s) => s.setActiveFocusedPane)
  const setRatio = useSplitProjectStore((s) => s.setRatio)
  const closeSplit = useSplitProjectStore((s) => s.closeSplit)

  const worktreesByRepo = useAppStore((s) => s.worktreesByRepo)
  const folderWorkspaces = useAppStore((s) => s.folderWorkspaces)

  const allWorktreeNames = useMemo(() => {
    const names = new Map<string, string>()
    for (const repoId of Object.keys(worktreesByRepo)) {
      const repoWorktrees = worktreesByRepo[repoId]
      if (repoWorktrees) {
        for (const wt of repoWorktrees) {
          names.set(wt.id, wt.displayName || wt.path.split(/[/\\]/).pop() || wt.id)
        }
      }
    }
    for (const folderId of Object.keys(folderWorkspaces)) {
      const fw = folderWorkspaces[folderId]
      if (fw) {
        names.set(fw.id, fw.name || fw.folderPath.split(/[/\\]/).pop() || fw.id)
      }
    }
    return names
  }, [worktreesByRepo, folderWorkspaces])

  const primaryId = splitState.primaryWorktreeId ?? renderedActiveWorktreeId
  const secondaryId = splitState.secondaryWorktreeId

  // Mount secondary workspace in controller if split is active
  useEffect(() => {
    if (splitState.active && secondaryId) {
      if (!mountedWorktreeIdsRef.current.has(secondaryId)) {
        mountedWorktreeIdsRef.current.add(secondaryId)
      }
    }
  }, [splitState.active, secondaryId, mountedWorktreeIdsRef])

  // Safety check: if secondary workspace was removed, close split
  useEffect(() => {
    if (splitState.active && secondaryId) {
      const exists = workspaceSurfaces.some((ws) => ws.id === secondaryId)
      if (!exists && workspaceSurfaces.length > 0) {
        closeSplit()
      }
    }
  }, [splitState.active, secondaryId, workspaceSurfaces, closeSplit])

  const isSplitMode = Boolean(
    splitState.active &&
    primaryId &&
    secondaryId &&
    primaryId !== secondaryId &&
    workspaceSurfaces.some((ws) => ws.id === secondaryId)
  )

  const isHorizontal = splitState.orientation === 'horizontal'
  const ratio = splitState.ratio

  const handlePaneClick = (pane: 'primary' | 'secondary', worktreeId: string): void => {
    setActiveFocusedPane(pane)
    if (renderedActiveWorktreeId !== worktreeId) {
      useAppStore.getState().setActiveWorktree(worktreeId)
    }
  }

  if (!isSplitMode) {
    // Normal single-project rendering
    return (
      <div className="relative flex-1 min-w-0 min-h-0 w-full h-full overflow-hidden">
        {workspaceSurfaces
          .filter((workspace) => mountedWorktreeIdsRef.current.has(workspace.id))
          .map((workspace) => {
            const isVisible = activeView === 'terminal' && workspace.id === renderedActiveWorktreeId
            return (
              <div key={workspace.id} className="absolute inset-0 flex">
                {renderSurface(workspace.id, isVisible)}
              </div>
            )
          })}
      </div>
    )
  }

  // Split-project dual pane rendering
  const primaryName = (primaryId ? allWorktreeNames.get(primaryId) : null) ?? 'Primary'
  const secondaryName = (secondaryId ? allWorktreeNames.get(secondaryId) : null) ?? 'Secondary'

  return (
    <div className="relative flex-1 min-w-0 min-h-0 w-full h-full overflow-hidden select-none">
      {/* Pane 1: Primary Project */}
      <div
        className={`absolute overflow-hidden flex flex-col border-border transition-[box-shadow] ${
          isHorizontal ? 'border-r' : 'border-b'
        } ${
          activeFocusedPane === 'primary'
            ? 'ring-1 ring-primary/40 z-10'
            : 'opacity-95 hover:opacity-100 z-0'
        }`}
        style={{
          left: '0',
          top: '0',
          width: isHorizontal ? `${ratio}%` : '100%',
          height: isHorizontal ? '100%' : `${ratio}%`
        }}
        onClick={() => primaryId && handlePaneClick('primary', primaryId)}
      >
        <div
          className={`flex items-center justify-between px-2.5 py-1 text-[11px] font-medium border-b shrink-0 cursor-pointer ${
            activeFocusedPane === 'primary'
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted/70'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="truncate">{primaryName}</span>
          </div>
          <span className="text-[10px] opacity-70">
            {activeFocusedPane === 'primary' ? 'Focused' : 'Click to focus'}
          </span>
        </div>
        <div className="relative flex-1 min-w-0 min-h-0 overflow-hidden">
          {primaryId && renderSurface(primaryId, activeView === 'terminal')}
        </div>
      </div>

      {/* Resizable Draggable Divider */}
      <SplitProjectDivider
        orientation={splitState.orientation}
        ratio={ratio}
        onRatioChange={setRatio}
        onReset={() => setRatio(50)}
      />

      {/* Pane 2: Secondary Project */}
      <div
        className={`absolute overflow-hidden flex flex-col border-border transition-[box-shadow] ${
          activeFocusedPane === 'secondary'
            ? 'ring-1 ring-primary/40 z-10'
            : 'opacity-95 hover:opacity-100 z-0'
        }`}
        style={{
          left: isHorizontal ? `${ratio}%` : '0',
          top: isHorizontal ? '0' : `${ratio}%`,
          width: isHorizontal ? `${100 - ratio}%` : '100%',
          height: isHorizontal ? '100%' : `${100 - ratio}%`
        }}
        onClick={() => secondaryId && handlePaneClick('secondary', secondaryId)}
      >
        <div
          className={`flex items-center justify-between px-2.5 py-1 text-[11px] font-medium border-b shrink-0 cursor-pointer ${
            activeFocusedPane === 'secondary'
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted/70'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-foreground/60" />
            <span className="truncate">{secondaryName}</span>
          </div>
          <span className="text-[10px] opacity-70">
            {activeFocusedPane === 'secondary' ? 'Focused' : 'Click to focus'}
          </span>
        </div>
        <div className="relative flex-1 min-w-0 min-h-0 overflow-hidden">
          {secondaryId && renderSurface(secondaryId, activeView === 'terminal')}
        </div>
      </div>

      {/* Retained surfaces for hidden background worktrees */}
      {workspaceSurfaces
        .filter(
          (ws) =>
            ws.id !== primaryId && ws.id !== secondaryId && mountedWorktreeIdsRef.current.has(ws.id)
        )
        .map((ws) => (
          <div key={ws.id} className="absolute inset-0 hidden">
            {renderSurface(ws.id, false)}
          </div>
        ))}
    </div>
  )
}
