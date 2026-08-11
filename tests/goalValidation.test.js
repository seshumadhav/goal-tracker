const { test } = require('node:test');
const assert = require('node:assert');
const { validateGoalInput } = require('../lib/goalValidation');

test('accepts a fully specified target goal', () => {
  const result = validateGoalInput({
    type: 'target',
    name: 'Weight',
    unit: 'kg',
    startingValue: '80',
    targetValue: '70',
    direction: 'decrease',
    deadline: '2026-12-31',
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.goal.startingValue, 80);
  assert.strictEqual(result.goal.targetValue, 70);
});

test('rejects a target goal missing direction', () => {
  const result = validateGoalInput({
    type: 'target',
    name: 'Weight',
    unit: 'kg',
    startingValue: '80',
    targetValue: '70',
    deadline: '2026-12-31',
  });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /Direction/);
});

test('accepts a fully specified aggregate goal', () => {
  const result = validateGoalInput({
    type: 'aggregate',
    name: 'Meditation',
    unit: 'min',
    targetTotal: '10000',
    deadline: '2026-12-31',
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.goal.targetTotal, 10000);
});

test('rejects an aggregate goal missing deadline', () => {
  const result = validateGoalInput({ type: 'aggregate', name: 'Meditation', unit: 'min', targetTotal: '10000' });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /deadline/);
});

test('accepts a streak goal with no deadline', () => {
  const result = validateGoalInput({ type: 'streak', name: 'No non-veg' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.goal.deadline, null);
});

test('accepts a streak goal with a valid deadline', () => {
  const result = validateGoalInput({ type: 'streak', name: '100-day streak', deadline: '2026-11-01' });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.goal.deadline, '2026-11-01');
});

test('rejects a streak goal with a malformed deadline', () => {
  const result = validateGoalInput({ type: 'streak', name: 'No non-veg', deadline: 'not-a-date' });
  assert.strictEqual(result.ok, false);
});

test('rejects a blank name', () => {
  const result = validateGoalInput({ type: 'streak', name: '   ' });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /Name/);
});

test('rejects an invalid type', () => {
  const result = validateGoalInput({ type: 'bogus', name: 'X' });
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /valid goal type/);
});
