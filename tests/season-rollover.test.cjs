const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');

const html = fs.readFileSync(`${__dirname}/../index.html`, 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(m => m[1]).find(s => s.includes('function getCurrentSeason'));
const athlete = { id: 'a', name: 'Тестовый Ученик', group_name: 'М-19', status: 'active' };
const exercises = [
    { id: 'pull', name: 'Подтягивания' },
    { id: 'push', name: 'Отжимания от пола' },
    { id: 'dips', name: 'Отжимания от брусьев' }
];
function row(id, date, value, field = 'pull', athleteId = 'a') {
    return { id, athlete_id: athleteId, exercise_id: field, value, recorded_at: date,
        exercises: { name: exercises.find(e => e.id === field).name }, updated_at: `${date}T12:00:00Z` };
}
const history = [row('old-sept', '2025-09-15', 19), row('old-aug', '2026-08-31', 17)];

function runtime(rows = history, storage = new Map()) {
    const nodes = new Map();
    const handlers = new Map();
    const alerts = [];
    function element(id) {
        if (!nodes.has(id)) {
            const classes = new Set();
            nodes.set(id, { value: '', innerHTML: '', textContent: '', style: {}, disabled: false,
                classList: { add: (...s) => s.forEach(x => classes.add(x)), remove: (...s) => s.forEach(x => classes.delete(x)), contains: s => classes.has(s) },
                addEventListener: (event, fn) => handlers.set(`${id}:${event}`, fn),
                setAttribute() {}, after() {}, appendChild() {}, focus() {}, reset() {} });
        }
        return nodes.get(id);
    }
    let today = '2026-09-21T12:00:00';
    class FakeDate extends Date {
        constructor(...args) { super(...(args.length ? args : [today])); }
        static now() { return new Date(today).getTime(); }
    }
    const context = vm.createContext({
        console: { log() {}, warn() {}, error() {} }, Date: FakeDate, crypto: { randomUUID },
        setTimeout() {}, clearTimeout() {}, setInterval() {},
        navigator: { onLine: true }, window: { supabaseSDKLoaded: true,
            addEventListener: (event, fn) => handlers.set(`window:${event}`, fn),
            location: { reload: () => handlers.set('reloaded', true) } },
        alert: message => alerts.push(message), confirm: () => true,
        document: { addEventListener() {}, getElementById: element, createElement: () => element(`new-${nodes.size}`),
            querySelectorAll: () => [], querySelector: () => null },
        localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
        fetch() { throw new Error('Network forbidden in local tests'); }
    });
    vm.runInContext(script, context);
    const run = source => vm.runInContext(source, context);
    const json = source => JSON.parse(run(`JSON.stringify(${source})`));
    context.fixture = { athlete, exercises, rows: structuredClone(rows) };
    run(`currentSeason = getCurrentSeason(); exercisesData = fixture.exercises;
        athletesData = [transformSupabaseAthlete(fixture.athlete, fixture.rows)];
        seasonDataReady = true; hasStorageWriteLock = true; calculateAllTimeRecords();`);
    return { context, run, json, storage, nodes, element, handlers, alerts, setDate: date => { today = date; } };
}

function database(rt, { failOnce = false, commitThenFail = false, cap = 500, readHook } = {}) {
    const rows = structuredClone(history);
    const calls = [];
    let failure = failOnce || commitThenFail;
    const db = {
        from(table) {
            let action = 'read'; let payload; let offset = 0; let end = 499;
            const query = {
                select() { return this; }, order() { return this; }, eq() { return this; },
                range(a, b) { offset = a; end = b; return this; },
                update(data) { action = 'update'; payload = data; return this; },
                upsert(data, options) { action = 'upsert'; payload = structuredClone(data); assert.equal(options.onConflict, 'id'); return this; },
                delete() { throw new Error('DELETE forbidden: history must survive'); },
                insert() { throw new Error('Non-idempotent INSERT forbidden'); },
                async then(resolve, reject) {
                    try {
                        calls.push({ table, action, payload, offset });
                        if (action === 'upsert') {
                            if (failure && !commitThenFail) { failure = false; return resolve({ error: { message: 'offline' } }); }
                            const index = rows.findIndex(r => r.id === payload.id);
                            if (index < 0) rows.push({ ...payload, exercises: exercises.find(e => e.id === payload.exercise_id) });
                            else rows[index] = { ...rows[index], ...payload };
                            if (failure) { failure = false; return resolve({ error: { message: 'response lost after commit' } }); }
                            return resolve({ error: null });
                        }
                        if (action === 'update') return resolve({ error: null });
                        if (readHook) await readHook(table, offset);
                        const data = table === 'performances' ? rows.slice(offset, Math.min(end + 1, offset + cap))
                            : table === 'athletes' ? [athlete] : table === 'exercises' ? exercises : [];
                        return resolve({ data, error: null });
                    } catch (error) { return reject(error); }
                }
            };
            return query;
        }
    };
    rt.context.mockDB = db;
    rt.run('supabaseClient = mockDB');
    return { rows, calls };
}

function edit(rt, value, monthIndex = 0, field = 'pullUps') {
    rt.run(`queuePerformanceValues(athletesData[0], [{ monthIndex: ${monthIndex}, field: '${field}', value: ${value} }], currentSeason.name); saveToLocalStorage();`);
}

test('old season remains history; new season cells empty and all-time record retained', () => {
    const rt = runtime();
    assert.equal(rt.json('currentSeason.name'), '2026-2027');
    assert.ok(rt.json('athletesData[0].performance').every(p => p.pullUps === null && p.pushUps === null && p.dips === null));
    assert.equal(rt.json('allTimeRecords.a.pullUps'), 19);
    assert.deepEqual(rt.json('athletesData[0].performanceHistory'), history);
    assert.deepEqual(rt.json('athletesData[0].records.pullUps'), {});
});

test('all 12 months map to the correct season, with inclusive September and exclusive next September', () => {
    const rt = runtime([...history, row('sept', '2026-09-01', 5), row('jan', '2027-01-31', 6), row('aug', '2027-08-31', 7), row('future', '2027-09-01', 9)]);
    assert.equal(rt.json('athletesData[0].performance[0].pullUps'), 5);
    assert.equal(rt.json('athletesData[0].performance[4].pullUps'), 6);
    assert.equal(rt.json('athletesData[0].performance[11].pullUps'), 7);
    for (let month = 0; month < 12; month++) {
        assert.equal(rt.json(`performanceSeason(performanceDate('2026-2027', ${month}))`), '2026-2027');
    }
    assert.equal(rt.json("performanceSeason('2026-02-30')"), null);
    assert.equal(rt.json("getCurrentSeason(new Date(2026, 7, 31, 23, 59)).name"), '2025-2026');
    assert.equal(rt.json("getCurrentSeason(new Date(2026, 8, 1, 0, 0)).name"), '2026-2027');
});

test('same-month selection independent of response order; zero does not resurrect an older result', () => {
    const rows = [row('first', '2026-09-10', 10), row('second', '2026-09-20', 0)];
    for (const data of [rows, [...rows].reverse()]) {
        const rt = runtime(data);
        assert.equal(rt.json('athletesData[0].performance[0].pullUps'), 0);
        assert.equal(rt.json('athletesData[0].performanceIds["0:pullUps"]'), 'second');
        assert.equal(rt.json('allTimeRecords.a.pullUps'), 10);
    }
});

test('new edit, correction and zero preserve every previous-season row and reuse UUID', async () => {
    const rt = runtime(); const db = database(rt);
    edit(rt, 5); const id = rt.json('pendingChanges[0].data.id');
    edit(rt, 8); edit(rt, 0);
    assert.ok(rt.json('pendingChanges').every(c => c.data.id === id && c.data.recorded_at === '2026-09-15'));
    await rt.run('syncPendingChangesToSupabase()');
    assert.deepEqual(db.rows.slice(0, 2), history);
    assert.equal(db.rows.length, 3); assert.equal(db.rows[2].value, 0);
    assert.equal(rt.json('pendingChanges.length'), 0);
    rt.run('loadFromLocalStorage(); prepareSeasonStorage()');
    assert.equal(rt.json('athletesData[0].performance[0].pullUps'), 0);
});

for (const failure of ['failOnce', 'commitThenFail']) {
    test(`${failure}: retry preserves history, ordering and stable UUID`, async () => {
        const rt = runtime(); const db = database(rt, { [failure]: true });
        edit(rt, 3); edit(rt, 7);
        await assert.rejects(rt.run('syncPendingChangesToSupabase()'));
        assert.equal(db.calls.filter(c => c.action === 'upsert').length, 1);
        assert.equal(rt.json('pendingChanges.length'), 2);
        assert.deepEqual(db.rows.slice(0, 2), history);
        await rt.run('syncPendingChangesToSupabase()');
        assert.equal(db.rows.length, 3); assert.equal(db.rows[2].value, 7);
        assert.equal(rt.json('pendingChanges.length'), 0);
    });
}

test('old offline event is never sent or dated implicitly; safe new events still sync and pull', async () => {
    const rt = runtime(); const db = database(rt);
    rt.run(`pendingChanges.push({ type: 'athlete', athleteId: 'a', data: { group: 'old', performance: [{pullUps: 19}] } });`);
    const legacy = rt.json('pendingChanges[0]'); edit(rt, 4);
    await rt.run('syncWithSupabase()');
    assert.deepEqual(rt.json('pendingChanges'), [legacy]);
    assert.equal(db.calls.filter(c => c.action === 'update').length, 0);
    assert.deepEqual(db.rows.slice(0, 2), history);
    assert.equal(rt.json('athletesData[0].performance[0].pullUps'), 4);
});

test('migration backs up raw legacy storage once, keeps queue, and blanks unproven cells offline', () => {
    const rt = runtime();
    const old = JSON.stringify([{ ...athlete, performance: [{month: 'Сент', pullUps: 19}], records: {pullUps: {'Сент': 19}}, season: '2025-2026' }]);
    const queue = '[{"type":"athlete","athleteId":"a","data":{"performance":[{"pullUps":20}]}}]';
    rt.storage.set('athletesData', old); rt.storage.set('pendingChanges', queue);
    rt.storage.set('exercisesData', JSON.stringify(exercises));
    rt.run('loadFromLocalStorage(); prepareSeasonStorage()');
    const backup = rt.storage.get('seasonMigrationBackupV1');
    assert.equal(JSON.parse(backup).athletesData, old); assert.equal(JSON.parse(backup).pendingChanges, queue);
    assert.equal(rt.json('athletesData[0].performance[0].pullUps'), null);
    assert.equal(rt.json('pendingChanges[0].data.performance[0].pullUps'), 20);
    edit(rt, 6); rt.run('loadFromLocalStorage(); prepareSeasonStorage()');
    assert.equal(rt.json('athletesData[0].performance[0].pullUps'), 6);
    assert.equal(rt.storage.get('seasonMigrationBackupV1'), backup);
});

test('backup quota failure leaves original legacy storage intact', () => {
    const rt = runtime(); const original = '[{"id":"a","performance":[{"month":"Сент","pullUps":19}]}]';
    rt.storage.set('athletesData', original); rt.run('loadFromLocalStorage()');
    rt.context.localStorage.setItem = () => { throw new Error('QuotaExceeded'); };
    assert.throws(() => rt.run('prepareSeasonStorage()'), /QuotaExceeded/);
    assert.equal(rt.storage.get('athletesData'), original);
    assert.equal(rt.json('athletesData[0].performance[0].pullUps'), 19);
});

test('corrupt diagnostic log cannot erase measurements; corrupt measurement JSON stops loading', () => {
    const rt = runtime();
    rt.storage.set('athletesData', JSON.stringify([{ ...athlete, performance: [{month: 'Сент', pullUps: 19}] }]));
    rt.storage.set('logHistory', '{broken');
    assert.equal(rt.run('loadFromLocalStorage()'), true);
    rt.run('prepareSeasonStorage()');
    assert.equal(JSON.parse(rt.storage.get('seasonMigrationBackupV1')).athletesData.includes('19'), true);
    const originalState = rt.storage.get('seasonStateV1');
    rt.storage.set('seasonStateV1', '{broken');
    assert.equal(rt.run('loadFromLocalStorage()'), false);
    assert.equal(rt.storage.get('seasonStateV1'), '{broken');
    assert.ok(originalState);
});

test('quota failure cannot persist a measurement without its queue', () => {
    const rt = runtime(); rt.run('saveToLocalStorage()');
    const before = rt.storage.get('seasonStateV1');
    const write = rt.context.localStorage.setItem;
    rt.context.localStorage.setItem = (key, value) => {
        if (key === 'seasonStateV1') throw new Error('QuotaExceeded');
        write(key, value);
    };
    edit(rt, 7);
    assert.equal(rt.storage.get('seasonStateV1'), before);
    rt.context.localStorage.setItem = write;
    rt.run('loadFromLocalStorage(); prepareSeasonStorage()');
    assert.equal(rt.json('athletesData[0].performance[0].pullUps'), null);
    edit(rt, 7); rt.run('loadFromLocalStorage(); prepareSeasonStorage()');
    assert.equal(rt.json('athletesData[0].performance[0].pullUps'), 7);
    assert.equal(rt.json('pendingChanges.length'), 1);
});

test('only one window may write; closing it permits a fresh reader without losing pending measurements', async () => {
    const storage = new Map();
    const first = runtime(history, storage), second = runtime(history, storage);
    let held = false;
    const locks = { async request(name, options, callback) {
        assert.equal(name, 'wu-coach-season-storage');
        assert.equal(options.ifAvailable, true);
        assert.equal(options.mode, 'exclusive');
        if (held) return callback(null);
        held = true;
        try { return await callback({ name }); } finally { held = false; }
    } };
    for (const rt of [first, second]) {
        rt.context.navigator.locks = locks;
        rt.run('hasStorageWriteLock = false');
    }
    assert.equal(await first.run('acquireStorageWriter()'), true);
    first.run('saveToLocalStorage()');
    second.run('loadFromLocalStorage()'); // A stale snapshot must never become a writer.
    assert.equal(await second.run('acquireStorageWriter()'), false);
    edit(first, 7);
    const saved = storage.get('seasonStateV1');
    second.run("logEvent('info', '', 'Второе окно')");
    assert.equal(second.run('saveToLocalStorage()'), false);
    assert.throws(() => second.run('prepareSeasonStorage()'), /не может/);
    assert.throws(() => edit(second, 12), /не может/);
    await assert.rejects(second.run('syncPendingChangesToSupabase()'), /не может/);
    assert.equal(storage.get('seasonStateV1'), saved);
    first.handlers.get('window:pagehide')();
    await new Promise(resolve => setImmediate(resolve)); // Finish the cross-VM lock callback.
    assert.equal(first.run('saveToLocalStorage()'), false);
    assert.equal(await second.run('acquireStorageWriter()'), true);
    second.run('loadFromLocalStorage(); prepareSeasonStorage()');
    assert.equal(second.json('athletesData[0].performance[0].pullUps'), 7);
    assert.equal(second.json('pendingChanges.length'), 1);
    first.handlers.get('window:pageshow')({ persisted: true });
    assert.equal(first.handlers.get('reloaded'), true);
    second.handlers.get('window:pagehide')();
});

test('missing or rejected Web Locks leaves storage untouched and explains the problem', async () => {
    for (const locks of [undefined, { request: async () => { throw new Error('SecurityError'); } }]) {
        const rt = runtime(); rt.run('saveToLocalStorage(); hasStorageWriteLock = false');
        const before = [...rt.storage];
        rt.context.navigator.locks = locks;
        assert.equal(await rt.run('acquireStorageWriter()'), false);
        assert.equal(rt.run('saveToLocalStorage()'), false);
        assert.match(rt.element('seasonDataNotice').textContent, /Данные не изменены/);
        assert.deepEqual([...rt.storage], before);
    }
});

test('goal creation retry after lost response preserves the existing goal and unblocks measurements', async () => {
    const rt = runtime(); const db = database(rt); const base = rt.context.mockDB;
    let savedGoal; let firstAttempt = true;
    rt.context.mockDB = { from(table) {
        if (table !== 'goals') return base.from(table);
        return { upsert(payload, options) {
            assert.equal(options.onConflict, 'id');
            assert.equal(options.ignoreDuplicates, true);
            if (!savedGoal) savedGoal = structuredClone(payload);
            if (firstAttempt) { firstAttempt = false; return Promise.resolve({error: {message: 'response lost'}}); }
            return Promise.resolve({ error: null });
        } };
    } };
    rt.run(`supabaseClient = mockDB; pendingChanges.push({ type: 'goal', action: 'create', goalData: {
        id: 'goal-1', studentId: 'a', exerciseId: 'pull', targetValue: 10, startDate: '2026-09-01', endDate: '2027-01-01'
    }});`);
    edit(rt, 8);
    await assert.rejects(rt.run('syncPendingChangesToSupabase()'));
    assert.equal(db.calls.filter(c => c.action === 'upsert').length, 0);
    savedGoal.completed = true; // A subsequent server edit must survive retry.
    await rt.run('syncPendingChangesToSupabase()');
    assert.equal(savedGoal.completed, true);
    assert.equal(rt.json('pendingChanges.length'), 0);
    assert.equal(db.rows.at(-1).value, 8);
    assert.deepEqual(db.rows.slice(0, 2), history);
});

test('failed persistence of sync acknowledgement retains a retryable queue', async () => {
    const rt = runtime(); const db = database(rt); edit(rt, 5);
    const saved = rt.storage.get('seasonStateV1'); const write = rt.context.localStorage.setItem;
    rt.context.localStorage.setItem = (key, value) => {
        if (key === 'seasonStateV1') throw new Error('QuotaExceeded');
        write(key, value);
    };
    await assert.rejects(rt.run('syncPendingChangesToSupabase()'), /очередь/);
    assert.equal(rt.json('pendingChanges.length'), 1);
    assert.equal(rt.storage.get('seasonStateV1'), saved);
    rt.context.localStorage.setItem = write;
    rt.run('loadFromLocalStorage(); prepareSeasonStorage()');
    await rt.run('syncPendingChangesToSupabase()');
    assert.equal(rt.json('pendingChanges.length'), 0);
    assert.equal(db.rows.length, 3);
    assert.deepEqual(db.rows.slice(0, 2), history);
});

test('open-session rollover blanks projection, preserves history and rejects stale form season', () => {
    const rt = runtime(); edit(rt, 4);
    rt.setDate('2027-09-01T00:01:00');
    assert.equal(rt.run("canEditPerformances('2026-2027')"), false);
    assert.equal(rt.json('athletesData[0].performance[0].pullUps'), null);
    assert.equal(rt.json('allTimeRecords.a.pullUps'), 19);
    assert.equal(rt.json('pendingChanges[0].data.recorded_at'), '2026-09-15');
    assert.equal(rt.json('athletesData[0].performanceHistory.length'), 3);
});

test('first click after rollover updates month label and cancels the stale journal interaction', () => {
    const rt = runtime(); rt.setDate('2027-08-31T23:59:00');
    rt.run('journalMonthIndex = 11; updateJournalMonthLabel()');
    assert.equal(rt.element('journal-month-label').textContent, 'Авг');
    rt.setDate('2027-09-01T00:01:00');
    rt.run("startJournalCellEdit('a', 'pullUps')");
    assert.equal(rt.element('journal-month-label').textContent, 'Сент');
    assert.equal(rt.json('journalEditingCell'), null);
    assert.equal(rt.json('pendingChanges.length'), 0);
});

test('fetch reads complete history across server caps; concurrent sync and edits are blocked', async () => {
    const rt = runtime(); let checked = false;
    const db = database(rt, { cap: 1, readHook: async (table) => {
        if (table === 'performances' && !checked) {
            checked = true;
            assert.equal(rt.json('isSyncing'), true);
            rt.run('updatePendingIndicator()');
            assert.equal(rt.run("canEditPerformances('2026-2027')"), false);
            assert.throws(() => edit(rt, 99));
            rt.run("editRecords('a')");
            assert.equal(rt.json('recordsEditingSeason'), null);
            await rt.run('syncWithSupabase()');
        }
    } });
    await rt.run('syncWithSupabase()');
    assert.deepEqual(db.calls.filter(c => c.table === 'performances').map(c => c.offset), [0, 1, 2]);
    assert.equal(rt.json('athletesData[0].performanceHistory.length'), 2);
    assert.equal(rt.json('isSyncing'), false);
    assert.equal(rt.json('allTimeRecords.a.pullUps'), 19);
});

test('journal and full form both create dated cell events, never 12-month upload snapshots', async () => {
    const rt = runtime();
    rt.run("journalEditingCell = { athleteId: 'a', exerciseField: 'pullUps', monthIndex: 4, season: currentSeason.name }; saveJournalCellValue('a', 'pullUps', '5')");
    assert.equal(rt.json('pendingChanges[0].data.recorded_at'), '2027-01-15');
    rt.run('setupEventListeners(); recordsEditingSeason = currentSeason.name');
    rt.element('recordsAthleteId').value = 'a'; rt.element('recordsGroup').value = 'М-19';
    const months = rt.json('MONTHS');
    for (const month of months) for (const field of ['pullUps', 'pushUps', 'dips']) rt.element(`${field}-${month}`).value = '';
    rt.element('pullUps-Янв').value = '5'; rt.element('dips-Сент').value = '8';
    await rt.handlers.get('recordsForm:submit')({ preventDefault() {} });
    assert.equal(rt.json("pendingChanges.filter(c => c.type === 'performance').length"), 2);
    assert.ok(rt.json('pendingChanges').every(c => !c.data?.performance));
    assert.equal(rt.json('athletesData[0].performanceHistory.length'), 4);
    assert.deepEqual(rt.json('athletesData[0].performanceHistory.slice(0, 2)'), history);
});

test('invalid fractional/negative input does not mutate history or queue', () => {
    const rt = runtime();
    for (const value of [-1, 1.5, Infinity]) assert.throws(() => edit(rt, value));
    assert.deepEqual(rt.json('athletesData[0].performanceHistory'), history);
    assert.equal(rt.json('pendingChanges.length'), 0);
});

test('goal create/edit and group assignment survive reload with their queue in the new storage format', () => {
    const rt = runtime(); rt.run('saveToLocalStorage()');
    const fields = {
        createGoalStudentId: 'a', createGoalStudentName: 'Тестовый Ученик', createGoalExercise: 'pull',
        exerciseSearchInput: 'Подтягивания', createGoalStartDate: '2026-09-21', createGoalEndDate: '2026-10-21',
        createGoalDescription: 'Тестовая цель'
    };
    for (const [key, value] of Object.entries(fields)) rt.element(key).value = value;
    rt.run('handleGoalCreate({preventDefault() {}}); loadFromLocalStorage()');
    assert.equal(rt.json('goalsData.length'), 1);
    assert.equal(rt.json('pendingChanges[0].type'), 'goal');
    rt.element('editGoalId').value = rt.json('goalsData[0].id');
    rt.element('editGoalStartDate').value = '2026-09-21';
    rt.element('editGoalEndDate').value = '2026-11-21';
    rt.run('saveGoalDateEdit({preventDefault() {}}); loadFromLocalStorage()');
    assert.equal(rt.json('goalsData[0].endDate'), '2026-11-21');
    assert.equal(rt.json('pendingChanges[1].type'), 'goal_edit');
    rt.run("assignGroup('a', 'М-117'); loadFromLocalStorage()");
    assert.equal(rt.json('athletesData[0].group'), 'М-117');
    assert.equal(rt.json('pendingChanges[2].data.group'), 'М-117');
});

test('Service Worker never substitutes cached API data or intercepts writes', () => {
    const listeners = {};
    const worker = fs.readFileSync(`${__dirname}/../sw.js`, 'utf8');
    vm.runInNewContext(worker, { self: { addEventListener: (name, fn) => { listeners[name] = fn; } }, URL });
    for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
        listeners.fetch({ request: { method, url: 'https://synthetic.supabase.co/rest/v1/performances' },
            respondWith() { assert.fail('API request must go directly to network'); } });
    }
});
