const { test } = require('node:test');
const assert = require('node:assert');
const { batchGetValues, batchUpdateValues, SheetsApiError } = require('../lib/sheetsApi');

function fakeResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function noopSleep(recorded) {
  return async (ms) => {
    recorded.push(ms);
  };
}

test('batchGetValues issues a single batched GET across ranges with the access token', async () => {
  const calls = [];
  const fetchFn = async (url, options) => {
    calls.push({ url, options });
    return fakeResponse(200, { spreadsheetId: 'sheet-1', valueRanges: [] });
  };

  const result = await batchGetValues('sheet-1', ['Goals!A1:D10', 'Entries!A1:E10'], {
    fetchFn,
    getAccessTokenFn: async () => 'token-xyz',
  });

  assert.strictEqual(calls.length, 1);
  assert.match(calls[0].url, /values:batchGet\?ranges=Goals!A1%3AD10&ranges=Entries!A1%3AE10/);
  assert.strictEqual(calls[0].options.headers.Authorization, 'Bearer token-xyz');
  assert.deepStrictEqual(result, { spreadsheetId: 'sheet-1', valueRanges: [] });
});

test('batchUpdateValues issues a single batched POST for all ranges', async () => {
  const calls = [];
  const fetchFn = async (url, options) => {
    calls.push({ url, options });
    return fakeResponse(200, { spreadsheetId: 'sheet-1' });
  };

  await batchUpdateValues(
    'sheet-1',
    [
      { range: 'Goals!A2', values: [['Weight']] },
      { range: 'Entries!A2', values: [['2026-08-10', 79.5]] },
    ],
    { fetchFn, getAccessTokenFn: async () => 'token-xyz' }
  );

  assert.strictEqual(calls.length, 1);
  assert.match(calls[0].url, /values:batchUpdate$/);
  assert.strictEqual(calls[0].options.method, 'POST');
  const body = JSON.parse(calls[0].options.body);
  assert.strictEqual(body.data.length, 2);
});

test('retries with exponential backoff on HTTP 429 and succeeds once the API recovers', async () => {
  let call = 0;
  const fetchFn = async () => {
    call += 1;
    if (call < 3) return fakeResponse(429, { error: 'rate limited' });
    return fakeResponse(200, { ok: true });
  };
  const delays = [];

  const result = await batchGetValues('sheet-1', ['A1:A1'], {
    fetchFn,
    getAccessTokenFn: async () => 'token-xyz',
    sleepFn: noopSleep(delays),
    baseDelayMs: 100,
  });

  assert.strictEqual(call, 3);
  assert.deepStrictEqual(delays, [100, 200]);
  assert.deepStrictEqual(result, { ok: true });
});

test('gives up after exhausting retries on persistent HTTP 429', async () => {
  const fetchFn = async () => fakeResponse(429, { error: 'still rate limited' });

  await assert.rejects(
    () =>
      batchGetValues('sheet-1', ['A1:A1'], {
        fetchFn,
        getAccessTokenFn: async () => 'token-xyz',
        sleepFn: noopSleep([]),
        retries: 2,
        baseDelayMs: 10,
      }),
    (err) => {
      assert.ok(err instanceof SheetsApiError);
      assert.strictEqual(err.status, 429);
      return true;
    }
  );
});

test('does not retry on non-429 errors', async () => {
  let call = 0;
  const fetchFn = async () => {
    call += 1;
    return fakeResponse(500, { error: 'server error' });
  };

  await assert.rejects(
    () =>
      batchGetValues('sheet-1', ['A1:A1'], {
        fetchFn,
        getAccessTokenFn: async () => 'token-xyz',
        sleepFn: noopSleep([]),
      }),
    SheetsApiError
  );
  assert.strictEqual(call, 1);
});
