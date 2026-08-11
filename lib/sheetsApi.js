const auth = require('./auth');

class SheetsApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'SheetsApiError';
    this.status = status;
  }
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Calls the Sheets API with the signed-in user's access token, retrying on
// HTTP 429 (rate limited) with exponential backoff instead of failing the
// action outright (FR9). fetchFn/getAccessTokenFn/sleepFn are injectable so
// tests can exercise the retry/backoff behavior without live network calls.
async function sheetsFetch(
  url,
  options = {},
  { sleepFn = defaultSleep, retries = 4, baseDelayMs = 500, fetchFn = fetch, getAccessTokenFn = auth.getAccessToken } = {}
) {
  const accessToken = await getAccessTokenFn();
  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await fetchFn(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (res.ok) return res.json();

    if (res.status === 429 && attempt < retries) {
      await sleepFn(baseDelayMs * 2 ** attempt);
      attempt += 1;
      continue;
    }

    const text = await res.text();
    throw new SheetsApiError(res.status, `Sheets API error ${res.status}: ${text}`);
  }
}

// Batched read of one or more A1 ranges in a single request (never one
// request per cell/range) — see FR9.
async function batchGetValues(spreadsheetId, ranges, opts = {}) {
  const params = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
  return sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${params}`,
    { method: 'GET' },
    opts
  );
}

// Batched write of one or more ranges in a single request.
// `data` is the Sheets API batchUpdate value-range array:
// [{ range: 'A1:B2', values: [[...]] }, ...]
async function batchUpdateValues(spreadsheetId, data, opts = {}) {
  return sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({ valueInputOption: 'RAW', data }),
    },
    opts
  );
}

// Appends a row after the last row of data in `range`'s table — used for
// creating a new Goal/Entry without needing to know the current row count.
// Still a single Sheets API call, not one per cell (FR9).
async function appendValues(spreadsheetId, range, values, opts = {}) {
  return sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: JSON.stringify({ values }),
    },
    opts
  );
}

// Structural change (e.g. adding a tab), as opposed to a values write.
// `requests` is the Sheets API batchUpdate request array, e.g.
// [{ addSheet: { properties: { title: 'Goals' } } }]
async function structuralBatchUpdate(spreadsheetId, requests, opts = {}) {
  return sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({ requests }),
    },
    opts
  );
}

async function getSpreadsheetMetadata(spreadsheetId, opts = {}) {
  return sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { method: 'GET' },
    opts
  );
}

module.exports = {
  batchGetValues,
  batchUpdateValues,
  appendValues,
  structuralBatchUpdate,
  getSpreadsheetMetadata,
  sheetsFetch,
  SheetsApiError,
};
