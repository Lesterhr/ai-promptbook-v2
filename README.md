# AI Promptbook v2

Eine Desktop-Anwendung zur Verwaltung, Erstellung und Organisation von KI-Prompt-Templates. Gebaut als native Desktop-App mit Web-Technologien im Frontend und Rust im Backend.

---

## Tech Stack

### Node.js

Node.js ist eine JavaScript-Laufzeitumgebung außerhalb des Browsers, basierend auf der V8-Engine von Chrome. In diesem Projekt dient Node.js **nicht** als Runtime der fertigen Anwendung, sondern ausschließlich als **Build- und Entwicklungs-Tooling**. Es stellt `npm` (den Paketmanager) bereit, über den alle Abhängigkeiten installiert und Build-Skripte ausgeführt werden:

- `npm install` — installiert alle Pakete aus `package.json`
- `npm run dev` — startet den Vite-Entwicklungsserver
- `npm run build` — bündelt das Frontend für die Produktion

Node.js ist die **Infrastruktur-Schicht** — zur Laufzeit der fertigen Desktop-App ist es nicht mehr beteiligt.

### TypeScript

TypeScript ist eine Obermenge von JavaScript, die statische Typisierung hinzufügt. TypeScript-Code wird vor der Ausführung zu JavaScript kompiliert, wodurch Typfehler bereits zur Entwicklungszeit erkannt werden.

Jede `.ts`- und `.tsx`-Datei im Projekt ist TypeScript. Die strenge Konfiguration (`strict: true` in `tsconfig.json`) erzwingt, dass alle Variablen, Parameter und Rückgabewerte explizit typisiert sind. Dadurch dienen die Type-Definitionen im Domain-Layer (`src/domain/`) als verbindliche Verträge, an die sich der gesamte Code halten muss.

### React

React ist eine UI-Bibliothek von Meta, die Benutzeroberflächen aus **Komponenten** zusammensetzt. Jede Komponente ist eine Funktion, die JSX (HTML-ähnliche Syntax in JavaScript/TypeScript) zurückgibt.

React rendert die gesamte Benutzeroberfläche der Anwendung. Der Einstiegspunkt ist `src/main.tsx`, wo React sich in das `<div id="root">` aus `index.html` mountet. Die Komponentenhierarchie gliedert sich in:

| Ebene | Verantwortung | Ort |
|---|---|---|
| App-Shell | Layout (Sidebar + Content) | `src/ui/layouts/AppShell.tsx` |
| Feature-Seiten | Seitenlogik pro Route | `src/features/*/` |
| Shared Components | Wiederverwendbare UI-Bausteine | `src/ui/components/index.tsx` |

Zentrale React-Konzepte, die das Projekt nutzt: `useState` (lokaler UI-State), `useEffect` (Side Effects wie Datenladen), `useCallback` (stabile Funktionsreferenzen) und Props (Datenweitergabe von Eltern- an Kind-Komponenten). State Management auf App-Ebene erfolgt über Zustand (`src/state/appStore.ts`).

### Vite

Vite ist ein modernes Build-Tool und Entwicklungsserver (Nachfolger von Webpack/Create React App). Es erfüllt zwei Aufgaben:

**Entwicklungsserver** (`npm run dev`): Vite startet einen lokalen Server auf Port 1420 (konfiguriert in `vite.config.ts`). Bei Dateiänderungen aktualisiert Hot Module Replacement (HMR) die Anwendung sofort im Browser, ohne Neuladen der Seite.

**Produktions-Build** (`npm run build`): Vite bündelt alle TypeScript/React-Dateien zu optimiertem JavaScript. Dabei werden TypeScript zu JavaScript transpiliert, unbenutzter Code per Tree Shaking entfernt, und Assets optimiert. Browser verstehen weder TypeScript noch JSX — Vite übersetzt beides in standardkonformes JavaScript.

### Tauri

Tauri ist ein Framework, das Web-Technologien in eine **native Desktop-Anwendung** verpackt. Im Gegensatz zu Electron verwendet Tauri die system-eigene WebView (statt eines gebündelten Chromium) und ein Rust-Backend, was zu deutlich kleineren Binaries und geringerem Speicherverbrauch führt.

Tauri bildet die Desktop-Shell der Anwendung und stellt bereit:

- **Native System-Zugriffe via Plugins:** TypeScript-Code greift über Tauri-Plugins (`@tauri-apps/plugin-fs`, `@tauri-apps/plugin-shell`, `@tauri-apps/plugin-dialog`) auf Dateisystem, Shell und Systemdialoge zu — Zugriffe, die ein normaler Browser nicht erlaubt.
- **IPC (Inter-Process Communication):** Frontend (WebView) und Backend (Rust) kommunizieren über typisierte `invoke()`-Aufrufe. Das Frontend ruft Rust-Funktionen auf und empfängt strukturierte Rückgabewerte.
- **Permission-System:** Tauri v2 verwendet ein Capability-System (`src-tauri/capabilities/`), das kontrolliert, welche Plugins und Berechtigungen der App zur Verfügung stehen — vergleichbar mit App-Berechtigungen auf Mobilgeräten.
- **Desktop-Features:** Fenster-Management, Installer-Erstellung (NSIS auf Windows) und App-Konfiguration über `tauri.conf.json`.

### Rust

Rust ist eine kompilierte Systemprogrammiersprache, die Speichersicherheit ohne Garbage Collector garantiert. Im Kontext von Tauri bildet Rust das **Backend** der Desktop-Anwendung.

In diesem Projekt ist der Rust-Anteil bewusst **minimal gehalten** — ein sogenannter "Thin Backend Layer". Die Rust-Codebase (`src-tauri/src/`) enthält ausschließlich spezialisierte Funktionen, die aus Sicherheitsgründen nicht im Frontend laufen sollten:

- **Kryptografie:** AES-256-GCM-Verschlüsselung und -Entschlüsselung von Tokens via `encrypt_token` / `decrypt_token` Commands, umgesetzt mit den Crates `aes-gcm`, `pbkdf2` und `sha2`.
- **Schlüsselableitung:** PBKDF2 mit 100.000 Iterationen zur Ableitung von Verschlüsselungskeys.
- **Geräte-Binding:** Der Crate `machine-uid` liefert eine geräte-spezifische ID, die in die Schlüsselableitung einfließt — verschlüsselte Daten sind dadurch an die Hardware gebunden.

Rust-Commands werden mit dem `#[tauri::command]`-Attribut annotiert und über Serde serialisiert/deserialisiert. Vom Frontend werden sie via `invoke<T>('command_name', { params })` aufgerufen. Alle Dateisystem-, Shell- und Dialog-Operationen laufen dagegen direkt über Tauri-Plugins aus TypeScript, ohne Rust-Code.

Die Dependency-Verwaltung erfolgt über `Cargo.toml`, der Rust-Kompiliervorgang wird beim `tauri build` bzw. `tauri dev` automatisch angestoßen.

---

## Zusammenspiel der Technologien

```
 Quellcode (TypeScript + Rust)
       │
       ├── Frontend: .tsx/.ts Dateien
       │       │
       │       ▼
       │   Vite (kompiliert TypeScript/JSX → JavaScript)
       │       │
       │       ▼
       │   Tauri WebView (System-Browser-Engine)
       │       │
       │       ├── React UI (rendert Komponenten)
       │       ├── Tauri Plugins (FS, Shell, Dialog)
       │       └── invoke() → IPC → Rust Backend (Kryptografie)
       │
       └── Backend: .rs Dateien
               │
               ▼
           Rust Compiler (via Cargo, automatisch durch Tauri Build)
```

| Technologie | Zeitpunkt | Rolle |
|---|---|---|
| **Node.js** | Entwicklung & Build | Tooling-Runtime (npm, Skripte) |
| **TypeScript** | Entwicklung → Build | Typsichere Quellsprache |
| **Vite** | Entwicklung & Build | Transpiler, Dev-Server, Bundler |
| **React** | Laufzeit (im WebView) | UI-Rendering, Komponentenmodell, State |
| **Rust** | Build & Laufzeit | Kompilierter Backend-Code (Kryptografie) |
| **Tauri** | Build & Laufzeit | Desktop-Shell, native APIs, IPC-Bridge |

---

## Projektstruktur

```
src/                    → Frontend (TypeScript + React)
  domain/               → Pure Types + Hilfsfunktionen
  features/             → Feature-Seiten (ein Ordner pro Route)
  services/             → Async Service-Module (Tauri IPC + Plugins)
  state/                → Zustand Store (In-Memory State)
  ui/                   → Shared Components, Layouts, Theme

src-tauri/              → Backend (Rust + Tauri)
  src/lib.rs            → Tauri Commands (Kryptografie)
  src/main.rs           → Tauri Entry Point
  tauri.conf.json       → App-Konfiguration
  capabilities/         → Permission-System
  Cargo.toml            → Rust Dependencies
```

---

## Entwicklung

### Voraussetzungen

- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [VS Code](https://code.visualstudio.com/) mit [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) Extensions

### Commands

| Aktion | Command |
|---|---|
| Dependencies installieren | `npm install` |
| Entwicklung starten | `npm run tauri dev` |
| Frontend-only Dev-Server | `npm run dev` |
| Type-Check | `tsc --noEmit` |
| Produktions-Build | `npx tauri build` |
