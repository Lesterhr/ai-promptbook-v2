# AI Promptbook v2

A native desktop application for managing, creating, and organising AI agent instructions, prompts, and project templates. Built with React + TypeScript on the frontend and Rust (Tauri) on the backend.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2-orange)](https://tauri.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)

---

## Features

- **Template Manager** – Create, edit, preview, and organise reusable Markdown templates (system prompts, coding instructions, README templates, etc.)
- **Collections** – Group related templates into named collections, each backed by a local git repository
- **Template Hub** – Browse and import curated community templates from a shared GitHub repository
- **Repo Creator** – Scaffold a new GitHub repository in one click, optionally with a `.gitignore` template and local clone
- **GitHub Sync** – Push/pull a collection to its own remote GitHub repository
- **Secure Token Storage** – GitHub personal access tokens are encrypted with AES-256-GCM and bound to the local machine via PBKDF2 key derivation
- **History** – Tracks recently used templates for quick access from the dashboard

---

## Getting Started (end users)

> See the **[User Guide](USER_GUIDE.md)** for step-by-step instructions on all features.

Pre-built installers are not yet published. Please follow the [Development Setup](#development-setup) section below to run the app from source.

---

## Development Setup

### Prerequisites

| Tool | Version | Link |
|------|---------|------|
| Node.js | LTS | [nodejs.org](https://nodejs.org/) |
| Rust (stable) | latest | [rust-lang.org](https://www.rust-lang.org/tools/install) |
| Git | any | [git-scm.com](https://git-scm.com/) |

**Recommended VS Code extensions:** [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode), [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### Commands

| Action | Command |
|--------|---------|
| Install dependencies | `npm install` |
| Start in dev mode | `npm run tauri dev` |
| Frontend-only dev server | `npm run dev` |
| Type check | `tsc --noEmit` |
| Production build | `npx tauri build` |

On **Windows** you can also use the included helper scripts:

- `start.bat` – starts the dev environment
- `build.bat` – creates the production installer

---

## Project Structure

```
src/                    → Frontend (TypeScript + React)
  domain/               → Pure types + utility functions
  features/             → Feature pages (one folder per route)
  services/             → Async service modules (Tauri IPC + plugins)
  state/                → Zustand store (in-memory app state)
  ui/                   → Shared components, layouts, theme

src-tauri/              → Backend (Rust + Tauri)
  src/lib.rs            → Tauri commands (AES-256-GCM cryptography)
  src/main.rs           → Tauri entry point
  tauri.conf.json       → App configuration
  capabilities/         → Tauri v2 permission system
  Cargo.toml            → Rust dependencies
```

---

## Tech Stack

| Technology | Role |
|------------|------|
| **React 19** | UI rendering and component model |
| **TypeScript 5** | Type-safe source language |
| **Vite 7** | Dev server, transpiler, bundler |
| **Tauri 2** | Desktop shell, native APIs, IPC bridge |
| **Rust** | Cryptography backend (AES-256-GCM, PBKDF2) |
| **Zustand** | Lightweight global state management |

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository and create a feature branch (`git checkout -b feature/my-feature`)
2. Make your changes and ensure the TypeScript type-check passes (`tsc --noEmit`)
3. Commit with a clear message and open a Pull Request

For larger changes, please open an issue first to discuss what you'd like to change.

---

## License

This project is licensed under the [MIT License](LICENSE).

