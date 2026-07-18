---
name: vercel-env
description: Guides agents on how to reconfigure Vercel environment variables securely, run local compiler checks, and optimize operations for token efficiency.
---
# Vercel Environment, Build, & Token Efficiency Skill

This skill documents how to efficiently manage Vercel deployments, reconfigure variables without pipe hangs, run local compiler sanity checks, and minimize token overhead.

---

## ⚡ 1. Token & Process Efficiency Rules
*   **No Polling loops**: Never run background commands that check status repeatedly in loops. Check status once or rely on system reactive wakeups.
*   **Clean stderr/stdout dumps**: Limit long CLI logs (like `git log` or verbose compiler output). Pipe outputs through pagers or filter them to avoid overwhelming the token context window.
*   **Run targeted tests**: Run unit tests or local build verification before executing git commands.

---

## 🔒 2. Vercel Environment Variable Sync
Avoid pipe hangs caused by Vercel background update checks. Do **NOT** pipe outputs directly in a standard `execSync` block. Use **PowerShell Start-Process** with `-NoNewWindow -Wait` or redirect outputs to `NUL`.

### Sequential PowerShell Execution:
```powershell
# Remove old variable
Start-Process -FilePath "node" -ArgumentList "node_modules/vercel/dist/index.js env rm VAR_NAME --yes" -NoNewWindow -Wait

# Add new variable as Non-sensitive (dashboard visible)
Start-Process -FilePath "node" -ArgumentList "node_modules/vercel/dist/index.js env add VAR_NAME production,preview,development --value 'VAR_VALUE' --no-sensitive --yes" -NoNewWindow -Wait
```

### Automation Helper (Silent Batch Script):
Create a temporary batch script (`.bat`) in `scratch/` using `call` and output redirection (`> NUL 2>&1`):
```batch
@echo off
call node node_modules\vercel\dist\index.js env rm VAR_NAME --yes > NUL 2>&1
call node node_modules\vercel\dist\index.js env add VAR_NAME production,preview,development --value "VAR_VALUE" --no-sensitive --yes > NUL 2>&1
```

---

## 🛠️ 3. Pre-Deployment Compiler checks (Saves Vercel Build Minutes)
Always verify code correctness locally **before** committing and pushing changes to trigger Vercel builds.

1.  **TypeScript Static Check**:
    ```bash
    npx tsc --noEmit
    ```
2.  **Next.js Production Build test**:
    ```bash
    npm run build
    ```
    Ensure no compilation or linting errors exist before deploying.

---

## 🐞 4. Debugging & Logs
*   If Vercel build fails, verify project configuration in Vercel first:
    ```bash
    node node_modules\vercel\dist\index.js inspect <deploymentId>
    ```
*   Use `vercel dev` locally to reproduce environment-related runtime crashes without pushing code.
