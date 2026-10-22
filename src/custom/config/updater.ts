/**
 * Custom updater configuration for MyOrca.
 * Prevents official stablyai/orca auto-updater from overwriting custom builds.
 */
import { BRAND_CONFIG } from './brand'

export const UPDATER_CONFIG = {
  // Feed URL for fork releases
  updateFeedUrl: `${BRAND_CONFIG.repositoryUrl}/releases/latest/download`,
  // GitHub release parameters
  provider: 'github' as const,
  owner: 'edward1987',
  repo: 'myorca',
  // Auto-update is disabled until code signing and release publishing are configured
  autoUpdateEnabled: false
} as const
