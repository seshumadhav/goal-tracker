const fs = require('fs');
const path = require('path');

const SHEET_PATH = process.env.GOAT_SHEET_PATH || path.join(__dirname, '..', 'data', 'sheet.json');
const SHEET_TITLE = 'GOAT Data';

function loadSheetId() {
  try {
    return JSON.parse(fs.readFileSync(SHEET_PATH, 'utf8')).spreadsheetId || null;
  } catch {
    return null;
  }
}

function saveSheetId(spreadsheetId) {
  fs.mkdirSync(path.dirname(SHEET_PATH), { recursive: true });
  fs.writeFileSync(SHEET_PATH, JSON.stringify({ spreadsheetId }, null, 2));
}

async function createSpreadsheet(accessToken) {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties: { title: SHEET_TITLE } }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create spreadsheet: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.spreadsheetId;
}

// Ensures a dedicated GOAT spreadsheet exists for this user: creates one on
// first sign-in and reuses the same one on every later sign-in (Story 1.3).
// `createFn` is injectable so tests can verify the reuse/create-once
// orchestration without making a real network call.
async function ensureSheet(accessToken, { createFn = createSpreadsheet } = {}) {
  const existing = loadSheetId();
  if (existing) return existing;

  const spreadsheetId = await createFn(accessToken);
  saveSheetId(spreadsheetId);
  return spreadsheetId;
}

module.exports = { ensureSheet, loadSheetId, SHEET_PATH };
