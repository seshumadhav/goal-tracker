const TYPES = ['target', 'aggregate', 'streak'];

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

// Validates raw form input for FR1: each Goal Type requires a different set
// of fields. Returns { ok: true, goal } or { ok: false, error }.
function validateGoalInput(body) {
  const name = (body.name || '').trim();
  const type = body.type;

  if (isBlank(name)) return { ok: false, error: 'Name is required.' };
  if (!TYPES.includes(type)) return { ok: false, error: 'Choose a valid goal type.' };

  if (type === 'target') {
    if (isBlank(body.unit)) return { ok: false, error: 'Unit is required for a target goal.' };
    const startingValue = toNumber(body.startingValue);
    const targetValue = toNumber(body.targetValue);
    if (startingValue === null) return { ok: false, error: 'Starting value is required for a target goal.' };
    if (targetValue === null) return { ok: false, error: 'Target value is required for a target goal.' };
    if (!['increase', 'decrease'].includes(body.direction)) {
      return { ok: false, error: 'Direction (increase/decrease) is required for a target goal.' };
    }
    if (isBlank(body.deadline) || !isValidDate(body.deadline)) {
      return { ok: false, error: 'A valid deadline is required for a target goal.' };
    }
    return {
      ok: true,
      goal: {
        name,
        type,
        unit: body.unit.trim(),
        startingValue,
        targetValue,
        direction: body.direction,
        deadline: body.deadline,
      },
    };
  }

  if (type === 'aggregate') {
    if (isBlank(body.unit)) return { ok: false, error: 'Unit is required for an aggregate goal.' };
    const targetTotal = toNumber(body.targetTotal);
    if (targetTotal === null) return { ok: false, error: 'Target total is required for an aggregate goal.' };
    if (isBlank(body.deadline) || !isValidDate(body.deadline)) {
      return { ok: false, error: 'A valid deadline is required for an aggregate goal.' };
    }
    return {
      ok: true,
      goal: { name, type, unit: body.unit.trim(), targetTotal, deadline: body.deadline },
    };
  }

  // streak: deadline optional, but must be valid if provided
  if (!isBlank(body.deadline) && !isValidDate(body.deadline)) {
    return { ok: false, error: 'Deadline must be a valid date.' };
  }
  return {
    ok: true,
    goal: { name, type, deadline: isBlank(body.deadline) ? null : body.deadline },
  };
}

module.exports = { validateGoalInput };
