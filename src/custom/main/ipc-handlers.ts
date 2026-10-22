import { ipcMain } from 'electron'
import {
  closeProjectWindow,
  getDisplaysCount,
  listOpenProjectWindows,
  moveToNextDisplay,
  openProjectWindow
} from './project-window-manager'

export function registerProjectWindowIpc(): void {
  ipcMain.handle(
    'myorca:open-project-window',
    async (_event, args: { worktreeId: string; title?: string }) => {
      if (!args?.worktreeId) {
        return false
      }
      openProjectWindow(args.worktreeId, args.title)
      return true
    }
  )

  ipcMain.handle('myorca:close-project-window', async (_event, args: { worktreeId: string }) => {
    if (!args?.worktreeId) {
      return false
    }
    return closeProjectWindow(args.worktreeId)
  })

  ipcMain.handle('myorca:move-to-next-display', async (_event, args: { worktreeId: string }) => {
    if (!args?.worktreeId) {
      return false
    }
    return moveToNextDisplay(args.worktreeId)
  })

  ipcMain.handle('myorca:get-project-windows', async () => {
    return listOpenProjectWindows()
  })

  ipcMain.handle('myorca:get-displays-count', async () => {
    return getDisplaysCount()
  })
}
