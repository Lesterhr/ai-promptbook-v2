# AGENTS.md – AI Promptbook v2

> Universal agent instruction file. Loaded automatically by GPT-based coding agents and any tool that respects the emerging `AGENTS.md` standard.

## What This Project Is
A **native desktop application** for managing AI agent instruction files, system prompts, and project templates. Built with React 19 + TypeScript (frontend) and Rust + Tauri 2 (backend).

---

## Repository Layout

```
src/                    → Frontend (TypeScript + React)
  domain/               → Pure types and utility functions
  features/             → Feature pages (one folder per route)
  services/             → Async service modules (Tauri IPC + plugins)
  state/                → Zustand store (global in-memory state)
  ui/                   → Shared components, layouts, theme
src-tauri/              → Backend (Rust + Tauri 2)
  src/lib.rs            → Tauri commands (AES-256-GCM cryptography)
  src/main.rs           → Tauri entry point
  tauri.conf.json       → App configuration
  capabilities/         → Tauri v2 permission system
  Cargo.toml            → Rust dependencies
Guidelines/             → Research documents on AI instruction file formats
```

---

## Coding Rules

### TypeScript / React
1. Functional components and hooks only – no class components
2. Explicit TypeScript types everywhere – never use `any`
3. State shared across components must live in a Zustand store (`src/state/`)
4. Persistence must go through `src/services/storageService.ts` (Tauri FS plugin)
5. GitHub tokens must always be encrypted via `src/services/cryptoService.ts`
6. Run `tsc --noEmit` before committing

### Rust
1. Follow `clippy` lints
2. Tauri commands return `Result<T, String>`
3. All cryptographic operations stay in `src-tauri/src/lib.rs`

### General
- Keep functions small and single-purpose
- Error messages must be user-facing and descriptive
- Do not add dependencies without justification

---

## Important Patterns

### Adding a new feature page
1. Create `src/features/<name>/` folder
2. Add a route in `src/routes.tsx`
3. Add a nav entry in `src/ui/layouts/AppShell.tsx`

### Calling a Tauri command
```ts
import { invoke } from '@tauri-apps/api/core';
const result = await invoke<ReturnType>('command_name', { arg1, arg2 });
```

### Reading/writing files
```ts
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
```

---

## Out of Scope
- Do not use `localStorage` or `sessionStorage`
- Do not expose GitHub tokens in plain text anywhere
- Do not bypass the Tauri capability permission system (`src-tauri/capabilities/`)
