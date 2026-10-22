/**
 * Extension type definitions for MyOrca custom functionality.
 */
export type CustomFeatureConfig = {
  id: string
  name: string
  enabled: boolean
  description?: string
}

export type CustomMainHookContext = {
  userDataPath: string
  isPackaged: boolean
}
