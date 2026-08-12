const crypto = require('crypto');

// In-memory Entries store — ephemeral, mirrors the eventual Sheets-backed
// "Entries" tab schema (lib/goalsRepo.js) so it's a straightforward swap
// later. At most one Entry per Goal per calendar day (Glossary §3): same-day
// re-logging updates that row rather than creating a new one, with
// type-specific merge rules (FR4).
let entries = [];

function reset() {
  entries = [];
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function listEntriesForGoal(_spreadsheetId, goalId) {
  return entries.filter((e) => e.goalId === goalId).sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function listAllEntries(_spreadsheetId) {
  return [...entries];
}

// Logs today's Entry for a Goal, applying the same-day merge rule for its
// type: target = latest value wins, aggregate = increments sum, streak =
// toggle updates in place (FR4).
async function logEntry(_spreadsheetId, { goalId, type, value, success, date = todayDateString() }) {
  const existing = entries.find((e) => e.goalId === goalId && e.date === date);

  if (!existing) {
    const created = {
      id: crypto.randomUUID(),
      goalId,
      date,
      value: type === 'streak' ? null : Number(value),
      success: type === 'streak' ? success : null,
      createdAt: new Date().toISOString(),
    };
    entries.push(created);
    return created;
  }

  if (type === 'aggregate') {
    existing.value = (existing.value || 0) + Number(value);
  } else if (type === 'target') {
    existing.value = Number(value);
  } else {
    existing.success = success;
  }
  return existing;
}

module.exports = { logEntry, listEntriesForGoal, listAllEntries, todayDateString, reset };
