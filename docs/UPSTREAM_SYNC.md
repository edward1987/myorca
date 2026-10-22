# Upstream Synchronization Strategy

This document outlines the architecture, automated synchronization workflow, and manual procedures for maintaining [edward1987/myorca](https://github.com/edward1987/myorca) as a sustainable fork of [stablyai/orca](https://github.com/stablyai/orca).

---

## 1. Architecture & Branch Strategy

The repository maintains an isolated branch model that cleanly separates upstream history from custom features:

```
stablyai/orca (upstream/main)
          │
          │ (Daily fast-forward sync)
          ▼
   upstream-sync  ────────► [Automated Conflict Check & PR]
                                       │
                                       │ (Reviewed merge)
                                       ▼
                                     custom  (Default Development Branch)
                                       │
                                       ├─► src/custom/ (Custom features)
                                       └─► docs/       (Fork documentation)
```

### Branches

| Branch              | Role                                 | Rules                                                                                                                                              |
| :------------------ | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`upstream-sync`** | Clean mirror of `upstream/main`      | - **Fast-forward only** (`--ff-only`)<br>- Never commit custom code directly<br>- Never force-push or rewrite history                              |
| **`custom`**        | Primary development branch (Default) | - All MyOrca features and configurations live here<br>- Receives upstream updates via PR merges<br>- Preserves custom history and isolated modules |
| **`main`**          | Upstream fork root                   | Kept safe and untouched to preserve original commit references                                                                                     |

---

## 2. Automated Upstream Sync Workflow

An automated GitHub Actions workflow is located at `.github/workflows/upstream-sync.yml`.

### Key Behaviors:

1. **Daily Execution**: Triggered via cron daily at `04:00 UTC` (`0 4 * * *`).
2. **Manual Execution**: Supports `workflow_dispatch` with an optional `force_pr_check` flag.
3. **Upstream Commit Ingestion**: Fetches `upstream/main` from `https://github.com/stablyai/orca.git`.
4. **Clean Fast-Forward**: Validates that `upstream-sync` can be cleanly fast-forwarded with `git merge --ff-only upstream/main` and pushes to `origin/upstream-sync`.
5. **Divergence Evaluation**: Checks if `upstream-sync` has commits not yet present in `custom` using `git rev-list --count origin/custom..upstream-sync`.
6. **Conflict Preflight**: Uses git's in-memory `git merge-tree --write-tree origin/custom upstream-sync` to detect whether an upcoming merge will produce conflicts, without touching working tree files.
7. **Pull Request Management**:
   - Automatically opens a PR from `upstream-sync` targeting `custom`.
   - Reuses and updates any existing open sync PR to avoid duplicates.
   - Summarizes pending commits and conflict status in the PR description.
   - **Never automatically merges into `custom`**.
8. **Minimal Permissions**: Configured with strict minimum permissions:
   ```yaml
   permissions:
     contents: write
     pull-requests: write
   ```

---

## 3. Manual Synchronization Reference

If you need to perform synchronization manually on your workstation:

### Step 1: Ensure remotes are configured

```powershell
git remote -v
# Should display:
# origin    https://github.com/edward1987/myorca.git (fetch & push)
# upstream  https://github.com/stablyai/orca.git (fetch)
# upstream  NO_PUSH_ALLOWED (push)
```

If upstream is not configured:

```powershell
git remote add upstream https://github.com/stablyai/orca.git
git remote set-url --push upstream NO_PUSH_ALLOWED
```

### Step 2: Fetch latest upstream commits

```powershell
git fetch upstream main
```

### Step 3: Fast-forward `upstream-sync`

```powershell
git checkout upstream-sync
git merge --ff-only upstream/main
git push origin upstream-sync
```

### Step 4: Merge upstream updates into `custom`

```powershell
git checkout custom
git pull origin custom
git merge upstream-sync
```

### Step 5: Resolving Merge Conflicts

If Git reports merge conflicts during the merge:

```powershell
# 1. View conflicting files
git status

# 2. Open conflicting files and resolve markers (<<<<<<<, =======, >>>>>>>)
# Note: Keep custom extension hooks and configurations intact in src/custom/.

# 3. Mark resolved files as staged
git add <path/to/resolved-file>

# 4. Verify tests and build pass
pnpm run typecheck
pnpm run build:desktop:assets

# 5. Finalize the merge commit
git commit -m "chore: merge upstream updates into custom"
git push origin custom
```

### Step 6: Rolling Back a Problematic Upstream Update

If a merged upstream update introduces regressions:

```powershell
# To revert the merge commit cleanly while keeping history:
git checkout custom
git revert -m 1 <merge-commit-sha>
git push origin custom
```
