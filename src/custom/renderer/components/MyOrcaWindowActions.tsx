import React, { useMemo } from 'react'
import { ArrowLeftRight, Columns2, Monitor, Rows2, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppStore } from '@/store'
import { useSplitProjectStore } from '../store/split-project-store'

export function MyOrcaWindowActions(): React.JSX.Element | null {
  const activeWorktreeId = useAppStore((s) => s.activeWorktreeId)
  const worktreesByRepo = useAppStore((s) => s.worktreesByRepo)
  const folderWorkspaces = useAppStore((s) => s.folderWorkspaces)
  const isProjectWindow =
    typeof window !== 'undefined' && Boolean(window.myorca?.isProjectWindow?.())

  const splitState = useSplitProjectStore((s) => s.splitState)
  const enableSplit = useSplitProjectStore((s) => s.enableSplit)
  const closeSplit = useSplitProjectStore((s) => s.closeSplit)
  const toggleOrientation = useSplitProjectStore((s) => s.toggleOrientation)
  const swapProjects = useSplitProjectStore((s) => s.swapProjects)

  // Collect all available project candidates
  const allProjects = useMemo(() => {
    const list: { id: string; name: string; path: string }[] = []
    for (const repoId of Object.keys(worktreesByRepo)) {
      const repoWorktrees = worktreesByRepo[repoId]
      if (repoWorktrees) {
        for (const wt of repoWorktrees) {
          list.push({
            id: wt.id,
            name: wt.displayName || wt.path.split(/[/\\]/).pop() || wt.id,
            path: wt.path
          })
        }
      }
    }
    for (const folderId of Object.keys(folderWorkspaces)) {
      const fw = folderWorkspaces[folderId]
      if (fw) {
        list.push({
          id: fw.id,
          name: fw.name || fw.folderPath.split(/[/\\]/).pop() || fw.id,
          path: fw.folderPath
        })
      }
    }
    return list
  }, [worktreesByRepo, folderWorkspaces])

  const otherProjects = useMemo(() => {
    return allProjects.filter((p) => p.id !== activeWorktreeId)
  }, [allProjects, activeWorktreeId])

  const currentProjectName = useMemo(() => {
    return allProjects.find((p) => p.id === activeWorktreeId)?.name ?? 'Current Project'
  }, [allProjects, activeWorktreeId])

  const handleOpenInNewWindow = async (targetId?: string): Promise<void> => {
    const idToOpen = targetId ?? activeWorktreeId
    if (!idToOpen || !window.myorca) {
      return
    }
    const project = allProjects.find((p) => p.id === idToOpen)
    await window.myorca.openProjectWindow(idToOpen, project?.name)
  }

  const handleMoveToNextDisplay = async (): Promise<void> => {
    if (!activeWorktreeId || !window.myorca) {
      return
    }
    await window.myorca.moveToNextDisplay(activeWorktreeId)
  }

  // If this window is already a secondary project window on another monitor:
  if (isProjectWindow) {
    return (
      <div
        className="flex items-center gap-1 mr-2"
        // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: WebkitAppRegion is non-standard Electron CSS property
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="titlebar-icon-button flex items-center gap-1.5 px-2 text-xs bg-primary/10 text-primary rounded"
              onClick={handleMoveToNextDisplay}
            >
              <Monitor size={13} />
              <span>Next Monitor</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            Move this project window to next monitor
          </TooltipContent>
        </Tooltip>
      </div>
    )
  }

  // Normal window mode
  return (
    <div
      className="flex items-center gap-1 mr-2"
      // oxlint-disable-next-line typescript/consistent-type-assertions -- SAFETY: WebkitAppRegion is non-standard Electron CSS property
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {splitState.active ? (
        <div className="flex items-center gap-1 bg-secondary/50 rounded px-1.5 py-0.5 border border-border/50">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Split View</span>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="titlebar-icon-button p-1"
                onClick={swapProjects}
                aria-label="Swap split projects"
              >
                <ArrowLeftRight size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              Swap left and right projects
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="titlebar-icon-button p-1"
                onClick={toggleOrientation}
                aria-label="Toggle split orientation"
              >
                {splitState.orientation === 'horizontal' ? (
                  <Rows2 size={13} />
                ) : (
                  <Columns2 size={13} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              {splitState.orientation === 'horizontal'
                ? 'Switch to stacked split (vertical)'
                : 'Switch to side-by-side split (horizontal)'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="titlebar-icon-button p-1 hover:text-destructive"
                onClick={closeSplit}
                aria-label="Close split view"
              >
                <X size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              Close split view
            </TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="titlebar-icon-button"
                  aria-label="Split window with project"
                >
                  <Columns2 size={14} />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              Split window with another project
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Split View with Project</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {otherProjects.length === 0 ? (
              <div className="px-2 py-2 text-xs text-muted-foreground">
                No other open projects found. Open another project first to split.
              </div>
            ) : (
              otherProjects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => {
                    if (activeWorktreeId) {
                      enableSplit(activeWorktreeId, project.id, 'horizontal')
                    }
                  }}
                  className="cursor-pointer"
                >
                  <Columns2 size={13} className="mr-2 opacity-70" />
                  <span className="truncate">{project.name}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Multi-Window: Open Project on Monitor 2 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="titlebar-icon-button"
            onClick={() => handleOpenInNewWindow()}
            aria-label="Open project in new window on another monitor"
            disabled={!activeWorktreeId}
          >
            <Monitor size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          Open {currentProjectName} in separate window (Monitor 2)
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
