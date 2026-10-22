/**
 * MyOrca renderer process extension entry point.
 */
import { BRAND_CONFIG } from '../config/brand'

export function getCustomBrandName(): string {
  return BRAND_CONFIG.productName
}

export { BRAND_CONFIG }
export * from './store/split-project-store'
export * from './components/MyOrcaWindowActions'
export * from './components/SplitWorkspaceSurfaceManager'
export * from './components/SplitProjectDivider'
export * from './hooks/use-project-window-mode'
