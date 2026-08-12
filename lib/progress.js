function addDays(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function daysUntil(deadline, today) {
  if (!deadline) return null;
  const ms = new Date(`${deadline}T00:00:00Z`) - new Date(`${today}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

// Percent of the way from Starting Value to Target Value, based on the
// latest reading (FR5). Direction-aware so it works whether the target is
// above or below the start (e.g. weight loss vs. savings growth).
function targetProgress(goal, entriesForGoal, today = new Date().toISOString().slice(0, 10)) {
  const latest = entriesForGoal[0]; // caller passes entries sorted most-recent-first
  const latestValue = latest ? latest.value : goal.startingValue;
  const span = goal.targetValue - goal.startingValue;
  const percent = span === 0 ? 100 : Math.round(((latestValue - goal.startingValue) / span) * 100);
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const remaining = daysUntil(goal.deadline, today);
  return {
    latestValue,
    percent: clampedPercent,
    daysRemaining: remaining,
    overdue: remaining !== null && remaining < 0 && clampedPercent < 100,
  };
}

// Running total vs. Target Total (FR5).
function aggregateProgress(goal, entriesForGoal, today = new Date().toISOString().slice(0, 10)) {
  const total = entriesForGoal.reduce((sum, e) => sum + (e.value || 0), 0);
  const remaining = daysUntil(goal.deadline, today);
  return {
    total,
    daysRemaining: remaining,
    overdue: remaining !== null && remaining < 0 && total < goal.targetTotal,
  };
}

// Current Streak Length, resetting to 0 the first calendar day that passes
// without a logged success Entry, or immediately on an explicit fail (FR6).
function streakLength(entriesForGoal, today = new Date().toISOString().slice(0, 10)) {
  const byDate = new Map(entriesForGoal.map((e) => [e.date, e.success]));

  if (byDate.get(today) === false) return 0;

  const successDates = new Set([...byDate.entries()].filter(([, s]) => s).map(([d]) => d));
  if (successDates.size === 0) return 0;

  const latest = [...successDates].sort().reverse()[0];
  const yesterday = addDays(today, -1);
  if (latest !== today && latest !== yesterday) return 0;

  let count = 0;
  let cursor = latest;
  while (successDates.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

module.exports = { targetProgress, aggregateProgress, streakLength, addDays, daysUntil };
