const { test } = require('node:test');
const assert = require('node:assert');
const {
  listGoals,
  getGoal,
  createGoal,
  archiveGoal,
  ensureSchema,
} = require('../lib/goalsRepo');

function fakeResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

const baseOpts = { getAccessTokenFn: async () => 'token-xyz' };

test('ensureSchema adds Goals and Entries tabs + headers when only the default tab exists', async () => {
  const calls = [];
  const fetchFn = async (url, options) => {
    calls.push({ url, method: options.method, body: options.body && JSON.parse(options.body) });
    if (url.includes('?fields=sheets.properties')) {
      return fakeResponse(200, { sheets: [{ properties: { title: 'Sheet1' } }] });
    }
    return fakeResponse(200, {});
  };

  await ensureSchema('sheet-1', { ...baseOpts, fetchFn });

  const structural = calls.find((c) => c.url.endsWith(':batchUpdate') && !c.url.includes('/values:'));
  assert.ok(structural, 'expected a structural batchUpdate call');
  const titles = structural.body.requests.map((r) => r.addSheet.properties.title);
  assert.deepStrictEqual(titles, ['Goals', 'Entries']);

  const headerWrite = calls.find((c) => c.url.includes('/values:batchUpdate'));
  assert.ok(headerWrite, 'expected a values batchUpdate call for headers');
  assert.strictEqual(headerWrite.body.data[0].range, 'Goals!A1:K1');
  assert.strictEqual(headerWrite.body.data[1].range, 'Entries!A1:F1');
});

test('ensureSchema is a no-op once both tabs already exist', async () => {
  let mutatingCalls = 0;
  const fetchFn = async (url) => {
    if (url.includes('?fields=sheets.properties')) {
      return fakeResponse(200, {
        sheets: [{ properties: { title: 'Goals' } }, { properties: { title: 'Entries' } }],
      });
    }
    mutatingCalls += 1;
    return fakeResponse(200, {});
  };

  await ensureSchema('sheet-1', { ...baseOpts, fetchFn });

  assert.strictEqual(mutatingCalls, 0);
});

test('listGoals parses rows into goal objects and filters archived by default', async () => {
  const fetchFn = async (url) => {
    if (url.includes('?fields=sheets.properties')) {
      return fakeResponse(200, {
        sheets: [{ properties: { title: 'Goals' } }, { properties: { title: 'Entries' } }],
      });
    }
    return fakeResponse(200, {
      valueRanges: [
        {
          range: 'Goals!A2:K',
          values: [
            ['g1', 'Weight', 'target', 'kg', '80', '70', 'decrease', '', '2026-12-31', 'FALSE', '2026-08-01T00:00:00.000Z'],
            ['g2', 'Old goal', 'streak', '', '', '', '', '', '', 'TRUE', '2026-01-01T00:00:00.000Z'],
          ],
        },
      ],
    });
  };

  const active = await listGoals('sheet-1', { ...baseOpts, fetchFn });
  assert.strictEqual(active.length, 1);
  assert.strictEqual(active[0].id, 'g1');
  assert.strictEqual(active[0].name, 'Weight');
  assert.strictEqual(active[0].startingValue, 80);
  assert.strictEqual(active[0].targetValue, 70);
  assert.strictEqual(active[0].archived, false);

  const all = await listGoals('sheet-1', { ...baseOpts, fetchFn, includeArchived: true });
  assert.strictEqual(all.length, 2);
  assert.strictEqual(all[1].archived, true);
});

test('createGoal appends a row with a generated id and returns the created goal', async () => {
  const calls = [];
  const fetchFn = async (url, options) => {
    calls.push({ url, body: options.body && JSON.parse(options.body) });
    if (url.includes('?fields=sheets.properties')) {
      return fakeResponse(200, {
        sheets: [{ properties: { title: 'Goals' } }, { properties: { title: 'Entries' } }],
      });
    }
    return fakeResponse(200, {});
  };

  const created = await createGoal(
    'sheet-1',
    { name: 'Meditation', type: 'aggregate', unit: 'min', targetTotal: 10000, deadline: '2026-12-31' },
    { ...baseOpts, fetchFn }
  );

  assert.strictEqual(created.name, 'Meditation');
  assert.strictEqual(created.archived, false);
  assert.ok(created.id);
  assert.ok(created.createdAt);

  const appendCall = calls.find((c) => c.url.includes(':append'));
  assert.ok(appendCall, 'expected an append call');
  assert.strictEqual(appendCall.body.values[0][1], 'Meditation');
  assert.strictEqual(appendCall.body.values[0][2], 'aggregate');
});

test('archiveGoal writes TRUE to the archived column of the matching row', async () => {
  const calls = [];
  const fetchFn = async (url, options) => {
    calls.push({ url, body: options.body && JSON.parse(options.body) });
    if (url.includes('?fields=sheets.properties')) {
      return fakeResponse(200, {
        sheets: [{ properties: { title: 'Goals' } }, { properties: { title: 'Entries' } }],
      });
    }
    return fakeResponse(200, {
      valueRanges: [
        {
          range: 'Goals!A2:K',
          values: [['g1', 'Weight', 'target', 'kg', '80', '70', 'decrease', '', '2026-12-31', 'FALSE', 'x']],
        },
      ],
    });
  };

  const archived = await archiveGoal('sheet-1', 'g1', { ...baseOpts, fetchFn });
  assert.strictEqual(archived.archived, true);

  const updateCall = calls.find((c) => c.url.includes('/values:batchUpdate'));
  assert.strictEqual(updateCall.body.data[0].range, 'Goals!J2');
  assert.deepStrictEqual(updateCall.body.data[0].values, [['TRUE']]);
});

test('end-to-end: create, list, archive round-trips through an in-memory fake sheet', async () => {
  const state = { tabs: ['Sheet1'], goalRows: [] };
  const fetchFn = async (url, options) => {
    if (url.includes('?fields=sheets.properties')) {
      return fakeResponse(200, { sheets: state.tabs.map((title) => ({ properties: { title } })) });
    }
    if (options.method === 'POST' && url.endsWith(':batchUpdate') && !url.includes('/values:')) {
      const body = JSON.parse(options.body);
      body.requests.forEach((r) => state.tabs.push(r.addSheet.properties.title));
      return fakeResponse(200, {});
    }
    if (url.includes(':append')) {
      const body = JSON.parse(options.body);
      state.goalRows.push(body.values[0]);
      return fakeResponse(200, {});
    }
    if (url.includes('/values:batchUpdate')) {
      const body = JSON.parse(options.body);
      body.data.forEach(({ range, values }) => {
        const match = range.match(/Goals!J(\d+)/);
        if (match) {
          const rowIndex = Number(match[1]) - 2; // row 2 == index 0
          state.goalRows[rowIndex][9] = values[0][0];
        }
      });
      return fakeResponse(200, {});
    }
    if (url.includes('/values:batchGet')) {
      return fakeResponse(200, { valueRanges: [{ range: 'Goals!A2:K', values: state.goalRows }] });
    }
    return fakeResponse(200, {});
  };

  await createGoal('sheet-1', { name: 'No meat', type: 'streak' }, { ...baseOpts, fetchFn });
  const afterCreate = await listGoals('sheet-1', { ...baseOpts, fetchFn });
  assert.strictEqual(afterCreate.length, 1);
  assert.strictEqual(afterCreate[0].name, 'No meat');

  await archiveGoal('sheet-1', afterCreate[0].id, { ...baseOpts, fetchFn });
  const afterArchive = await listGoals('sheet-1', { ...baseOpts, fetchFn });
  assert.strictEqual(afterArchive.length, 0);

  const withArchived = await listGoals('sheet-1', { ...baseOpts, fetchFn, includeArchived: true });
  assert.strictEqual(withArchived.length, 1);
  assert.strictEqual(withArchived[0].archived, true);

  const fetched = await getGoal('sheet-1', afterCreate[0].id, { ...baseOpts, fetchFn });
  assert.strictEqual(fetched.archived, true);
});
