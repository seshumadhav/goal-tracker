const { test } = require('node:test');
const assert = require('node:assert');

const auth = require('../lib/auth');
const sheets = require('../lib/sheets');
const goalsRepo = require('../lib/goalsRepo');
const app = require('../server.js');

async function withServer(fn) {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    await fn(`http://localhost:${port}`);
  } finally {
    server.close();
  }
}

test('GET /goals redirects to home when signed out', async (t) => {
  t.mock.method(auth, 'isSignedIn', async () => false);

  await withServer(async (base) => {
    const res = await fetch(`${base}/goals`, { redirect: 'manual' });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.get('location'), '/');
  });
});

test('GET /goals shows an empty state with no goals', async (t) => {
  t.mock.method(auth, 'isSignedIn', async () => true);
  t.mock.method(sheets, 'loadSheetId', () => 'sheet-1');
  t.mock.method(goalsRepo, 'listGoals', async () => []);

  await withServer(async (base) => {
    const res = await fetch(`${base}/goals`);
    const body = await res.text();
    assert.strictEqual(res.status, 200);
    assert.match(body, /No goals yet/);
    assert.match(body, /href="\/goals\/new"/);
  });
});

test('GET /goals lists every goal as a link to its detail view', async (t) => {
  t.mock.method(auth, 'isSignedIn', async () => true);
  t.mock.method(sheets, 'loadSheetId', () => 'sheet-1');
  t.mock.method(goalsRepo, 'listGoals', async () => [
    { id: 'g1', name: 'Weight', type: 'target', archived: false },
    { id: 'g2', name: 'No meat', type: 'streak', archived: false },
  ]);

  await withServer(async (base) => {
    const res = await fetch(`${base}/goals`);
    const body = await res.text();
    assert.match(body, /href="\/goals\/g1"/);
    assert.match(body, /Weight/);
    assert.match(body, /href="\/goals\/g2"/);
    assert.match(body, /No meat/);
  });
});

test('GET /goals/:id redirects to the list when the goal does not exist', async (t) => {
  t.mock.method(auth, 'isSignedIn', async () => true);
  t.mock.method(sheets, 'loadSheetId', () => 'sheet-1');
  t.mock.method(goalsRepo, 'getGoal', async () => null);

  await withServer(async (base) => {
    const res = await fetch(`${base}/goals/does-not-exist`, { redirect: 'manual' });
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.get('location'), '/goals');
  });
});
