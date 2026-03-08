# CLAUDE.md – AI Promptbook v2

Instructions for **Claude Code** (Anthropic). Loaded automatically when this file is present in the project root.

---

<project>
AI Promptbook v2 is a native desktop application for managing AI agent instruction files, system prompts, and project templates. Frontend: React 19 + TypeScript + Vite + Zustand. Backend: Rust + Tauri 2 with AES-256-GCM token encryption.
</project>

---

<architecture>
## Directory structure

- `src/features/` – one sub-folder per application route/page
- `src/ui/` – shared layout, components, and theme
- `src/services/` – all Tauri IPC calls and async operations
- `src/state/` – Zustand global stores
- `src/domain/` – pure TypeScript types and utility functions
- `src-tauri/src/lib.rs` – Rust Tauri commands (cryptography)
- `src-tauri/tauri.conf.json` – Tauri app configuration
- `src-tauri/capabilities/` – Tauri v2 permission declarations
</architecture>

---

<coding_standards>
## TypeScript / React
- Functional components with hooks only
- Explicit types on all function parameters and return values; never `any`
- One component per file; file name matches component name
- Shared state goes into a Zustand store, not component-local state that gets prop-drilled
- All file I/O goes through `@tauri-apps/plugin-fs` – never the browser storage APIs
- Always encrypt GitHub tokens before persisting; use `src/services/cryptoService.ts`
- Type-check with `tsc --noEmit` before finishing any task

## Rust
- Satisfy all `clippy` warnings
- Tauri command signatures: `#[tauri::command] fn name(arg: Type) -> Result<Out, String>`
- Keep all crypto logic in `src-tauri/src/lib.rs`
</coding_standards>

---

<workflow>
## How to run the project
```bash
npm install          # install JS deps
npm run tauri dev    # start dev environment (Rust + Vite hot reload)
tsc --noEmit         # type-check only
```

## Adding a new page/feature
1. Create `src/features/<feature-name>/` with the main component
2. Register the route in `src/routes.tsx`
3. Add a sidebar link in `src/ui/layouts/AppShell.tsx`

## Invoking a Tauri command from TypeScript
```ts
import { invoke } from '@tauri-apps/api/core';
const result = await invoke<T>('command_name', { param });
```
</workflow>

---

<constraints>
- Do NOT use `localStorage`, `sessionStorage`, or `indexedDB` – use Tauri FS plugin instead
- Do NOT commit GitHub personal access tokens or any secrets
- Do NOT skip the Tauri capability permission system
- Do NOT add npm or Cargo packages without explicit justification
- Do NOT create class-based React components
</constraints>
