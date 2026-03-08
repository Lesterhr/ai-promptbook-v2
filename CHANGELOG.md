# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Template Hub: browse and import community templates from a shared GitHub repository
- Saved Tokens: store multiple GitHub personal access tokens encrypted with AES-256-GCM, bound to the local machine
- History management: view and clear recently used templates
- Collection sync: push/pull a collection to/from its own remote GitHub repository
- Repo Creator: scaffold a new GitHub repository with a `.gitignore` template and optional local clone

---

## [0.1.0] - 2025

### Added
- Initial release
- Template Manager: create, edit, preview, and organise Markdown templates
- Collections: group related templates into named collections backed by local git repositories
- Repo Creator: create new GitHub repositories directly from the app
- Settings page with GitHub token management and data-directory info
