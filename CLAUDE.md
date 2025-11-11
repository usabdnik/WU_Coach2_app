# WU Coach 2 - Claude Code Instructions

> **Progressive Web App for Gym Coaching** | Single-File Architecture | Offline-First | Mobile-Only

---

## 🧠 CRITICAL: UltraThink Mode Active

**This project operates in PERMANENT ULTRATHINK MODE.**

🔗 **Configuration**: `.specify/memory/ULTRATHINK_MODE.md`

**What this means**:
- Maximum depth analysis (~32K tokens)
- All MCP servers enabled (Sequential, Context7, Magic, Serena, Morphllm, Playwright)
- Comprehensive thinking required for ALL tasks
- Evidence-based reasoning mandatory
- Multi-step analysis with hypothesis testing

**DO NOT disable this mode without explicit user permission.**

---

## 📋 Project Constitution

**Primary reference document**: `.specify/memory/constitution.md`

### Core Architectural Principles

1. **Single-File HTML PWA** - Everything in `coach-pwa-app (7).html`
2. **Zero Dependencies** - No npm, no frameworks, pure vanilla JS (PWA runtime only; one-time migration/development tooling exempt)
3. **Offline-First** - localStorage primary, Google Sheets sync secondary
4. **Mobile-Only** - Touch-optimized, no desktop considerations
5. **Dark Theme** - Fixed color palette, no theming system
6. **Russian Language** - No internationalization needed

### Non-Negotiable Rules

- ❌ **NEVER add external dependencies** (no npm packages in PWA runtime; migration/dev tooling exempt)
- ❌ **NEVER break single-file structure**
- ❌ **NEVER add English UI text** (Russian only)
- ❌ **NEVER optimize for desktop** (mobile first and only)
- ✅ **ALWAYS maintain offline-first data flow**
- ✅ **ALWAYS use localStorage as primary storage**
- ✅ **ALWAYS follow dark theme color palette**
- ✅ **ALWAYS test on mobile browsers** (Safari iOS, Chrome Android)

---

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: Vanilla JavaScript ES6+, HTML5, CSS3
- **Backend**: Google Apps Script Web App
- **Storage**: localStorage API
- **State**: Plain JS objects (no state library)
- **Styling**: Inline CSS with BEM-inspired naming

### File Structure
```
coach-pwa-app (7).html
├── Lines 1-10    : Meta tags (PWA, viewport, theme)
├── Lines 11-524  : CSS styles (dark theme, mobile-first)
├── Lines 526-619 : HTML markup (header, lists, modals, nav)
└── Lines 621-1350: JavaScript (state, data, UI, sync)
```

### Data Architecture
```javascript
// Global State (in-memory)
athletesData = []      // Student records
exercisesData = []     // Exercise definitions
goalsData = []         // Student goals
pendingChanges = []    // Offline sync queue
currentSeason = {}     // Sept-Aug academic year

// Persistence (localStorage)
localStorage.athletesData
localStorage.exercisesData
localStorage.goalsData
localStorage.pendingChanges
localStorage.lastSaved
```

### Data Flow
```
User Action
  → Update in-memory state
    → Add to pendingChanges queue
      → Save to localStorage (immediate)
        → Display pending indicator (⏳)
          → Manual sync button
            → POST to Google Apps Script
              → Clear pendingChanges on success
                → Reload fresh data
```

---

## 🎨 Design System

### Color Palette (Dark Theme)
| Element | Color | Usage |
|---------|-------|-------|
| Background | `#0f1117` | Body base |
| Card | `#1a1d29` | Athlete cards, modals |
| Input | `#2a2d3a` | Form fields, chips |
| Primary | `#4c9eff` | Actions, links |
| Success | `#4ade80` | Active status, completed |
| Warning | `#fbbf24` | Pending, schedule |
| Danger | `#dc2626` | Delete actions |
| Text Primary | `#ffffff` | Main content |
| Text Secondary | `#8b8f9f` | Labels, meta |
| Text Tertiary | `#6b6f82` | Placeholders, disabled |

### Typography
- **Font**: System stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial`)
- **Scale**: 11px → 13px → 14px → 15px → 17px → 20px → 24px
- **Weights**: 400 (regular), 600 (semi-bold), 700 (bold)

### Spacing
- **Base unit**: 5px
- **Common gaps**: 8px, 10px, 15px, 20px
- **Padding scale**: 10px → 12px → 15px → 20px
- **Margin scale**: 8px → 10px → 15px → 20px

### Touch Targets
- **Minimum**: 44x44px (Apple HIG standard)
- **Preferred**: 48x48px or larger
- **Active feedback**: `transform: scale(0.98)` + background change

---

## 🔧 Development Workflow

### Before Making Changes

1. **Read Constitution**: `.specify/memory/constitution.md`
2. **Read UltraThink Config**: `.specify/memory/ULTRATHINK_MODE.md`
3. **Activate Sequential MCP**: Use for analysis phase
4. **Check Git Status**: `git status && git branch`

### Adding New Features

1. **Plan with UltraThink**:
   - Use Sequential MCP for analysis
   - Document architecture impact
   - Assess security implications
   - Consider mobile UX
   - Plan offline-first data flow

2. **Locate Insertion Point**:
   - HTML: Find section in `<body>` (lines 526-619)
   - CSS: Find logical place in `<style>` (lines 11-524)
   - JS: Find function group in `<script>` (lines 621-1350)

3. **Implement**:
   - Maintain single-file structure
   - Follow BEM naming for CSS
   - Use dark theme colors
   - Add emoji logging (`console.log('✅ ...')`)
   - Test on mobile browser

4. **Validate**:
   - Check offline functionality
   - Verify touch interactions
   - Test pendingChanges queue
   - Confirm Russian language
   - Review constitution compliance

### Modifying Existing Code

1. **Understand First**:
   - Read HTML markup (visual structure)
   - Read CSS styles (visual design)
   - Read JavaScript (behavior logic)
   - Trace data flow (state → localStorage → sync)

2. **Change Systematically**:
   - Update HTML if structure changes
   - Update CSS if visuals change
   - Update JS if behavior changes
   - Update all three if major feature

3. **Test Thoroughly**:
   - Open in mobile browser (Safari iOS preferred)
   - Test offline mode (airplane mode)
   - Test sync after reconnect
   - Verify localStorage persistence

### Git Commit Pattern

```bash
# Feature branches (if complex)
git checkout -b feature/exercise-type-filter

# Descriptive commits
git commit -m "Add: Exercise type filter chips in header
- New chip filter for exercise types
- Extends existing filter pattern
- Touch-optimized for mobile
- Preserves offline-first data flow"

# Push to GitHub
git push origin feature/exercise-type-filter
```

---

## 🚀 Deployment Process

**Current**: Manual upload to web server

1. Edit `coach-pwa-app (7).html` locally
2. Test by opening file in browser
3. Commit to git: `git add . && git commit -m "..."`
4. Push to GitHub: `git push origin main`
5. Upload HTML file to web hosting

**No build step required** - file is deployment-ready as-is.

**Future**: GitHub Pages or Netlify auto-deployment

---

## 🔒 Security Considerations

### Current State (MVP Phase)
- ❌ No authentication
- ❌ No API authorization
- ❌ No input sanitization
- ❌ No XSS protection
- ❌ No CSRF tokens

**Acceptable because**:
- Internal tool (single coach)
- No sensitive data (just exercise records)
- Limited user base (trusted users)

### Future Roadmap (Production Phase)
- ✅ Google OAuth authentication
- ✅ API key/token authorization
- ✅ Client + server input validation
- ✅ Content Security Policy headers
- ✅ HTTPS enforcement

**When to harden**: Before opening to public or multiple coaches

---

## 📊 Performance Standards

### Mobile Targets
- **Page load**: <2s on 3G
- **Touch response**: <100ms
- **Sync operation**: <5s (normal network)
- **Battery drain**: Minimal (no background tasks)

### Optimization Techniques
- ✅ Single file = Single HTTP request
- ✅ No external assets = No extra requests
- ✅ localStorage = Fast local reads
- ✅ Minimal animations = Low CPU usage
- ❌ Service Worker = Not yet (future PWA feature)
- ❌ Asset minification = Not needed (single file)

---

## 🧪 Testing Strategy

### Manual Testing Protocol
1. **Desktop preview**: Open file in Chrome
2. **Mobile preview**: Chrome DevTools device mode
3. **Real device**: Safari iOS + Chrome Android
4. **Offline mode**: Airplane mode testing
5. **Sync testing**: Edit offline → reconnect → sync

### Test Scenarios
- [ ] Search filter works (Russian input)
- [ ] Group chips filter correctly
- [ ] Athlete details modal opens
- [ ] Performance edit saves locally
- [ ] Pending indicator shows (⏳)
- [ ] Sync button uploads changes
- [ ] Goal completion toggles
- [ ] Goal deletion works
- [ ] Season indicator calculates correctly
- [ ] All-time records display

### No Automated Tests
- **Rationale**: Small single-file app, manual testing sufficient
- **Future**: Consider Playwright tests when codebase grows

---

## 🎯 Common Tasks Quick Reference

### Add New Filter Chip
```
HTML: <button class="chip" data-group="value">Label</button>
CSS:  .chip { ... } .chip.active { ... }
JS:   document.querySelectorAll('.chip').forEach(chip => ...)
```

### Add New Modal
```
HTML: <div class="modal" id="myModal">...</div>
CSS:  .modal { ... } .modal.show { ... }
JS:   document.getElementById('myModal').classList.add('show')
```

### Add New Data Field
```
State:  athletesData[i].newField = value
Local:  localStorage.setItem('athletesData', JSON.stringify(athletesData))
Sync:   pendingChanges.push({ type: 'athlete', ... })
```

### Update Dark Theme Color
```
Find all instances in CSS: Cmd+F "#oldcolor"
Replace with new color: "#newcolor"
Verify contrast: https://webaim.org/resources/contrastchecker/
```

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `coach-pwa-app (7).html` | Complete application (HTML+CSS+JS) |
| `.specify/memory/constitution.md` | Technical architecture rules |
| `.specify/memory/ULTRATHINK_MODE.md` | Permanent ultrathink configuration |
| `CLAUDE.md` | This file - development guide |
| `.git/` | Version control history |

---

## ⚙️ MCP Servers Available

| Server | Tool Prefix | Use For |
|--------|-------------|---------|
| Sequential | `mcp__sequential-thinking__*` | Complex analysis, multi-step reasoning |
| Context7 | `mcp__context7__*` | Official documentation lookup |
| Magic | `mcp__magic__*` | UI component generation (21st.dev) |
| Serena | `mcp__serena__*` | Semantic code ops, project memory |
| Morphllm | `mcp__morphllm__*` | Pattern-based bulk edits |
| Playwright | `mcp__playwright__*` | Browser automation, E2E testing |

**All servers enabled in ultrathink mode.**

---

## 🆘 When Things Break

### App Won't Load
1. Check browser console for errors
2. Verify file integrity (no corrupted HTML)
3. Check Google Apps Script URL is accessible
4. Clear localStorage and reload

### Sync Not Working
1. Check internet connection
2. Verify WEBAPP_URL in code (line 624)
3. Check Google Apps Script is deployed
4. Inspect Network tab for failed requests

### Data Lost
1. Check localStorage in DevTools Application tab
2. Look for `athletesData`, `exercisesData`, `goalsData`
3. If empty, re-sync from Google Sheets
4. Check browser didn't clear storage

### Layout Broken
1. Check for CSS typo (missing `;` or `}`)
2. Verify no duplicate IDs in HTML
3. Test in Chrome first (better error messages)
4. Check viewport meta tag is present

---

## 📞 Contact & Support

**Project Owner**: Nikita Izboldin
**Repository**: https://github.com/nikitaizboldin/WU_Coach2_app
**Claude Configuration**: Uses SuperClaude Framework with ultrathink mode

**For Questions**:
1. Read constitution.md first
2. Read ULTRATHINK_MODE.md for analysis standards
3. Use Sequential MCP for complex debugging
4. Reference this CLAUDE.md for workflow

---

## ✅ Pre-Commit Checklist

Before committing code changes:

- [ ] Constitution compliance verified
- [ ] Single-file structure maintained
- [ ] Dark theme colors used
- [ ] Russian language preserved
- [ ] Mobile-first design confirmed
- [ ] Offline-first data flow intact
- [ ] No external dependencies added
- [ ] Console logging with emoji added
- [ ] Touch interactions tested
- [ ] Manual testing completed
- [ ] Git message is descriptive

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
**Framework**: SuperClaude + UltraThink Mode
**Status**: 🟢 Active Development

## Active Technologies
- Vanilla JavaScript ES6+ (arrow functions, async/await, destructuring, template literals) + None (zero dependencies per constitution - no npm packages, frameworks, or libraries) (001-goal-editing-athlete-sync)
- localStorage API (primary, 5-10MB limit) + Google Apps Script Web App (secondary sync) (001-goal-editing-athlete-sync)
- Vanilla JavaScript ES6+ (in-browser), HTML5, CSS3 + None (zero npm dependencies by constitution) (003-goal-fixes-and-creation)
- localStorage (primary) + Google Apps Script Web App (secondary sync) (003-goal-fixes-and-creation)
- JavaScript ES6+ (in-browser PWA), PostgreSQL 15+ (Supabase), SQL (schema/functions) + Supabase JS SDK v2.x (via CDN), localStorage API (browser native) (004-supabase-migration)
- Supabase PostgreSQL (cloud-hosted), localStorage (primary offline storage) (004-supabase-migration)

## Recent Changes
- 001-goal-editing-athlete-sync: Added Vanilla JavaScript ES6+ (arrow functions, async/await, destructuring, template literals) + None (zero dependencies per constitution - no npm packages, frameworks, or libraries)
- Следуй методологии SpecKit при разработке проекта, используя команды в правильной последовательности:

ПОРЯДОК РАБОТЫ:
1. /constitution - Создай конституцию проекта с принципами разработки
2. /specify - Преобразуй описание функционала в spec.md
3. /plan - Сгенерируй план реализации и дизайн-артефакты
4. /tasks - Создай упорядоченный список задач в tasks.md
5. /analyze - Проверь консистентность spec.md, plan.md и tasks.md
6. /implement - Выполни все задачи из tasks.md

АКТИВНО ПОДСКАЗЫВАЙ переходы между этапами:
- После обсуждения идеи: "Начнем с /constitution для установки принципов проекта"
- После принципов: "Используйте /specify для формализации требований"
- После спецификации: "Перейдем к /plan для создания архитектуры"
- После плана: "Выполните /tasks для генерации списка задач"
- После генерации задач: "Запустите /analyze для проверки артефактов"
- После анализа: "Готовы к /implement для реализации"

При любых изменениях требований возвращайся к /specify и проходи цикл заново.
