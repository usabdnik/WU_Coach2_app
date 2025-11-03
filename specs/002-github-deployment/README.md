# Feature 002: GitHub Deployment & Hosting

## Quick Summary

**Status**: Draft Specification Complete ✅
**Branch**: `002-github-deployment`
**Created**: 2025-11-03
**Priority**: P1 (Repository Setup), P2 (GitHub Pages), P3 (Auto Deployment)

## User Request (Original)

> "ещё нужно что бы проект был развернут на гитхабе тут: https://github.com/usabdnik/WU_Coach2_app"

**Translation**: Also need project deployed on GitHub at: https://github.com/usabdnik/WU_Coach2_app

## What This Feature Delivers

### User Story 1: Развертывание на GitHub (P1 - MVP) 🎯

**Problem**: Project code only exists locally, not accessible to others or for collaboration.

**Solution**: Push local git repository to GitHub at specified URL with full history and branches.

**Value**: Public code access, version control backup, foundation for GitHub features.

### User Story 2: Хостинг на GitHub Pages (P2)

**Problem**: Application only runs locally, no public URL for users to access.

**Solution**: Enable GitHub Pages to serve application at https://usabdnik.github.io/WU_Coach2_app/

**Value**: Free HTTPS hosting, global CDN, no infrastructure management, PWA works online and offline.

### User Story 3: Автоматическое развертывание (P3)

**Problem**: Manual deployment after each code change is tedious.

**Solution**: GitHub Pages automatically rebuilds on push to main branch.

**Value**: Continuous deployment, always-current live site, no manual steps.

## Key Technical Decisions

### Repository Configuration
- **URL**: https://github.com/usabdnik/WU_Coach2_app (user-specified)
- **Visibility**: Public (required for free GitHub Pages)
- **Default Branch**: main
- **Remote Name**: origin

### GitHub Pages Configuration
- **Source**: Deploy from main branch, root directory
- **URL**: https://usabdnik.github.io/WU_Coach2_app/
- **File Rename**: coach-pwa-app (7).html → index.html (cleaner URL)
- **HTTPS**: Automatic (GitHub provides free certificate)

### Deployment Strategy
- **Trigger**: Push to main branch (automatic)
- **Build Time**: 1-3 minutes typical, 5 minutes max
- **CDN**: GitHub's global CDN (fast worldwide access)
- **No Build Step**: Static HTML file, served as-is

## Constitution Compliance Check ✅

- ✅ **Single-File Architecture**: No new files, just git/GitHub config
- ✅ **Zero Dependencies**: GitHub is hosting, not a code dependency
- ✅ **Offline-First**: PWA works offline after first load from GitHub Pages
- ✅ **Mobile-Only**: Deployment doesn't affect mobile-first design
- ✅ **Fixed Dark Theme**: Deployment doesn't change theme
- ✅ **Russian Language**: Deployment doesn't change language

**This is pure infrastructure work** - no application code changes required.

## Next Steps

1. **Review Spec**: Read `spec.md` - verify GitHub URL and deployment requirements
2. **Implement P1**: Setup GitHub repository and push code
3. **Implement P2**: Enable GitHub Pages and test live site
4. **Implement P3**: Verify automatic deployment works
5. **Document**: Update README.md with live site URL

## Files in This Feature

- `spec.md` - Full feature specification (user stories, requirements, success criteria)
- `README.md` - This summary document
- (No plan.md or tasks.md needed - simple git operations, not code development)

## Quick Implementation Guide

### P1: Push to GitHub (5 minutes)

```bash
# Add GitHub remote
git remote add origin https://github.com/usabdnik/WU_Coach2_app.git

# Push all branches
git push -u origin main
git push --all origin

# Verify: Visit https://github.com/usabdnik/WU_Coach2_app
```

### P2: Enable GitHub Pages (2 minutes)

1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: main, folder: / (root)
4. Save
5. **IMPORTANT**: Rename `coach-pwa-app (7).html` to `index.html` (or create redirect)
6. Wait 2-3 minutes for deployment
7. Visit https://usabdnik.github.io/WU_Coach2_app/

### P3: Verify Auto Deployment (automatic)

- GitHub Pages auto-deploys on push to main by default
- Check Actions tab after push to see deployment workflow
- Verify live site updates within 5 minutes

## Important Notes

### File Rename Required

**Current**: `coach-pwa-app (7).html`
**Needed**: `index.html`

GitHub Pages looks for `index.html` by default. Options:
1. Rename file to `index.html` (simplest, recommended)
2. Create `index.html` that redirects to current file
3. Configure custom 404 page (complex, not recommended)

### CORS Configuration

Google Apps Script needs to allow requests from GitHub Pages domain:

- Open Apps Script project
- File → Project properties → Script properties
- Add allowed origin: `https://usabdnik.github.io`
- Deploy → Manage deployments → Edit → Who has access: Anyone

### Public Repository Required

GitHub Pages on free tier requires public repository. If repository must be private:
- Upgrade to GitHub Pro ($4/month)
- OR use alternative hosting (Netlify, Vercel - also free for static sites)

## Testing Checklist

After deployment:

- [ ] Visit https://github.com/usabdnik/WU_Coach2_app - repository visible
- [ ] Visit https://usabdnik.github.io/WU_Coach2_app/ - app loads
- [ ] Test on mobile (Safari iOS, Chrome Android) - all features work
- [ ] Test offline (airplane mode after first load) - app still works
- [ ] Push test commit to main - live site updates within 5 minutes
- [ ] Check HTTPS works - green lock in browser
- [ ] Test sync to Google Sheets - CORS configured correctly

## Success Criteria

✅ **P1 Complete**: Code on GitHub with full history
✅ **P2 Complete**: Live app at GitHub Pages URL, works on mobile, offline-capable
✅ **P3 Complete**: Push to main auto-deploys, live site always current

**Total Time**: ~10-15 minutes for P1+P2+P3 (mostly configuration, minimal coding)
