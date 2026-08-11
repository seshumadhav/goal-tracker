const crypto = require('crypto');

// In-memory Goals store — ephemeral by design while the UI is built out
// end-to-end before Google Sheets persistence is wired back in. Same
// function signatures as lib/goalsRepo.js (the Sheets-backed version built
// in Story 2.1) so server.js can swap back to it later with a one-line
// require change.
let goals = [];

function reset() {
  goals = [];
}

async function listGoals(_spreadsheetId, { includeArchived = false } = {}) {
  return includeArchived ? [...goals] : goals.filter((g) => !g.archived);
}

async function getGoal(_spreadsheetId, goalId) {
  return goals.find((g) => g.id === goalId) || null;
}

async function createGoal(_spreadsheetId, goal) {
  const created = { ...goal, id: crypto.randomUUID(), archived: false, createdAt: new Date().toISOString() };
  goals.push(created);
  return created;
}

async function archiveGoal(_spreadsheetId, goalId) {
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) throw new Error(`Goal not found: ${goalId}`);
  goal.archived = true;
  return goal;
}

async function deleteGoal(_spreadsheetId, goalId) {
  goals = goals.filter((g) => g.id !== goalId);
}

module.exports = { listGoals, getGoal, createGoal, archiveGoal, deleteGoal, reset };
