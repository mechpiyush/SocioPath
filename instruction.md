# Instruction: Updating Vercel Environment Variables

Use this guide to quickly update or reconfigure environment variables from the local `.env` file to Vercel via the Vercel CLI without encountering terminal hangs or conflicts.

---

## 💡 Quick Instructions for Next Time

When asked to sync or update Vercel environment variables, do **NOT** run interactive loops or pipe outputs directly in a standard `execSync` block, as background CLI daemon processes (like update checkers) will inherit standard pipes and hang the terminal.

Instead, execute the operations using **PowerShell Start-Process** with `-NoNewWindow -Wait` or redirect outputs to `NUL`.

### Step-by-Step Command Flow

To sync a variable (e.g. `MY_VAR="my_value"`):

1. **Remove the old variable** to prevent duplicate key configuration errors:
   ```powershell
   node node_modules\vercel\dist\index.js env rm MY_VAR --yes
   ```
   *(Run via PowerShell using `Start-Process` to prevent stdout blocking):*
   ```powershell
   Start-Process -FilePath "node" -ArgumentList "node_modules/vercel/dist/index.js env rm MY_VAR --yes" -NoNewWindow -Wait
   ```

2. **Add the new variable** with the `--no-sensitive` flag to keep it visible in the dashboard:
   ```powershell
   node node_modules\vercel\dist\index.js env add MY_VAR production,preview,development --value "my_value" --no-sensitive --yes
   ```
   *(Run via PowerShell using `Start-Process` to prevent stdout blocking):*
   ```powershell
   Start-Process -FilePath "node" -ArgumentList "node_modules/vercel/dist/index.js env add MY_VAR production,preview,development --value 'my_value' --no-sensitive --yes" -NoNewWindow -Wait
   ```

3. **Verify the environment variables list**:
   ```powershell
   node node_modules\vercel\dist\index.js env ls
   ```

---

## 🛠️ Automation Helper

You can create and run a temporary batch script (`.bat`) to execute them sequentially with output redirected to `NUL` to make it completely silent and failsafe:

```batch
@echo off
call node node_modules\vercel\dist\index.js env rm VAR_NAME --yes > NUL 2>&1
call node node_modules\vercel\dist\index.js env add VAR_NAME production,preview,development --value "VAR_VALUE" --no-sensitive --yes > NUL 2>&1
```
*(Always use `call` before `node` in Windows batch files so the script doesn't exit prematurely after the first process finishes).*
