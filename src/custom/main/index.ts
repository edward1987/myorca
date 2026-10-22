/**
 * MyOrca main process extension entry point.
 */
import { BRAND_CONFIG } from '../config/brand'
import { UPDATER_CONFIG } from '../config/updater'
import type { CustomMainHookContext } from '../shared/types'

export function initializeCustomMain(context: CustomMainHookContext): void {
  // Hook executed during main process preflight / initialization.
  // Custom IPC handlers, background services, or feature flags can be initialized here.
  void context
}

export { BRAND_CONFIG, UPDATER_CONFIG }
