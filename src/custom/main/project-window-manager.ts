import { app, BrowserWindow, nativeTheme, screen } from 'electron'
import { join } from 'node:path'
import {
  isBackgroundLaunch,
  showWindowWithoutStealingFocus
} from '../../main/window/foreground-activation-policy'
import { installPrivilegedWindowNavigationPolicy } from '../../main/window/privileged-window-navigation'
import type { ProjectWindowInfo } from '../shared/multi-project-types'

const projectWindows = new Map<string, BrowserWindow>()

export function getProjectWindows(): Map<string, BrowserWindow> {
  return projectWindows
}

export function broadcastToProjectWindows(channel: string, payload: unknown): void {
  for (const window of projectWindows.values()) {
    if (
      !window.isDestroyed() &&
      (typeof window.webContents.isDestroyed !== 'function' || !window.webContents.isDestroyed())
    ) {
      window.webContents.send(channel, payload)
    }
  }
}

export function getDisplaysCount(): number {
  return screen.getAllDisplays().length
}

export function openProjectWindow(worktreeId: string, title?: string): BrowserWindow {
  const existing = projectWindows.get(worktreeId)
  if (existing && !existing.isDestroyed()) {
    if (existing.isMinimized()) {
      existing.restore()
    }
    if (!isBackgroundLaunch()) {
      existing.focus()
    }
    return existing
  }

  const displays = screen.getAllDisplays()
  const primaryDisplay = screen.getPrimaryDisplay()
  const secondaryDisplay = displays.find((d) => d.id !== primaryDisplay.id) ?? primaryDisplay

  // Place on secondary display if available, else cascade on primary
  const targetWorkArea = secondaryDisplay.workArea
  const width = Math.min(1280, Math.round(targetWorkArea.width * 0.85))
  const height = Math.min(860, Math.round(targetWorkArea.height * 0.85))
  const x = Math.round(targetWorkArea.x + (targetWorkArea.width - width) / 2)
  const y = Math.round(targetWorkArea.y + (targetWorkArea.height - height) / 2)

  const window = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 700,
    minHeight: 500,
    title: title ? `MyOrca - ${title}` : 'MyOrca Project Window',
    show: false,
    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0a0a0a' : '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      webviewTag: false
    }
  })

  projectWindows.set(worktreeId, window)

  installPrivilegedWindowNavigationPolicy(window.webContents)

  window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) =>
    callback(false)
  )
  window.webContents.session.setPermissionCheckHandler(() => false)

  window.once('ready-to-show', () => {
    showWindowWithoutStealingFocus(window)
  })

  window.on('closed', () => {
    projectWindows.delete(worktreeId)
  })

  const queryParams = new URLSearchParams({
    workspaceId: worktreeId,
    projectWindow: 'true',
    title: title ?? ''
  }).toString()

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(`${process.env.ELECTRON_RENDERER_URL}/index.html?${queryParams}`)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'), {
      search: queryParams
    })
  }

  return window
}

export function closeProjectWindow(worktreeId: string): boolean {
  const window = projectWindows.get(worktreeId)
  if (window && !window.isDestroyed()) {
    window.close()
    projectWindows.delete(worktreeId)
    return true
  }
  return false
}

export function moveToNextDisplay(worktreeId: string): boolean {
  const window = projectWindows.get(worktreeId)
  if (!window || window.isDestroyed()) {
    return false
  }

  const displays = screen.getAllDisplays()
  if (displays.length <= 1) {
    return false
  }

  const currentBounds = window.getBounds()
  const currentDisplay = screen.getDisplayMatching(currentBounds)
  const currentIndex = displays.findIndex((d) => d.id === currentDisplay.id)
  const nextDisplay = displays[(currentIndex + 1) % displays.length]

  const { x, y, width, height } = nextDisplay.workArea
  const targetWidth = Math.min(currentBounds.width, width)
  const targetHeight = Math.min(currentBounds.height, height)
  const targetX = Math.round(x + (width - targetWidth) / 2)
  const targetY = Math.round(y + (height - targetHeight) / 2)

  window.setBounds({
    x: targetX,
    y: targetY,
    width: targetWidth,
    height: targetHeight
  })

  return true
}

export function listOpenProjectWindows(): ProjectWindowInfo[] {
  const results: ProjectWindowInfo[] = []
  for (const [worktreeId, window] of projectWindows.entries()) {
    if (!window.isDestroyed()) {
      const bounds = window.getBounds()
      const display = screen.getDisplayMatching(bounds)
      results.push({
        worktreeId,
        windowId: window.id,
        displayId: display.id,
        title: window.getTitle()
      })
    }
  }
  return results
}
