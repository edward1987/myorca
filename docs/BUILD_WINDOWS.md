# Building MyOrca on Windows

This guide documents the complete environment setup, prerequisites, and build steps to compile and package **MyOrca** on Windows.

---

## 1. Prerequisites

Ensure the following tools are installed:

| Tool                               | Required Version                 | Verification Command                                          | Notes                                                                      |
| :--------------------------------- | :------------------------------- | :------------------------------------------------------------ | :------------------------------------------------------------------------- |
| **Node.js**                        | `v24.x` (LTS, e.g., `v24.22.1`)  | `node -v`                                                     | Managed via `nvm-windows` (`nvm install 24.22.1 && nvm use 24.22.1`)       |
| **pnpm**                           | `v12.14.0`                       | `pnpm -v`                                                     | Managed via Corepack (`corepack enable`)                                   |
| **Visual Studio Build Tools 2022** | `v17.x`                          | `vswhere.exe -products *`                                     | "Desktop development with C++" workload (MSVC `v143` toolset)              |
| **Windows SDK**                    | `10.0.19041.0` or `10.0.22621.0` | File system check in `C:\Program Files (x86)\Windows Kits\10` | Contains `signtool.exe`, CRT headers, and libraries                        |
| **Rust Toolchain**                 | `stable-x86_64-pc-windows-msvc`  | `rustc -V`                                                    | Required for `native/windows-cli-launcher` and `native/windows-agent-hook` |
| **Python**                         | `3.10+`                          | `python --version`                                            | Required by `node-gyp` for native addon compilation                        |

---

## 2. Environment Variables Setup

When compiling native modules (`node-pty`, `@orca/windows-registry`, `@orca/windows-security`, `@vscode/windows-process-tree`), `node-gyp` and `electron-builder` require the Visual C++ toolset and Windows SDK environment variables.

Execute the following in your PowerShell session (or add to your PowerShell profile):

```powershell
$env:VCINSTALLDIR = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\"
$env:WindowsSDKVersion = "10.0.19041.0\"
$env:VSCMD_VER = "17.14.35"
$env:WindowsSdkDir = "C:\Program Files (x86)\Windows Kits\10\"
$env:PATH = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.44.35207\bin\Hostx64\x64;C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64;" + $env:PATH
```

---

## 3. Dependency Installation

MyOrca consists of the root desktop workspace and a colocated `mobile/` sub-workspace:

```powershell
# 1. Install mobile dependencies (required by mobile web bundle generator)
cd mobile
pnpm install --frozen-lockfile
cd ..

# 2. Install root dependencies and build native node addons
pnpm install --frozen-lockfile
```

---

## 4. Verification and Validation

### 4.1 Type Checking

Validate the TypeScript codebase (includes main, preload, renderer, and custom modules):

```powershell
pnpm run typecheck
```

### 4.2 Run Tests

Validate plugin and unit test contracts:

```powershell
pnpm exec vitest run src/shared/plugins
```

---

## 5. Building the Desktop Application

### 5.1 Build Desktop Assets

Compiles the Vite renderer bundle, preload scripts, CLI, WSL guest relays, and mobile web bundle:

```powershell
pnpm run build:desktop
```

### 5.2 Build Native Windows Components

Compiles the Rust CLI launcher and agent hook binaries:

```powershell
pnpm run build:native
```

### 5.3 Produce Unpacked Application (`dist\win-unpacked\`)

Packages the Electron application into an unpacked directory for fast local execution and verification without building an installer:

```powershell
pnpm run build:unpack
```

The application executable is produced at `dist\win-unpacked\Orca.exe` (or `MyOrca.exe`).

### 5.4 Produce Windows NSIS Installer (`dist\orca-windows-setup.exe`)

Compiles the full single-click installer executable:

```powershell
pnpm run build:win
```

The installer executable is generated at `dist\orca-windows-setup.exe` (or `myorca-windows-setup.exe`).

---

## 6. Application Identity & Code Signing

### 6.1 Avoiding Conflicts with Official Orca

- **Install Location**: Official Orca installs to `%LOCALAPPDATA%\Programs\orca`. MyOrca installs to `%LOCALAPPDATA%\Programs\MyOrca`.
- **User Data**: Official Orca stores SQLite database, credentials, and settings in `%APPDATA%\orca`. MyOrca stores data in `%APPDATA%\myorca`.
- **Registry Uninstallation**: Distinct registry display names prevent Windows uninstaller confusion.

### 6.2 Code Signing Requirements

- Windows SmartScreen blocks unsigned installers from unknown publishers.
- For production distribution, binaries must be signed using Microsoft `signtool.exe` with a valid Authenticode Code Signing Certificate (EV hardware token or Azure Trusted Signing).
- Dev builds produced without a commercial certificate can be run by clicking **"More info" -> "Run anyway"** in Windows SmartScreen.
