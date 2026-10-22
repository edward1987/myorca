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

---

## 5. Built-in Custom Feature: Multi-Project Split View & Multi-Window

MyOrca includes a custom-built capability allowing users to:

1. **Split the window view between multiple projects/workspaces** simultaneously (side-by-side or stacked).
2. **Pop out any project into a dedicated window on another monitor** (multi-monitor support).

### 5.1 Architecture Overview

```
src/custom/
├── shared/
│   └── multi-project-types.ts         # SplitProjectState, ProjectWindowInfo
├── main/
│   ├── project-window-manager.ts     # Multi-monitor detection, window creation & bounds management
│   ├── project-window-manager.test.ts# Main process unit tests
│   └── ipc-handlers.ts               # IPC endpoints (open, close, move-to-next-display)
├── preload/
│   └── index.ts                      # Preload bridge exposing window.myorca
└── renderer/
    ├── store/
    │   ├── split-project-store.ts     # Split view state, ratio (20-80%), orientation
    │   └── split-project-store.test.ts# Store unit tests
    ├── components/
    │   ├── MyOrcaWindowActions.tsx    # Titlebar controls (Split dropdown, swap, orientation, Monitor 2 button)
    │   ├── SplitWorkspaceSurfaceManager.tsx # Dual-pane container with active focus management
    │   └── SplitProjectDivider.tsx    # Draggable resizing splitter handle
    └── hooks/
        └── use-project-window-mode.ts # Auto-activates target workspace in secondary project windows
```

### 5.2 User Controls & Interactions

- **Titlebar Split Button (`Columns2` icon)**:
  - Click to open the project selector dropdown and choose another project to split with.
- **Draggable Splitter**:
  - Drag horizontally (or vertically) to adjust the split ratio between 20% and 80%.
  - Double-click the splitter to reset to a balanced 50/50 ratio.
- **Orientation Toggle (`Rows2` / `Columns2` icon)**:
  - Toggle between side-by-side (horizontal) and stacked (vertical) layout.
- **Swap Projects (`ArrowLeftRight` icon)**:
  - Swaps left/right or top/bottom project positions.
- **Click to Focus**:
  - Clicking either pane highlights that project's header and switches active focus, routing keyboard shortcuts and tab actions to that project while keeping both projects active and visible.
- **Pop Out to Window (Monitor 2) (`Monitor` icon)**:
  - Opens the current project in a separate Electron BrowserWindow placed directly on the secondary monitor (if available) or cascaded on the primary display.
- **Next Monitor Button**:
  - In secondary project windows, a "Next Monitor" button in the titlebar cycles the window across monitors.
- **Sidebar Context Menu**:
  - Right-clicking any worktree in the sidebar provides "Split View with this Project" and "Open in New Window (Monitor 2)".
