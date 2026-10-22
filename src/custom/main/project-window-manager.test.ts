import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockBrowserWindowInstances: {
  id: number
  destroyed: boolean
  minimized: boolean
  focused: boolean
  title: string
  bounds: { x: number; y: number; width: number; height: number }
  webContents: {
    destroyed: boolean
    send: ReturnType<typeof vi.fn>
    session: {
      setPermissionRequestHandler: ReturnType<typeof vi.fn>
      setPermissionCheckHandler: ReturnType<typeof vi.fn>
    }
  }
  isDestroyed: () => boolean
  isMinimized: () => boolean
  restore: () => void
  focus: () => void
  close: () => void
  getTitle: () => string
  getBounds: () => { x: number; y: number; width: number; height: number }
  setBounds: (b: { x: number; y: number; width: number; height: number }) => void
  once: (event: string, cb: () => void) => void
  on: (event: string, cb: () => void) => void
  loadURL: ReturnType<typeof vi.fn>
  loadFile: ReturnType<typeof vi.fn>
}[] = []

let nextWindowId = 1

vi.mock('electron', () => {
  return {
    app: {
      isPackaged: false
    },
    screen: {
      getAllDisplays: () => [
        {
          id: 1,
          workArea: { x: 0, y: 0, width: 1920, height: 1080 }
        },
        {
          id: 2,
          workArea: { x: 1920, y: 0, width: 1920, height: 1080 }
        }
      ],
      getPrimaryDisplay: () => ({
        id: 1,
        workArea: { x: 0, y: 0, width: 1920, height: 1080 }
      }),
      getDisplayMatching: (bounds: { x: number }) => {
        return bounds.x >= 1920
          ? { id: 2, workArea: { x: 1920, y: 0, width: 1920, height: 1080 } }
          : { id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1080 } }
      }
    },
    nativeTheme: { shouldUseDarkColors: true },
    BrowserWindow: class MockBrowserWindow {
      id = nextWindowId++
      destroyed = false
      minimized = false
      focused = false
      title = ''
      bounds = { x: 0, y: 0, width: 1200, height: 800 }
      webContents = {
        destroyed: false,
        isDestroyed: () => false,
        send: vi.fn(),
        session: {
          setPermissionRequestHandler: vi.fn(),
          setPermissionCheckHandler: vi.fn()
        }
      }

      constructor(opts: {
        title?: string
        x?: number
        y?: number
        width?: number
        height?: number
      }) {
        this.title = opts.title ?? ''
        this.bounds = {
          x: opts.x ?? 0,
          y: opts.y ?? 0,
          width: opts.width ?? 1200,
          height: opts.height ?? 800
        }
        mockBrowserWindowInstances.push(this)
      }

      isDestroyed() {
        return this.destroyed
      }
      isMinimized() {
        return this.minimized
      }
      restore() {
        this.minimized = false
      }
      focus() {
        this.focused = true
      }
      close() {
        this.destroyed = true
      }
      getTitle() {
        return this.title
      }
      getBounds() {
        return this.bounds
      }
      setBounds(b: { x: number; y: number; width: number; height: number }) {
        this.bounds = b
      }
      once() {}
      on() {}
      loadURL = vi.fn().mockResolvedValue(undefined)
      loadFile = vi.fn().mockResolvedValue(undefined)
    }
  }
})

vi.mock('../../main/window/foreground-activation-policy', () => ({
  isBackgroundLaunch: () => false,
  showWindowWithoutStealingFocus: vi.fn()
}))

vi.mock('../../main/window/privileged-window-navigation', () => ({
  installPrivilegedWindowNavigationPolicy: vi.fn()
}))

import {
  broadcastToProjectWindows,
  closeProjectWindow,
  getDisplaysCount,
  listOpenProjectWindows,
  moveToNextDisplay,
  openProjectWindow
} from './project-window-manager'

describe('project-window-manager', () => {
  beforeEach(() => {
    mockBrowserWindowInstances.length = 0
  })

  it('reports display count', () => {
    expect(getDisplaysCount()).toBe(2)
  })

  it('opens a project window on secondary monitor when multiple displays exist', () => {
    const win = openProjectWindow('wt-1', 'Project Alpha')
    expect(win).toBeDefined()
    expect(listOpenProjectWindows()).toHaveLength(1)
    expect(listOpenProjectWindows()[0].worktreeId).toBe('wt-1')
    // Placed on display 2 (x >= 1920)
    expect(win.getBounds().x).toBeGreaterThanOrEqual(1920)
  })

  it('focuses existing window on duplicate open', () => {
    const first = openProjectWindow('wt-duplicate', 'Project Alpha')
    const second = openProjectWindow('wt-duplicate', 'Project Alpha')
    expect(first).toBe(second)
  })

  it('moves window to next display when requested', () => {
    openProjectWindow('wt-move', 'Project Move')
    const moved = moveToNextDisplay('wt-move')
    expect(moved).toBe(true)
  })

  it('broadcasts messages to all open project windows', () => {
    openProjectWindow('wt-broadcast-1')
    openProjectWindow('wt-broadcast-2')
    broadcastToProjectWindows('pty:data', { test: true })
    expect(mockBrowserWindowInstances[0].webContents.send).toHaveBeenCalledWith('pty:data', {
      test: true
    })
  })

  it('closes a project window cleanly', () => {
    openProjectWindow('wt-close')
    const closed = closeProjectWindow('wt-close')
    expect(closed).toBe(true)
  })
})
