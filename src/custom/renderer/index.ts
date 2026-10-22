/**
 * MyOrca renderer process extension entry point.
 */
import { BRAND_CONFIG } from '../config/brand'

export function getCustomBrandName(): string {
  return BRAND_CONFIG.productName
}

export { BRAND_CONFIG }
