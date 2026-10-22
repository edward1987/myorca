/**
 * MyOrca main process extension entry point.
 */
import { BRAND_CONFIG } from '../config/brand'
import { UPDATER_CONFIG } from '../config/updater'
import type { CustomMainHookContext } from '../shared/types'
import { registerProjectWindowIpc } from './ipc-handlers'

export function initializeCustomMain(context: CustomMainHookContext): void {
  // Hook executed during main process preflight / initialization.
  void context
  registerProjectWindowIpc()
}

export { BRAND_CONFIG, UPDATER_CONFIG }
export * from './project-window-manager'
