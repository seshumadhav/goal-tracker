const crypto = require('crypto');
const sheetsApi = require('./sheetsApi');

const GOALS_SHEET = 'Goals';
const ENTRIES_SHEET = 'Entries';
const GOALS_HEADERS = [
  'id',
  'name',
  'type',
  'unit',
  'startingValue',
  'targetValue',
  'direction',
  'targetTotal',
  'deadline',
  'archived',
  'createdAt',
];
const ENTRIES_HEADERS = ['id', 'goalId', 'date', 'value', 'success', 'createdAt'];
const GOALS_DATA_RANGE = `${GOALS_SHEET}!A2:K`;

// Creates the Goals/Entries tabs (with header rows) the first time either
// is missing. Cheap to call before every read/write — it's a no-op once
// both tabs already exist (Story 2.2's "create tables only when needed").
async function ensureSchema(spreadsheetId, opts = {}) {
  const meta = await sheetsApi.getSpreadsheetMetadata(spreadsheetId, opts);
  const existingTitles = new Set((meta.sheets || []).map((s) => s.properties.title));

  const addRequests = [];
  const headerWrites = [];

  if (!existingTitles.has(GOALS_SHEET)) {
    addRequests.push({ addSheet: { properties: { title: GOALS_SHEET } } });
    headerWrites.push({ range: `${GOALS_SHEET}!A1:K1`, values: [GOALS_HEADERS] });
  }
  if (!existingTitles.has(ENTRIES_SHEET)) {
    addRequests.push({ addSheet: { properties: { title: ENTRIES_SHEET } } });
    headerWrites.push({ range: `${ENTRIES_SHEET}!A1:F1`, values: [ENTRIES_HEADERS] });
  }

  if (addRequests.length > 0) {
    await sheetsApi.structuralBatchUpdate(spreadsheetId, addRequests, opts);
    await sheetsApi.batchUpdateValues(spreadsheetId, headerWrites, opts);
  }
}

function numberOrNull(value) {
  return value !== undefined && value !== '' && value !== null ? Number(value) : null;
}

function rowToGoal(row, rowNumber) {
  const [
    id,
    name,
    type,
    unit,
    startingValue,
    targetValue,
    direction,
    targetTotal,
    deadline,
    archived,
    createdAt,
  ] = row;
  return {
    rowNumber,
    id,
    name,
    type,
    unit: unit || null,
    startingValue: numberOrNull(startingValue),
    targetValue: numberOrNull(targetValue),
    direction: direction || null,
    targetTotal: numberOrNull(targetTotal),
    deadline: deadline || null,
    archived: archived === 'TRUE' || archived === true,
    createdAt: createdAt || null,
  };
}

// Lists Goals (non-archived by default). FR2/FR3.
async function listGoals(spreadsheetId, { includeArchived = false, ...opts } = {}) {
  await ensureSchema(spreadsheetId, opts);
  const result = await sheetsApi.batchGetValues(spreadsheetId, [GOALS_DATA_RANGE], opts);
  const rows = (result.valueRanges && result.valueRanges[0] && result.valueRanges[0].values) || [];
  const goals = rows
    .map((row, i) => rowToGoal(row, i + 2)) // data starts at row 2 (row 1 is the header)
    .filter((g) => g.id); // skip any fully blank trailing row

  return includeArchived ? goals : goals.filter((g) => !g.archived);
}

async function getGoal(spreadsheetId, goalId, opts = {}) {
  const goals = await listGoals(spreadsheetId, { includeArchived: true, ...opts });
  return goals.find((g) => g.id === goalId) || null;
}

// Creates a Goal of any of the three types. FR1.
async function createGoal(spreadsheetId, goal, opts = {}) {
  await ensureSchema(spreadsheetId, opts);

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const row = [
    id,
    goal.name,
    goal.type,
    goal.unit || '',
    goal.startingValue ?? '',
    goal.targetValue ?? '',
    goal.direction || '',
    goal.targetTotal ?? '',
    goal.deadline || '',
    'FALSE',
    createdAt,
  ];

  await sheetsApi.appendValues(spreadsheetId, `${GOALS_SHEET}!A:K`, [row], opts);
  return { ...goal, id, rowNumber: null, archived: false, createdAt };
}

// Archives a Goal in place; historical Entries are left untouched. FR3.
async function archiveGoal(spreadsheetId, goalId, opts = {}) {
  const goal = await getGoal(spreadsheetId, goalId, opts);
  if (!goal) throw new Error(`Goal not found: ${goalId}`);

  await sheetsApi.batchUpdateValues(
    spreadsheetId,
    [{ range: `${GOALS_SHEET}!J${goal.rowNumber}`, values: [['TRUE']] }],
    opts
  );
  return { ...goal, archived: true };
}

module.exports = {
  GOALS_SHEET,
  ENTRIES_SHEET,
  ensureSchema,
  listGoals,
  getGoal,
  createGoal,
  archiveGoal,
};
