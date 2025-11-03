# 🧠 ULTRATHINK MODE - PERMANENTLY ACTIVE

**Status**: 🟢 **ALWAYS ON** | **Priority**: 🔴 **CRITICAL**

---

## Configuration Override

This file activates **permanent maximum depth analysis mode** for WU Coach 2 project.

### Mode Flags
```
--ultrathink --all-mcp --think-hard --delegate=auto
```

### MCP Server Matrix: ALL ENABLED

| Server | Status | Purpose |
|--------|--------|---------|
| Sequential | ✅ ACTIVE | Multi-step reasoning, hypothesis testing |
| Context7 | ✅ ACTIVE | Official docs, framework patterns |
| Magic | ✅ ACTIVE | UI component generation (21st.dev) |
| Serena | ✅ ACTIVE | Semantic code ops, project memory |
| Morphllm | ✅ ACTIVE | Pattern-based bulk edits |
| Playwright | ✅ ACTIVE | Browser automation, E2E testing |

---

## Behavioral Requirements

### 1. Analysis Depth: MAXIMUM (~32K tokens)

**Every task must include**:
- 🔍 **Root cause analysis** (not just symptoms)
- 🎯 **Goal alignment** (why this change matters)
- ⚖️ **Trade-off evaluation** (pros/cons/alternatives)
- 🔒 **Security implications** (attack vectors, data safety)
- ⚡ **Performance impact** (mobile device constraints)
- 🏗️ **Architecture coherence** (single-file pattern preservation)
- 📊 **Data integrity** (offline-first consistency)
- 🎨 **UX consequences** (mobile-first touch optimization)
- 🔮 **Future maintenance** (technical debt assessment)

### 2. Sequential Thinking: MANDATORY

Use `mcp__sequential-thinking__sequentialthinking` for:
- ✅ ALL feature planning
- ✅ ALL bug investigations
- ✅ ALL architecture decisions
- ✅ ALL code reviews
- ✅ Complex explanations
- ✅ Even "simple" questions (depth matters)

**Thinking Protocol**:
1. **Hypothesis formulation** → What do we think is true?
2. **Evidence gathering** → What does the code/docs say?
3. **Validation** → Does evidence support hypothesis?
4. **Iteration** → If not, revise and repeat
5. **Conclusion** → State findings with confidence level

### 3. Tool Selection: POWER FIRST

**Priority Matrix** (use strongest tool available):
1. **Sequential MCP** → Complex multi-step reasoning
2. **Serena MCP** → Symbol operations, semantic search
3. **Context7 MCP** → Official framework documentation
4. **Task Agent** → Delegation for >3 parallel operations
5. **Native tools** → Only when MCP not applicable

### 4. Output Standards: COMPREHENSIVE

**All responses must include**:
- 📋 **TodoWrite tracking** (for multi-step tasks)
- 🔗 **Code references** (file:line format)
- 📊 **Data flow diagrams** (for state changes)
- ⚠️ **Risk assessment** (what could go wrong)
- ✅ **Validation steps** (how to verify correctness)
- 🧪 **Test scenarios** (even without automated tests)
- 📚 **Documentation impact** (constitution updates needed)

---

## Project-Specific Ultrathink Focus

### WU Coach 2 Critical Domains

#### 1. **Offline-First Data Integrity**
- localStorage consistency
- pendingChanges queue reliability
- Sync conflict resolution
- Data loss prevention

#### 2. **Mobile Performance**
- Touch responsiveness (<100ms)
- Low-end device compatibility (2015+ phones)
- Battery efficiency
- Network resilience

#### 3. **Single-File Architecture**
- Pattern preservation
- Code organization within constraints
- Future extensibility planning
- Migration paths (if needed)

#### 4. **Russian UX Excellence**
- Language-specific optimizations
- Cultural UI patterns
- Emoji semantics
- Date/time formatting

#### 5. **Security Hardening Roadmap**
- Authentication strategy
- Data encryption planning
- XSS prevention
- CSRF protection

#### 6. **PWA Evolution Path**
- Service Worker implementation
- App manifest design
- Install prompt UX
- Update mechanism

---

## Enforcement Rules

### 🔴 CRITICAL: Never Skip

1. **Sequential MCP** for any analysis task
2. **Evidence gathering** before conclusions
3. **Security review** for data/state changes
4. **Performance assessment** for UI changes
5. **Architecture compliance** check (constitution.md)

### 🟡 IMPORTANT: Strong Preference

1. **TodoWrite** for multi-step operations
2. **Code references** in explanations
3. **Alternative approaches** documented
4. **Risk assessment** included
5. **Test scenarios** specified

### 🟢 RECOMMENDED: Apply When Practical

1. **Diagrams** for complex flows
2. **Memory updates** for learned patterns
3. **Constitution amendments** for new patterns
4. **Cross-session context** preservation

---

## Example: UltraThink in Action

### ❌ Standard Approach
```
User: "Add a search filter for exercise type"
Assistant: "I'll add a new chip filter..."
[Implements without deep analysis]
```

### ✅ UltraThink Approach
```
User: "Add a search filter for exercise type"
Assistant: [Uses Sequential MCP]

1. HYPOTHESIS: Exercise filter similar to group filter pattern
2. EVIDENCE GATHERING:
   - Read coach-pwa-app (7).html:540-546 (existing filters)
   - Analyze exercisesData structure (line 627)
   - Check filtering logic (line 786-791)
3. ARCHITECTURE ANALYSIS:
   - Single-file: Add HTML chip + CSS + JS filter logic
   - State: Extend currentFilter or add exerciseFilter variable?
   - Data: exercisesData already loaded (line 711)
4. TRADE-OFFS:
   - Option A: Extend currentFilter (simpler, less flexible)
   - Option B: Separate exerciseFilter (cleaner separation)
5. SECURITY: No user input, client-side filtering, safe
6. PERFORMANCE: Array.filter() on small dataset (<100 items), fast
7. UX: Second filter row or combined? Touch target size?
8. RECOMMENDATION: [Detailed implementation plan]
```

---

## Token Budget Optimization

While ultrathink uses maximum depth (~32K tokens), optimize through:

1. **Phased Analysis**: Break mega-tasks into phases
2. **Memory System**: Store learnings across sessions
3. **Progressive Detail**: Start broad → drill deep where needed
4. **Parallel Thinking**: Independent analyses in parallel
5. **Context Efficiency**: Read code once, reference multiple times

**Target**: High depth, smart efficiency, zero waste

---

## Session Checklist

**At Session Start**:
- [ ] Read `ultrathink_mode_permanent` memory (Serena)
- [ ] Read `.specify/memory/constitution.md` (architecture)
- [ ] Activate ultrathink behavioral mode
- [ ] Enable all MCP servers

**During Session**:
- [ ] Use Sequential MCP for analysis tasks
- [ ] Apply comprehensive thinking standards
- [ ] Document decisions in memory
- [ ] Track progress with TodoWrite

**At Session End**:
- [ ] Update memory with learnings
- [ ] Save session context (Serena)
- [ ] Commit code changes
- [ ] Clean up temporary files

---

## Permanence Declaration

**This setting is PERMANENT and IMMUTABLE unless explicitly disabled by user command.**

Valid disable commands:
- "отключи ultrathink"
- "disable ultrathink mode"
- "switch to normal mode"

**Until then**: ULTRATHINK MODE ALWAYS ON 🧠⚡

---

**Version**: 1.0.0
**Activated**: 2025-11-02
**Authority**: Nikita Izboldin (Project Owner)
**Scope**: ALL sessions, ALL tasks, ALL contexts
**Enforcement**: MANDATORY
