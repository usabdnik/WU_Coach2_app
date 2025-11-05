# Implementation Plan: Goal Fixes & Creation

**Branch**: `003-goal-fixes-and-creation` | **Date**: 2025-11-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-goal-fixes-and-creation/spec.md`

## Summary

**Primary Requirement**: Fix goal editing bugs, add visual sync feedback, enable goal creation.

**Technical Approach**:
1. Verify existing bugfix (commit ff46171) for UUID generation and migration
2. Enhance sync button with 4-state visual feedback (idle/pending/syncing/complete)
3. Add goal creation modal with form validation and offline-first persistence
4. All changes maintain single-file HTML PWA architecture with localStorage + Google Sheets sync

## Technical Context

**Language/Version**: Vanilla JavaScript ES6+ (in-browser), HTML5, CSS3
**Primary Dependencies**: None (zero npm dependencies by constitution)
**Storage**: localStorage (primary) + Google Apps Script Web App (secondary sync)
**Testing**: Manual testing on mobile browsers (Safari iOS 14+, Chrome Android 90+)
**Target Platform**: Mobile web browsers (iOS Safari, Android Chrome), PWA-capable
**Project Type**: Single-file Progressive Web App (coach-pwa-app.html → index.html)
**Performance Goals**:
- Touch response <100ms
- Modal open <300ms
- Sync completion <5s (normal network)
- Page load <2s on 3G
**Constraints**:
- Single HTML file architecture (no build step)
- Offline-first data flow (localStorage → pendingChanges → sync)
- Mobile-only interface (touch targets ≥44px)
- Dark theme fixed (no theming system)
- Russian language only (no i18n)
**Scale/Scope**:
- Single coach user (no multi-tenancy)
- ~20-50 athletes per season
- ~5-10 goals per athlete
- Local-first, periodic sync

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles (from CLAUDE.md)

#### ✅ I. Single-File HTML PWA
- **Status**: COMPLIANT
- **Verification**: All changes within `index.html` (formerly `coach-pwa-app (7).html`)
- **Feature Impact**: Goal editing modal, sync button, and goal creation form all inline HTML/CSS/JS

#### ✅ II. Zero Dependencies
- **Status**: COMPLIANT
- **Verification**: No npm packages, no frameworks, pure vanilla JS
- **Feature Impact**: UUID generation uses native `crypto.randomUUID()` with Safari polyfill

#### ✅ III. Offline-First Data Flow
- **Status**: COMPLIANT
- **Verification**: localStorage primary, pendingChanges queue, Google Sheets secondary
- **Feature Impact**: Goal creation adds to localStorage immediately, syncs later

#### ✅ IV. Mobile-Only Design
- **Status**: COMPLIANT
- **Verification**: Touch targets ≥44px, mobile-optimized forms, no desktop considerations
- **Feature Impact**: Goal creation modal uses mobile-friendly date pickers and dropdowns

#### ✅ V. Fixed Dark Theme
- **Status**: COMPLIANT
- **Verification**: Uses existing color palette (`#0f1117`, `#1a1d29`, `#4c9eff`, etc.)
- **Feature Impact**: Sync button states (orange/green/red) follow theme colors

#### ✅ VI. Russian Language Only
- **Status**: COMPLIANT
- **Verification**: All UI text in Russian, no i18n system
- **Feature Impact**: Button text "Синхронизация...", modal title "Добавить цель"

### Additional Constraints

#### ✅ No External Assets
- **Status**: COMPLIANT
- **Verification**: No CDN links, no external CSS/JS, all inline

#### ✅ No Authentication (MVP Phase)
- **Status**: COMPLIANT (as documented in CLAUDE.md)
- **Verification**: Single coach tool, no login required
- **Future**: Google OAuth planned for production phase

#### ✅ No Build Step Required
- **Status**: COMPLIANT
- **Verification**: HTML file is deployment-ready as-is
- **Feature Impact**: All code changes directly in HTML file, no transpilation

### Gate Result: ✅ PASSED

**No violations detected.** Feature fully compliant with project constitution.

**Re-evaluation trigger**: After Phase 1 design completion.

## Project Structure

### Documentation (this feature)

```text
specs/003-goal-fixes-and-creation/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Feature specification (already created)
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (Goal & PendingChange entities)
├── quickstart.md        # Phase 1 output (developer implementation guide)
├── contracts/           # Phase 1 output (Google Apps Script API contract)
│   └── google-apps-script-api.md
├── checklists/          # Quality validation
│   └── requirements.md  # Spec validation (already created)
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created yet)
```

### Source Code (repository root)

```text
# Single-file PWA architecture
index.html               # Complete application (HTML + CSS + JS)
├── Lines 1-10          # Meta tags (PWA manifest, viewport, theme)
├── Lines 11-524        # CSS styles (dark theme, mobile-first)
├── Lines 526-619       # HTML markup (header, lists, modals, nav)
└── Lines 621-1350      # JavaScript (state, sync, UI, migrations)

# Supporting files
README.md               # Project overview
CLAUDE.md               # Developer instructions + constitution reference
.specify/memory/
├── constitution.md     # Template (real rules in CLAUDE.md)
└── ULTRATHINK_MODE.md  # Permanent ultrathink configuration

# Feature development
specs/                  # Feature specifications (this directory)
```

**Structure Decision**: Single-file architecture maintained. All feature implementation (goal editing fixes, sync UI, goal creation) will be added to `index.html` in appropriate sections:
- CSS: New sync button states, goal creation modal styles
- HTML: Enhanced sync button markup, new goal creation modal structure
- JavaScript: Fixed modal functions, new createGoal() function, enhanced updatePendingIndicator()

No new files required except documentation artifacts in `specs/003-goal-fixes-and-creation/`.

## Complexity Tracking

> **No violations detected - this section intentionally left empty.**

All feature requirements align with existing project architecture and constitutional principles.
