const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SHEET_PATH = path.join(os.tmpdir(), `goat-test-sheet-${process.pid}.json`);
process.env.GOAT_SHEET_PATH = SHEET_PATH;

const { ensureSheet, loadSheetId } = require('../lib/sheets');

function cleanup() {
  try {
    fs.unlinkSync(SHEET_PATH);
  } catch {
    // already gone
  }
}

beforeEach(cleanup);
after(cleanup);

test('ensureSheet creates and persists a spreadsheet on first sign-in', async () => {
  let createCalls = 0;
  const createFn = async (accessToken) => {
    createCalls += 1;
    assert.strictEqual(accessToken, 'fake-access-token');
    return 'sheet-abc-123';
  };

  const id = await ensureSheet('fake-access-token', { createFn });

  assert.strictEqual(id, 'sheet-abc-123');
  assert.strictEqual(createCalls, 1);
  assert.strictEqual(loadSheetId(), 'sheet-abc-123');
});

test('ensureSheet reuses the existing spreadsheet without creating a new one', async () => {
  fs.mkdirSync(path.dirname(SHEET_PATH), { recursive: true });
  fs.writeFileSync(SHEET_PATH, JSON.stringify({ spreadsheetId: 'already-exists-456' }));

  let createCalls = 0;
  const createFn = async () => {
    createCalls += 1;
    return 'should-not-be-used';
  };

  const id = await ensureSheet('fake-access-token', { createFn });

  assert.strictEqual(id, 'already-exists-456');
  assert.strictEqual(createCalls, 0);
});
