const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

const goalsRepo = require('../lib/goalsRepoMemory');
const app = require('../server.js');

beforeEach(() => {
  goalsRepo.reset();
});

async function withServer(fn) {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    await fn(`http://localhost:${port}`);
  } finally {
    server.close();
  }
}

// TEMP: sign-in is currently bypassed while the UI is built against
// ephemeral storage (see server.js) — this documents that intentionally,
// so it reads as a deliberate state rather than a silent auth regression.
test('GET /goals is reachable without signing in (auth temporarily bypassed)', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/goals`);
    assert.strictEqual(res.status, 200);
  });
});

test('GET /goals shows an empty state with no goals', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/goals`);
    const body = await res.text();
    assert.match(body, /No goals yet/);
    assert.match(body, /href="\/goals\/new"/);
  });
});

test('POST /goals creates a target goal and redirects to the list', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        type: 'target',
        name: 'Weight',
        unit: 'kg',
        startingValue: '80',
        targetValue: '70',
        direction: 'decrease',
        deadline: '2026-12-31',
      }),
      redirect: 'manual',
    });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.get('location'), '/goals');

    const goals = await goalsRepo.listGoals(null);
    assert.strictEqual(goals.length, 1);
    assert.strictEqual(goals[0].name, 'Weight');
    assert.strictEqual(goals[0].type, 'target');
  });
});

test('POST /goals rejects a target goal missing required fields and redisplays the form', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ type: 'target', name: 'Weight', unit: 'kg' }),
    });

    const body = await res.text();
    assert.strictEqual(res.status, 200);
    assert.match(body, /Starting value is required/);

    const goals = await goalsRepo.listGoals(null);
    assert.strictEqual(goals.length, 0);
  });
});

test('POST /goals creates a streak goal without a deadline', async () => {
  await withServer(async (base) => {
    await fetch(`${base}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ type: 'streak', name: 'No non-veg' }),
    });

    const goals = await goalsRepo.listGoals(null);
    assert.strictEqual(goals.length, 1);
    assert.strictEqual(goals[0].deadline, null);
  });
});

test('GET /goals/:id redirects to the list when the goal does not exist', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/goals/does-not-exist`, { redirect: 'manual' });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.get('location'), '/goals');
  });
});

test('GET /goals lists a created goal as a link to its detail view', async () => {
  const created = await goalsRepo.createGoal(null, { name: 'No non-veg', type: 'streak', deadline: null });

  await withServer(async (base) => {
    const res = await fetch(`${base}/goals`);
    const body = await res.text();
    assert.match(body, new RegExp(`href="/goals/${created.id}"`));
    assert.match(body, /No non-veg/);
  });
});

test('POST /goals/:id/archive removes the goal from the active list but keeps it retrievable', async () => {
  const created = await goalsRepo.createGoal(null, { name: 'Old goal', type: 'streak', deadline: null });

  await withServer(async (base) => {
    const res = await fetch(`${base}/goals/${created.id}/archive`, { method: 'POST', redirect: 'manual' });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.get('location'), '/goals');

    const active = await goalsRepo.listGoals(null);
    assert.strictEqual(active.length, 0);

    const stillThere = await goalsRepo.getGoal(null, created.id);
    assert.strictEqual(stillThere.archived, true);
  });
});

test('GET /goals/:id shows an Archive action for an active goal', async () => {
  const created = await goalsRepo.createGoal(null, { name: 'Weight', type: 'target', deadline: '2026-12-31' });

  await withServer(async (base) => {
    const res = await fetch(`${base}/goals/${created.id}`);
    const body = await res.text();
    assert.match(body, new RegExp(`action="/goals/${created.id}/archive"`));
    assert.match(body, /Archive this goal/);
  });
});
