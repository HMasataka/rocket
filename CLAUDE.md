# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rocket is a cross-platform Git GUI client. Tech stack: Rust + Tauri v2 (backend), React + TypeScript (frontend), git2-rs + git CLI hybrid (git operations). See `docs/adr/` for architecture decisions.

Currently in **design phase (v0.0)** — no production code yet. The repository contains UI/UX mockups and project documentation.

## Commands

```bash
# Development environment (Nix + direnv)
direnv allow              # Auto-loads nix devShell on cd

# Design mockups — inject navigation links for browsable prototypes
task designs:link         # Output to designs-linked/
task designs:clean        # Remove injected scripts
```

## Design System Architecture

### Page Structure

Each design page lives in its own directory under `designs/`:

```
designs/<page-name>/
  index.html    # Full-page HTML mockup
  styles.css    # Page-specific styles only
```

### Shared CSS (`designs/shared/`)

| File                | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `variables.css`     | CSS custom properties (colors, spacing, typography)                |
| `shell.css`         | App shell layout (titlebar, toolbar, sidebar, statusbar)           |
| `components.css`    | Reusable components (buttons, modals, settings layout)             |
| `changes-view.css`  | Changes/diff view (file list, diff lines, commit panel, AI review) |
| `settings-form.css` | Settings form controls (inputs, toggles, theme/color pickers)      |

All dialog/overlay pages use the Changes view as a dimmed background. When updating Changes view features, update the background HTML across all dialog pages too.

### Navigation (`designs/connect.json`)

Maps click targets (CSS selectors) to page transitions. The `connect` CLI tool injects navigation scripts based on this config. Modal pages are listed in the `modals` array.

### Conventions

- Purple (`--purple` / `--purple-dim`) is the AI feature accent color
- Page-specific `styles.css` should only contain styles unique to that page — shared styles go in `shared/`
- Settings pages link: `variables.css` → `shell.css` → `components.css` → `changes-view.css` → `settings-form.css` → `styles.css`
- Dialog pages link: `variables.css` → `shell.css` → `components.css` → `changes-view.css` → `styles.css`

## Documentation

- `docs/features.md` — Full feature specification
- `docs/roadmap.md` — Development roadmap (v0.0–v1.x+)
- `docs/design-coverage.md` — Tracks which features have mockups
- `docs/adr/` — Architecture Decision Records (Rust, Tauri v2, git2-rs hybrid)

## Language

Documentation and commit messages are in Japanese. Code and CSS class names are in English.
