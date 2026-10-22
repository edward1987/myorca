# Custom Development Architecture & Guide

This document describes how to develop and maintain custom functionality within **MyOrca** while minimizing merge conflicts with upstream updates from `stablyai/orca`.

---

## 1. Core Principles

To preserve seamless upstream synchronization, adhere to the following principles:

1. **Isolation over Inlining**: Never embed extensive custom logic directly into upstream files. Place all custom code in `src/custom/`.
2. **Minimal Invasiveness**: Connect custom modules to upstream code using minimal, single-line hook or provider wrappers.
3. **Configuration Overrides**: Drive custom behavior via typed configuration objects (`src/custom/config/`).
4. **Stable Contracts**: Expose clear TypeScript interfaces between upstream and custom layers.

---

## 2. Directory Layout

All custom code belongs in `src/custom/`:

```
src/custom/
├── config/
│   ├── brand.ts        # App naming, IDs, URLs, and directory identities
│   └── updater.ts      # Fork release and updater endpoint settings
├── main/
│   └── index.ts        # Main process startup hooks, IPC registration, lifecycle handlers
├── renderer/
│   └── index.ts        # Renderer UI extensions, custom widgets, theme overrides
├── shared/
│   └── types.ts        # Shared types and extension contracts
└── index.ts            # Public entry point for custom module exports
```

---

## 3. Extension Points

### 3.1 Configuration & Branding

Upstream configurations reference `src/custom/config/brand.ts`:

- **`productName`**: `MyOrca`
- **`appId`**: `com.edward1987.myorca`
- **`userDataFolderName`**: `myorca` (ensures settings and database stay separate from official Orca).

### 3.2 Main Process Lifecycle Hook

In `src/main/startup/main-process-preflight.ts` or `src/main/index.ts`, custom lifecycle initialization is invoked via:

```typescript
import { initializeCustomMain } from '../custom/main'

initializeCustomMain({
  userDataPath: app.getPath('userData'),
  isPackaged: app.isPackaged
})
```

Add new background workers, custom native integrations, or custom IPC endpoints inside `src/custom/main/index.ts`.

### 3.3 Renderer UI Extensions

In `src/renderer/src/App.tsx`, custom UI components or provider overlays can wrap or sit alongside standard UI trees:

```typescript
import { CustomOverlayProvider } from '../../custom/renderer'
```

---

## 4. How to Add Your First Custom Feature

Follow this step-by-step example to implement a custom feature cleanly:

### Step 1: Define the Feature Contract

Add the feature type in `src/custom/shared/types.ts`:

```typescript
export interface CustomFeatureConfig {
  id: string
  name: string
  enabled: boolean
}
```

### Step 2: Implement the Feature Logic

Create a dedicated file in `src/custom/main/my-feature.ts` or `src/custom/renderer/my-component.tsx`:

```typescript
// src/custom/renderer/components/MyCustomBadge.tsx
import React from 'react'
import { BRAND_CONFIG } from '../../config/brand'

export const MyCustomBadge: React.FC = () => {
  return (
    <div className="px-2 py-1 text-xs font-semibold rounded bg-indigo-600 text-white">
      {BRAND_CONFIG.productName} Custom Edition
    </div>
  )
}
```

### Step 3: Export via the Custom Registry

Export the component or handler from `src/custom/renderer/index.ts`:

```typescript
export { MyCustomBadge } from './components/MyCustomBadge'
```

### Step 4: Mount into Upstream with a 1-Line Hook

In the target upstream UI file (e.g. `src/renderer/src/app-shell/TitlebarMainStrip.tsx`), import and mount:

```tsx
import { MyCustomBadge } from '../../../custom/renderer'

// In the JSX render tree:
;<MyCustomBadge />
```

### Step 5: Validate

Verify TypeScript and tests pass:

```powershell
pnpm run typecheck
pnpm run build:desktop:assets
```

Because 99% of your logic resides in `src/custom/`, future upstream merges will never overwrite your implementation!
