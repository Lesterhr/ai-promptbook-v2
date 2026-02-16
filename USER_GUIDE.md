# AI Promptbook – User Guide

Welcome to **AI Promptbook**, your personal workspace for managing AI agent instructions, prompts, and project templates.

---

## Getting Started

When you open the app, you see the **Dashboard** — your home screen. From here you can quickly jump to the two main areas:

| Area | What it does |
|------|-------------|
| **Templates** | Create, organise, and preview your AI agent instructions and prompts |
| **Repo Creator** | Set up a new GitHub project with one click |

Use the **sidebar** on the left to switch between areas at any time. Click the arrow at the bottom of the sidebar to collapse it if you need more screen space.

---

## Templates

Templates are reusable text files (Markdown) that you give to AI agents — things like coding instructions, system prompts, or project guidelines.

### Collections

Templates live inside **Collections**. Think of a collection as a folder that groups related templates together.

**Create a collection:**
1. Go to **Templates** in the sidebar
2. Click **+ New** next to the collection tabs
3. Give it a name and optional description
4. Click **Create**

### Creating a template

1. Select a collection
2. Click **New Template**
3. Fill in the name, category, and content
4. Click **Save**

### Importing templates

You can import templates from two sources:

- **Template Hub** — A curated online library of ready-made templates. Select the ones you want and click Import.
- **Local Folder** — Point to any folder on your computer that contains `.md` files.

Click the **Import** button at the top of the Templates page to get started.

### Preview

Click any template in the list to see a formatted preview. From there you can click **Edit** to make changes.

### Syncing with GitHub

Each collection can be linked to its own GitHub repository so your templates are backed up online.

1. Set up your GitHub token in **Settings** first
2. Your collection will show **Push** / **Pull** buttons once a remote is configured
3. **Push** uploads your latest changes to GitHub
4. **Pull** downloads the latest version from GitHub

---

## Repo Creator

Quickly create a new GitHub repository and optionally clone it to your computer.

### Step by step

1. Go to **Repo Creator** in the sidebar
2. Enter your **GitHub Token** and click **Verify** (you only need to do this once — save it in Settings to remember it)
3. Fill in the repository details:
   - **Repository Name** — the name of your new project
   - **Description** — a short summary (optional)
   - **Visibility** — Private (only you) or Public (everyone)
   - **Language** — picks the right `.gitignore` file for your project type
4. **Clone to local folder** (optional) — click **Browse** to choose where on your computer the project should be saved. If you skip this, the repo is created on GitHub only.
5. Click **Create Repository**

When it's done, you'll see a confirmation with a link to open the project on GitHub.

---

## Settings

- **GitHub Token** — Your personal access token for GitHub. Needed for creating repositories and syncing collections. You can get one from [github.com/settings/tokens](https://github.com/settings/tokens). Make sure it has the **repo** permission.
- **Data Location** — Shows where the app stores your collections and settings on your computer (usually in your home folder under `.ai-promptbook`).

---

## Quick Tips

- **Search** — Use the search bar on the Templates page to quickly find templates by name or tag.
- **Categories** — Filter templates by type (Instruction, System Prompt, README, etc.) using the dropdown.
- **Tags** — Add comma-separated tags when editing a template to make it easier to find later.
- **Version** — Each template has a version number you can update manually to track changes.
- **Last Used** — The dashboard shows which templates you've used most recently, so you always know what's current.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Navigate sections | Click sidebar icons |
| Collapse sidebar | Click arrow at bottom |

---

## Need Help?

If something doesn't work as expected, check these common issues:

- **"Invalid GitHub token"** — Make sure you copied the full token starting with `ghp_`. It needs the `repo` permission.
- **"git clone failed"** — Make sure Git is installed on your computer and the folder you selected is writable.
- **Templates not showing** — Make sure you have a collection selected (the blue tab at the top of the Templates page).
