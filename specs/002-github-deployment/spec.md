# Feature Specification: GitHub Deployment & Hosting

**Feature Branch**: `002-github-deployment`
**Created**: 2025-11-03
**Status**: Draft
**Input**: User description: "ещё нужно что бы проект был развернут на гитхабе тут: https://github.com/usabdnik/WU_Coach2_app"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Развертывание на GitHub (Deploy to GitHub Repository) (Priority: P1) 🎯 MVP

Тренер хочет, чтобы код проекта был доступен на GitHub по адресу https://github.com/usabdnik/WU_Coach2_app. Он выполняет команды git для подключения удаленного репозитория и отправки кода. После этого проект виден на GitHub, все коммиты и история сохранены.

**English**: Coach wants project code available on GitHub at https://github.com/usabdnik/WU_Coach2_app. He executes git commands to add remote repository and push code. After this, project is visible on GitHub with all commits and history preserved.

**Why this priority**: Essential first step for any GitHub-based workflow. Without this, no other GitHub features (Pages, Actions, collaboration) are possible. This is the foundation for public access to code.

**Independent Test**: Can be fully tested by visiting GitHub URL and verifying repository exists, contains code files, commit history is intact, and branches are present.

**Acceptance Scenarios**:

1. **Given** local git repository exists with commit history, **When** developer adds GitHub remote URL https://github.com/usabdnik/WU_Coach2_app.git, **Then** git remote is configured successfully

2. **Given** GitHub remote is configured, **When** developer pushes main branch with `git push -u origin main`, **Then** code appears on GitHub repository at specified URL

3. **Given** code pushed to GitHub, **When** developer visits https://github.com/usabdnik/WU_Coach2_app, **Then** repository page displays with files (coach-pwa-app (7).html, README.md, etc.), commit history visible

4. **Given** local repository has multiple branches (main, feature branches), **When** developer pushes all branches with `git push --all origin`, **Then** all branches appear in GitHub repository branch selector

5. **Given** repository pushed to GitHub, **When** developer makes local commit and pushes, **Then** new commit appears in GitHub repository immediately

6. **Given** GitHub repository exists, **When** other developers visit URL, **Then** they can view code, clone repository, and see full project documentation

---

### User Story 2 - Хостинг на GitHub Pages (GitHub Pages Hosting) (Priority: P2)

Тренер хочет, чтобы приложение было доступно онлайн по URL (например, https://usabdnik.github.io/WU_Coach2_app/). Он включает GitHub Pages в настройках репозитория, и приложение становится доступным через браузер. После первой загрузки приложение работает офлайн.

**English**: Coach wants application accessible online via URL (e.g., https://usabdnik.github.io/WU_Coach2_app/). He enables GitHub Pages in repository settings, and application becomes accessible through browser. After first load, application works offline.

**Why this priority**: Natural extension of P1 - once code is on GitHub, hosting it via GitHub Pages provides public access without additional infrastructure. Free HTTPS, CDN, and simple configuration.

**Independent Test**: Enable GitHub Pages → visit Pages URL → verify app loads and functions correctly → test offline mode (disconnect network, verify app still works).

**Acceptance Scenarios**:

1. **Given** GitHub repository exists at https://github.com/usabdnik/WU_Coach2_app, **When** developer enables GitHub Pages in repository Settings → Pages → Source: main branch, **Then** GitHub builds and deploys site

2. **Given** GitHub Pages enabled, **When** developer visits https://usabdnik.github.io/WU_Coach2_app/, **Then** application loads and displays correctly (HTML, CSS, JavaScript all functional)

3. **Given** application loaded from GitHub Pages URL, **When** user disconnects from internet (airplane mode), **Then** application continues to work (PWA offline capability intact)

4. **Given** GitHub Pages site live, **When** developer pushes new commit to main branch, **Then** site automatically rebuilds and updates within 2-5 minutes

5. **Given** application served from GitHub Pages, **When** user accesses on mobile device (Safari iOS, Chrome Android), **Then** all functionality works identically to local version (touch interactions, localStorage, dark theme)

6. **Given** GitHub Pages URL shared with others, **When** they visit URL on any device, **Then** they can use application immediately without installation (progressive web app behavior)

---

### User Story 3 - Настройка автоматического развертывания (Automatic Deployment Setup) (Priority: P3)

Тренер хочет, чтобы каждый push в main ветку автоматически обновлял live сайт. Он настраивает GitHub Actions workflow (или полагается на встроенное поведение GitHub Pages), и после этого любые изменения в коде сразу отражаются на сайте.

**English**: Coach wants every push to main branch to automatically update live site. He configures GitHub Actions workflow (or relies on built-in GitHub Pages behavior), and after this any code changes immediately reflect on site.

**Why this priority**: Quality of life improvement - eliminates manual deployment steps. Less critical than P1/P2 since GitHub Pages already auto-deploys on push by default, but explicit workflow provides visibility and control.

**Independent Test**: Push commit to main → wait 2-3 minutes → visit live site → verify changes visible.

**Acceptance Scenarios**:

1. **Given** GitHub Pages enabled with main branch source, **When** developer pushes commit to main branch, **Then** GitHub automatically triggers Pages rebuild (visible in Actions tab)

2. **Given** automatic deployment active, **When** developer checks Actions tab after push, **Then** "pages build and deployment" workflow shows status (queued → in progress → success)

3. **Given** deployment workflow running, **When** developer waits for completion (typically 1-3 minutes), **Then** live site reflects new changes (verified by viewing source or testing new feature)

4. **Given** deployment fails (e.g., invalid HTML), **When** developer checks Actions tab, **Then** error message displays with failure reason and logs for debugging

5. **Given** multiple developers pushing to main, **When** commits pushed in quick succession, **Then** GitHub queues deployments and processes them in order (latest commit always deployed)

6. **Given** feature branch merged to main via pull request, **When** merge completes, **Then** automatic deployment triggers and live site updates with merged changes

---

### Edge Cases

#### GitHub Repository Setup Edge Cases

- **What happens if repository https://github.com/usabdnik/WU_Coach2_app already exists?**
  Check if repository is owned by user `usabdnik`. If yes: add as remote and push (may need `git push -f` if histories diverge). If no: create new repository at that URL or use different URL. Recommendation: verify ownership before proceeding.

- **What happens if push is rejected (non-fast-forward)?**
  Fetch remote changes first (`git fetch origin`), merge or rebase local changes, then push. If histories are completely unrelated, use `git push --force` (ONLY if safe - no data loss).

- **What happens if authentication fails (no access to GitHub)?**
  User needs GitHub account credentials or SSH key. Use GitHub Personal Access Token (PAT) for HTTPS authentication or SSH key for SSH authentication. Configure git credentials before pushing.

- **What happens if repository is private vs public?**
  GitHub Pages requires public repository on free tier. If repository is private, GitHub Pages won't work (requires GitHub Pro). Make repository public or upgrade plan.

#### GitHub Pages Hosting Edge Cases

- **What happens if coach-pwa-app (7).html is not named index.html?**
  GitHub Pages looks for index.html by default. Solution: rename file to index.html (breaks local references) OR create index.html that redirects/loads the actual file OR configure GitHub Pages to serve specific file (not directly supported - use redirect).

- **What happens if file name has spaces (7)?**
  URL encoding issues - GitHub Pages will serve but URL looks ugly (coach-pwa-app%20(7).html). Recommendation: rename to `coach-pwa-app.html` or `index.html` for cleaner URLs.

- **What happens if PWA service worker conflicts with GitHub Pages?**
  No conflict expected - GitHub Pages serves static files, service worker runs client-side. Ensure service worker caches correct GitHub Pages URL paths (not local file:// paths).

- **What happens if Google Apps Script CORS blocks GitHub Pages domain?**
  Google Apps Script needs to allow requests from GitHub Pages domain. Add `https://usabdnik.github.io` to CORS allowed origins in Apps Script web app settings (Access → Execute as: me, Who has access: Anyone).

- **What happens if GitHub Pages quota exceeded?**
  Unlikely for static site - GitHub Pages has 100GB bandwidth/month soft limit. Single HTML file <1MB, even 100,000 loads = <100GB. Monitor usage in repository Settings → Pages.

#### Automatic Deployment Edge Cases

- **What happens if deployment fails due to build error?**
  GitHub Actions shows error in workflow log. For static HTML, builds rarely fail (no compilation). If Pages disabled/re-enabled, check Settings → Pages → Source is still configured.

- **What happens if deployment takes longer than expected (>5 minutes)?**
  Check GitHub Status page (https://www.githubstatus.com) for outages. If no outage, check Actions tab for stuck workflow. Can manually trigger rebuild by pushing empty commit (`git commit --allow-empty -m "Trigger rebuild"`).

- **What happens if multiple features deployed simultaneously (merge conflicts)?**
  Use feature branches → merge one at a time → test live site after each merge. Avoid force pushing to main (breaks history). Use pull requests for code review before merge.

---

## Requirements *(mandatory)*

### Functional Requirements

#### GitHub Repository Setup

- **FR-001**: System MUST push local git repository to GitHub remote at https://github.com/usabdnik/WU_Coach2_app
- **FR-002**: System MUST preserve full commit history when pushing to GitHub
- **FR-003**: System MUST push all branches (main and feature branches) to GitHub remote
- **FR-004**: System MUST configure git remote with name "origin" pointing to GitHub URL
- **FR-005**: System MUST authenticate with GitHub using Personal Access Token or SSH key
- **FR-006**: Repository MUST be publicly accessible (required for free GitHub Pages)
- **FR-007**: System MUST include README.md with project description and usage instructions
- **FR-008**: System MUST include .gitignore to exclude unnecessary files (if any)

#### GitHub Pages Configuration

- **FR-009**: System MUST enable GitHub Pages with main branch as source
- **FR-010**: System MUST serve application from root directory (/)
- **FR-011**: System MUST rename coach-pwa-app (7).html to index.html for default serving
- **FR-012**: GitHub Pages URL MUST be https://usabdnik.github.io/WU_Coach2_app/
- **FR-013**: System MUST serve application with HTTPS (GitHub provides free certificate)
- **FR-014**: Application MUST load and function identically to local version when served from GitHub Pages
- **FR-015**: PWA offline capability MUST work after first load from GitHub Pages URL
- **FR-016**: Application MUST work on mobile browsers (Safari iOS, Chrome Android) when served from GitHub Pages

#### Automatic Deployment

- **FR-017**: GitHub Pages MUST automatically rebuild when commits pushed to main branch
- **FR-018**: Deployment MUST complete within 5 minutes of push (typical 1-3 minutes)
- **FR-019**: System MUST display deployment status in GitHub Actions tab (if using Actions) or Pages settings
- **FR-020**: Failed deployments MUST show error messages with actionable information
- **FR-021**: System MUST handle multiple rapid pushes by queuing deployments
- **FR-022**: Latest commit MUST always be deployed (no stale versions)

### Key Entities *(infrastructure focus)*

#### GitHub Repository

Represents the remote Git repository hosted on GitHub.

**Attributes**:
- `url`: https://github.com/usabdnik/WU_Coach2_app (immutable, defined by user)
- `owner`: usabdnik (GitHub username)
- `name`: WU_Coach2_app (repository name)
- `visibility`: public (required for free GitHub Pages)
- `default_branch`: main (where deployments happen)
- `branches`: List of branch names (main, 001-goal-editing-athlete-sync, etc.)
- `pages_enabled`: boolean (true when GitHub Pages configured)
- `pages_url`: https://usabdnik.github.io/WU_Coach2_app/ (live site URL)

**Configuration**:
- Settings → Pages → Source: Deploy from a branch
- Settings → Pages → Branch: main, folder: / (root)
- Settings → Pages → Custom domain: (empty, using default .github.io subdomain)

---

#### Deployment

Represents a single deployment of code to GitHub Pages.

**Attributes**:
- `commit_sha`: Git commit hash that triggered deployment
- `branch`: main (source branch)
- `status`: queued | in_progress | success | failure
- `started_at`: ISO timestamp when deployment started
- `completed_at`: ISO timestamp when deployment finished
- `duration`: Time taken (typically 1-3 minutes)
- `url`: https://usabdnik.github.io/WU_Coach2_app/ (deployed site URL)

**Triggers**:
- Push to main branch (automatic)
- Manual trigger from Actions tab (on demand)
- Repository settings change (e.g., re-enabling Pages)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

#### Repository Setup Success Criteria

- **SC-001**: Repository visible at https://github.com/usabdnik/WU_Coach2_app with all files and commit history

- **SC-002**: All branches present in GitHub (main and feature branches like 001-goal-editing-athlete-sync)

- **SC-003**: README.md displays on repository homepage with project description and instructions

- **SC-004**: Other developers can clone repository and run application locally without issues

#### GitHub Pages Hosting Success Criteria

- **SC-005**: Application accessible at https://usabdnik.github.io/WU_Coach2_app/ and loads within 3 seconds on 3G mobile network

- **SC-006**: Application functions identically to local version (all features work: goals, athletes, sync, offline mode)

- **SC-007**: PWA offline capability works: user loads app online → goes offline → app continues functioning with localStorage data

- **SC-008**: Application works on mobile browsers (Safari iOS 14+, Chrome Android 90+) with 100% feature parity

- **SC-009**: HTTPS certificate valid (green lock in browser, no security warnings)

- **SC-010**: Application loads correctly on first visit (no 404 errors, all assets load)

#### Automatic Deployment Success Criteria

- **SC-011**: Pushing commit to main triggers deployment visible in GitHub Actions/Pages settings

- **SC-012**: Deployment completes within 5 minutes of push (95th percentile, typically 1-3 minutes)

- **SC-013**: Live site reflects new changes after deployment completes (verified by viewing source or testing feature)

- **SC-014**: Deployment status visible to developers (success/failure indication in GitHub UI)

- **SC-015**: Failed deployments provide actionable error messages for debugging

- **SC-016**: Multiple rapid pushes handled gracefully (queued, not dropped or conflicted)
