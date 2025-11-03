# 🏋️ WU Coach 2 - Progressive Web App

> Offline-first mobile coaching app for tracking student performance in gymnastics training

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![PWA](https://img.shields.io/badge/PWA-ready-blue.svg)]()
[![Mobile](https://img.shields.io/badge/mobile-first-orange.svg)]()

---

## 📱 Overview

**WU Coach 2** is a single-file Progressive Web App designed for gym coaches to track student performance in real-time, with full offline functionality and cloud synchronization.

### Key Features

- 📴 **Offline-First**: Works without internet after initial load
- 📊 **Performance Tracking**: Monthly records for pull-ups, push-ups, dips
- 🎯 **Goal Management**: Set and track student goals
- 📅 **Seasonal View**: Academic year cycle (September-August)
- 🏆 **All-Time Records**: Track lifetime bests separately from seasonal
- 🔄 **Smart Sync**: Queue changes offline, sync when connected
- 🌙 **Dark Theme**: Eye-friendly interface for gym environments
- 👆 **Touch-Optimized**: Mobile-first design for iOS/Android

---

## 🚀 Quick Start

### For Users (Coaches)

1. **Open** `coach-pwa-app (7).html` in mobile browser (Safari/Chrome)
2. **Sync** - Tap sync button to load data from Google Sheets
3. **Use Offline** - App works without internet after first sync
4. **Track Progress** - Add monthly performance records
5. **Sync Again** - Reconnect to upload offline changes

### For Developers

```bash
# Clone repository
git clone https://github.com/nikitaizboldin/WU_Coach2_app.git
cd WU_Coach2_app

# No installation needed - it's a single HTML file!

# Open in browser
open coach-pwa-app\ \(7\).html

# Or deploy to any web server
# No build step required
```

---

## 🏗️ Architecture

### Single-File Design

**Entire app in one HTML file** - no dependencies, no build process, instant deployment.

```
coach-pwa-app (7).html  (1350 lines)
├── HTML (94 lines)    - Markup structure
├── CSS (514 lines)    - Dark theme styles
└── JS (730 lines)     - App logic + data
```

### Technology Stack

- **Frontend**: Vanilla JavaScript ES6+
- **Styling**: Inline CSS (BEM-inspired)
- **Storage**: localStorage API
- **Backend**: Google Apps Script Web App
- **Sync**: Fetch API + REST-like JSON
- **No Dependencies**: Zero npm packages

### Data Architecture

```javascript
// In-Memory State
athletesData[]      // Student records
exercisesData[]     // Exercise definitions
goalsData[]         // Student goals
pendingChanges[]    // Offline sync queue

// localStorage Persistence
localStorage.athletesData
localStorage.exercisesData
localStorage.goalsData
localStorage.pendingChanges
```

---

## 📐 Design System

### Color Palette (Dark Theme)

| Color | Hex | Usage |
|-------|-----|-------|
| ![#0f1117](https://via.placeholder.com/15/0f1117/0f1117.png) | `#0f1117` | Body background |
| ![#1a1d29](https://via.placeholder.com/15/1a1d29/1a1d29.png) | `#1a1d29` | Cards, modals |
| ![#4c9eff](https://via.placeholder.com/15/4c9eff/4c9eff.png) | `#4c9eff` | Primary actions |
| ![#4ade80](https://via.placeholder.com/15/4ade80/4ade80.png) | `#4ade80` | Success states |
| ![#fbbf24](https://via.placeholder.com/15/fbbf24/fbbf24.png) | `#fbbf24` | Warnings |

### Typography

- **Font**: System stack (`-apple-system, BlinkMacSystemFont`)
- **Scale**: 11px → 24px (mobile-optimized)
- **Weights**: Regular (400), Semi-Bold (600), Bold (700)

---

## 🔄 Data Flow

### Offline-First Pattern

```
┌─────────────┐
│ User Action │
└──────┬──────┘
       │
       v
┌─────────────────┐
│ Update Memory   │ (athletesData[], goalsData[])
└──────┬──────────┘
       │
       v
┌─────────────────┐
│ Save to         │ (localStorage)
│ localStorage    │
└──────┬──────────┘
       │
       v
┌─────────────────┐
│ Add to Pending  │ (pendingChanges[])
│ Changes Queue   │
└──────┬──────────┘
       │
       v
┌─────────────────┐
│ Show Indicator  │ (⏳ badge)
└──────┬──────────┘
       │
       v (when online)
┌─────────────────┐
│ Manual Sync     │
│ Button Pressed  │
└──────┬──────────┘
       │
       v
┌─────────────────┐
│ POST to Google  │
│ Apps Script     │
└──────┬──────────┘
       │
       v
┌─────────────────┐
│ Clear Queue     │ (on success)
│ Reload Data     │
└─────────────────┘
```

---

## 🛠️ Development

### Prerequisites

- Modern mobile browser (Safari iOS 14+, Chrome Android 90+)
- Text editor (VS Code, Sublime, etc.)
- Git (for version control)
- Google Apps Script backend (for sync)

### Project Structure

```
WU_Coach2_GH_SK/
├── coach-pwa-app (7).html     # Main application file
├── CLAUDE.md                  # Development guide
├── README.md                  # This file
├── .git/                      # Git repository
├── .claude/                   # Claude Code settings
└── .specify/                  # SpecKit framework
    └── memory/
        ├── constitution.md    # Architecture rules
        └── ULTRATHINK_MODE.md # Analysis configuration
```

### Key Files

- **coach-pwa-app (7).html** - Complete application
- **constitution.md** - Technical architecture & rules
- **CLAUDE.md** - Development workflow guide
- **ULTRATHINK_MODE.md** - AI-assisted development config

### Making Changes

1. **Read** `.specify/memory/constitution.md` first
2. **Plan** using Sequential MCP (ultrathink mode)
3. **Edit** `coach-pwa-app (7).html`
4. **Test** in mobile browser
5. **Commit** with descriptive message

### Code Sections

| Lines | Content | Purpose |
|-------|---------|---------|
| 1-10 | Meta tags | PWA config, viewport |
| 11-524 | CSS styles | Dark theme, mobile-first |
| 526-619 | HTML markup | UI structure |
| 621-1350 | JavaScript | App logic, data, sync |

---

## 🎯 Features

### Core Functionality

- **Student Management**: Search, filter by group, view details
- **Performance Records**: Track monthly pull-ups, push-ups, dips
- **Goal Setting**: Create and track student goals
- **Seasonal Tracking**: September-August academic year
- **All-Time Records**: Lifetime bests across all seasons
- **Offline Queue**: Changes saved locally, synced when online
- **Smart Sync**: Manual sync with pending changes counter

### User Interface

- **Search Bar**: Find students by name
- **Group Filters**: Начинающие, Средняя, Продвинутая, Элитная
- **Athlete Cards**: Name, group, records, status
- **Detail Modal**: Full student info, goals, records
- **Edit Modal**: Update performance records by month
- **Bottom Navigation**: Students, Goals, Settings

---

## 🔒 Security

### Current State (MVP)

- ❌ No authentication
- ❌ No authorization
- ❌ No input validation
- ⚠️ Public API endpoint

**Acceptable because**:
- Internal tool (single coach)
- No sensitive data
- Trusted user base

### Future Roadmap

- ✅ Google OAuth authentication
- ✅ API key authorization
- ✅ Input validation (client + server)
- ✅ HTTPS enforcement
- ✅ Content Security Policy

---

## 📊 Performance

### Metrics

- **Page Load**: <2s on 3G
- **Touch Response**: <100ms
- **Sync Time**: <5s (normal network)
- **Storage**: ~100KB localStorage usage

### Optimizations

- Single file = Single HTTP request
- No external assets = No extra network calls
- localStorage = Fast local reads
- Minimal animations = Low CPU usage

---

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Safari iOS | 14+ | ✅ Primary |
| Chrome Android | 90+ | ✅ Secondary |
| Chrome Desktop | Latest | ⚠️ Works but not optimized |
| Firefox Mobile | Latest | ⚠️ Works but not tested |
| Safari Desktop | Latest | ⚠️ Works but not optimized |

**Note**: Mobile-first design, desktop experience not prioritized.

---

## 🧪 Testing

### Manual Testing Protocol

1. **Desktop Preview**: Open in Chrome DevTools device mode
2. **Real Device**: Test on iOS (Safari) + Android (Chrome)
3. **Offline Mode**: Enable airplane mode, verify functionality
4. **Sync Testing**: Make offline changes → reconnect → sync
5. **Performance**: Check localStorage, network requests

### Test Scenarios

- ✅ Search filter with Russian input
- ✅ Group chip filtering
- ✅ Athlete detail modal
- ✅ Performance record editing
- ✅ Pending changes indicator
- ✅ Sync button uploads
- ✅ Goal completion toggle
- ✅ Goal deletion
- ✅ Season calculation
- ✅ All-time records display

**No automated tests** - small codebase, manual testing sufficient.

---

## 📚 Documentation

- **Architecture**: `.specify/memory/constitution.md`
- **Development**: `CLAUDE.md`
- **AI Config**: `.specify/memory/ULTRATHINK_MODE.md`
- **This README**: `README.md`

---

## 🤝 Contributing

### Guidelines

1. Read constitution.md before coding
2. Maintain single-file architecture
3. Follow dark theme color palette
4. Keep Russian language interface
5. Preserve offline-first data flow
6. Test on mobile browsers
7. Commit with descriptive messages

### Code Review Checklist

- [ ] Single-file structure preserved
- [ ] BEM naming conventions followed
- [ ] Dark theme colors used
- [ ] Mobile-first touch interactions
- [ ] Offline-first data flow intact
- [ ] Russian language maintained
- [ ] Console logging with emoji
- [ ] No external dependencies

---

## 📝 License

**Internal Project** - Not yet licensed for public use

---

## 👤 Author

**Nikita Izboldin**
- GitHub: [@nikitaizboldin](https://github.com/nikitaizboldin)
- Project: WU Coach 2

---

## 🔗 Links

- **Repository**: https://github.com/nikitaizboldin/WU_Coach2_app
- **Issues**: https://github.com/nikitaizboldin/WU_Coach2_app/issues
- **Documentation**: `.specify/memory/` folder

---

## 📅 Changelog

### v1.0.0 (2025-11-02)
- ✅ Initial release
- ✅ Offline-first architecture
- ✅ Student management
- ✅ Performance tracking
- ✅ Goal management
- ✅ Google Sheets sync
- ✅ Dark theme design
- ✅ Mobile-first UI

---

**Built with ❤️ using SuperClaude Framework + UltraThink Mode**
