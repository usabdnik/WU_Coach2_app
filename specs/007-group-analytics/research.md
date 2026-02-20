# Research: Аналитика по группам и показателям

**Feature**: 007-group-analytics  
**Date**: 2025-11-23  
**Status**: Complete

## Decisions Made

### 1. Chart Visualization Approach

**Decision**: Use vanilla JavaScript + SVG for chart rendering

**Rationale**:
- Zero runtime dependencies requirement (constitution principle)
- SVG is native browser technology (no external library needed)
- Lightweight and performant for small datasets (50-100 athletes)
- Full control over styling to match dark theme
- Mobile-friendly (vector graphics scale perfectly)
- Easier debugging than Canvas API

**Alternatives Considered**:
1. **Chart.js via CDN** - Rejected: Violates zero dependencies principle, adds 60KB overhead
2. **Canvas API** - Rejected: More complex to implement, harder to style, less accessible
3. **HTML tables only** - Rejected: No visual representation, harder to compare groups

**Implementation Pattern**:
```javascript
function renderStatisticsChart(data) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 300 200');
  // Add bars for each group
  data.forEach((group, index) => {
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bar.setAttribute('x', index * 50);
    bar.setAttribute('y', 200 - group.value);
    bar.setAttribute('width', 40);
    bar.setAttribute('height', group.value);
    bar.setAttribute('fill', '#4c9eff');
    svg.appendChild(bar);
  });
  return svg;
}
```

---

### 2. Statistics Calculation Pattern

**Decision**: Client-side calculation using Array.reduce() with groupBy pattern

**Rationale**:
- Data already in localStorage (athletesData, performances)
- Small dataset size (~50-100 athletes, ~1000 performances) - calculation <100ms
- No server roundtrip needed (offline-first)
- Real-time updates without sync lag
- Follows existing codebase patterns (functional programming style)

**Alternatives Considered**:
1. **Server-side aggregation** - Rejected: Requires Supabase queries, breaks offline capability
2. **Web Workers** - Rejected: Overkill for small dataset, adds complexity
3. **Lodash groupBy** - Rejected: Violates zero dependencies

**Implementation Pattern**:
```javascript
function calculateGroupAverages(groupName, exerciseName) {
  const currentSeason = getCurrentSeason();
  
  // Filter athletes by group
  const groupAthletes = athletesData.filter(a => a.group === groupName);
  const athleteIds = groupAthletes.map(a => a.id);
  
  // Filter performances by exercise and season
  const relevantPerformances = performances.filter(p => 
    athleteIds.includes(p.athlete_id) &&
    p.exercise_name === exerciseName &&
    p.month >= currentSeason.start &&
    p.month <= currentSeason.end
  );
  
  // Calculate statistics
  const values = relevantPerformances.map(p => p.value);
  return {
    count: values.length,
    average: values.reduce((sum, v) => sum + v, 0) / values.length,
    best: Math.max(...values),
    worst: Math.min(...values)
  };
}
```

---

### 3. Navigation Pattern

**Decision**: Extend existing view-container show/hide pattern with new analytics-view

**Rationale**:
- Consistent with current codebase architecture
- Single-page app navigation already implemented
- No routing library needed (matches zero dependencies)
- Smooth transitions with CSS classes
- Mobile-friendly (no page reloads)

**Alternatives Considered**:
1. **Hash-based routing** - Rejected: Unnecessary complexity for 4 views
2. **Separate HTML page** - Rejected: Violates single-file architecture
3. **Modal overlay** - Rejected: Analytics needs full screen, not popup

**Existing Pattern** (from index.html):
```javascript
// Current views: athletes-list, athlete-detail, goals-view
function showView(viewId) {
  document.querySelectorAll('.view-container').forEach(v => {
    v.classList.remove('show');
  });
  document.getElementById(viewId).classList.add('show');
}

// NEW: Add analytics-view to navigation
function openAnalyticsView() {
  showView('analytics-view');
  loadGroupStatistics();
  renderGroupCards();
}
```

**Navigation Button Addition**:
```html
<!-- Add to existing bottom nav (between Goals and Settings) -->
<nav class="bottom-nav">
  <button onclick="showView('athletes-list')">👤 Спортсмены</button>
  <button onclick="showView('goals-view')">🎯 Цели</button>
  <button onclick="openAnalyticsView()">📊 Аналитика</button> <!-- NEW -->
  <button onclick="openSettings()">⚙️ Настройки</button>
</nav>
```

---

### 4. Data Aggregation Pattern

**Decision**: Functional pipeline with Array methods (filter → map → reduce)

**Rationale**:
- Readable and maintainable code
- Follows ES6+ best practices
- Chain operations naturally
- Easy to test individual steps
- Performance acceptable for dataset size

**Alternatives Considered**:
1. **Imperative loops (for/while)** - Rejected: More verbose, harder to read
2. **SQL-style queries to Supabase** - Rejected: Breaks offline capability
3. **Pre-calculated aggregates** - Rejected: Adds storage complexity, stale data risk

**Implementation Example**:
```javascript
function getGroupStatisticsByExercise(exerciseName) {
  const season = getCurrentSeason();
  const groups = ['М-19', 'М-117', 'М-118', 'А-29', 'А-218', 'А-219'];
  
  return groups.map(groupName => {
    // Step 1: Filter athletes in group
    const groupAthletes = athletesData
      .filter(a => a.group === groupName)
      .map(a => a.id);
    
    // Step 2: Filter performances for group + exercise + season
    const performances = performancesData.filter(p =>
      groupAthletes.includes(p.athlete_id) &&
      p.exercise_name === exerciseName &&
      p.month >= season.start &&
      p.month <= season.end
    );
    
    // Step 3: Aggregate statistics
    const values = performances.map(p => p.value);
    return {
      groupName,
      athleteCount: groupAthletes.length,
      performanceCount: values.length,
      average: values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0,
      best: values.length ? Math.max(...values) : 0,
      worst: values.length ? Math.min(...values) : 0
    };
  });
}
```

---

## Technical Best Practices Applied

### Performance Optimization
- **Lazy calculation**: Statistics computed only when analytics page opened
- **Memoization candidate**: Could cache results per exercise (future optimization)
- **Efficient filtering**: Single pass through data arrays
- **No DOM thrashing**: Build elements in memory, append once

### Mobile UX Best Practices
- **Touch targets**: 44x44px minimum (Apple HIG standard)
- **Scrollable containers**: Long lists with smooth scroll
- **Loading indicators**: Show "Загрузка..." during calculations
- **Error states**: "Нет данных" when no performances found

### Offline-First Pattern
- **Data source**: localStorage only (no network dependency)
- **Sync indicator**: Show "⏳" for unsaved group assignments
- **Graceful degradation**: Display partial data if some groups missing

### Accessibility (Basic)
- **Semantic HTML**: Use `<table>` for statistics (not divs)
- **Alt text**: SVG titles for screen readers
- **Focus management**: Keyboard navigation for modals

---

## Integration Points

### Existing Functions to Reuse
1. `getCurrentSeason()` - Season date calculation (Sept-Aug)
2. `showView(viewId)` - Navigation between views
3. `saveToLocalStorage(key, data)` - Persist data locally
4. `syncPendingChanges()` - Sync to Supabase when online

### Existing Constants to Reuse
1. `AVAILABLE_GROUPS` - List of valid groups ['М-19', 'М-117', ...]
2. Dark theme colors from CSS variables

### Existing Data Structures
1. `athletesData` - Array of athlete objects with `group` field
2. `performancesData` - Array of performance records
3. `exercisesData` - Array of exercise definitions
4. `pendingChanges` - Queue for offline mutations

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance slow with 100+ athletes | Low | Medium | Use debouncing, lazy loading, consider memoization |
| localStorage quota exceeded | Low | High | Monitor usage, warn at 80%, clear old data |
| SVG rendering on old iOS | Low | Medium | Test on iOS 13+, fallback to table-only view |
| Data inconsistency (group assignment) | Medium | Medium | Validate group values, show pending sync status |

---

## Implementation Dependencies

**No external dependencies required** - all functionality achievable with:
- Vanilla JavaScript ES6+ (Array methods, arrow functions, template literals)
- Native SVG API (document.createElementNS)
- Existing localStorage API
- Existing Supabase sync pattern

---

## Testing Strategy

**Manual Testing Protocol**:
1. **Group Cards**: Verify all groups show correct athlete counts
2. **No Group List**: Check athletes with null/empty group appear
3. **Exercise Selection**: Test dropdown filtering
4. **Statistics Display**: Verify calculations (average, best, worst)
5. **Group Assignment**: Test assigning group from "No Group" modal
6. **Offline Mode**: Test analytics page works in airplane mode
7. **Sync Flow**: Test group assignment syncs to Supabase when online

**Test Data**:
- Create 5-10 test athletes per group
- Add 10-20 performance records per athlete
- Include athletes with null group
- Test with empty performances (no data case)

---

**Research Complete**: All technical decisions made, ready for Phase 1 (Design)
