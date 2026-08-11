const BASE_STYLE = `
  :root {
    color-scheme: light dark;
    --bg: #fafaf9;
    --fg: #1c1c1a;
    --muted: #6b6b66;
    --accent: #3f6b52;
    --border: #e4e4e1;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #141412;
      --fg: #f2f2ef;
      --muted: #9a9a94;
      --accent: #7fbf9d;
      --border: #2a2a26;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    text-align: center;
  }
  h1 { font-size: 1.75rem; font-weight: 600; margin: 0; letter-spacing: -0.02em; }
  p { color: var(--muted); margin: 0; max-width: 32ch; }
  a.button, button.button {
    appearance: none;
    border: none;
    background: var(--accent);
    color: var(--bg);
    font-size: 1rem;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 999px;
    text-decoration: none;
    cursor: pointer;
  }
  button.link, a.link {
    appearance: none;
    background: none;
    border: none;
    color: var(--muted);
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.9rem;
  }
  .container {
    width: 100%;
    max-width: 28rem;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .container h1 { text-align: center; }
  ul.goal-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
  ul.goal-list a {
    display: block;
    padding: 0.85rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    text-decoration: none;
    color: var(--fg);
    font-weight: 500;
  }
  ul.goal-list .goal-type { color: var(--muted); font-weight: 400; font-size: 0.85rem; }
  form.stack { display: flex; flex-direction: column; gap: 1rem; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; text-align: left; }
  .field label { font-size: 0.85rem; color: var(--muted); }
  .field input, .field select {
    padding: 0.6rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--fg);
    font-size: 1rem;
  }
  .row { display: flex; gap: 0.75rem; justify-content: center; align-items: center; }
`;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${BASE_STYLE}</style>
</head>
<body>
${body}
</body>
</html>`;
}

function signedOutPage() {
  return page(
    'GOAT',
    `
    <h1>GOAT</h1>
    <p>Sign in with Google to start tracking your goals.</p>
    <a class="button" href="/auth/google">Sign in with Google</a>
  `
  );
}

function signedInPage(spreadsheetId) {
  const sheetLink = spreadsheetId
    ? `<p><a class="link" href="https://docs.google.com/spreadsheets/d/${escapeHtml(
        spreadsheetId
      )}/edit" target="_blank" rel="noopener">Open your GOAT data sheet</a></p>`
    : '';
  return page(
    'GOAT',
    `
    <h1>GOAT</h1>
    <p>You're signed in. Today &amp; Progress sections are on their way.</p>
    <a class="button" href="/goals">Your goals</a>
    ${sheetLink}
    <form method="POST" action="/auth/signout">
      <button class="link" type="submit">Sign out</button>
    </form>
  `
  );
}

const TYPE_LABELS = { target: 'Target', aggregate: 'Aggregate', streak: 'Streak' };

function goalsListPage(goals) {
  const items = goals.length
    ? `<ul class="goal-list">${goals
        .map(
          (g) =>
            `<li><a href="/goals/${escapeHtml(g.id)}">${escapeHtml(g.name)} <span class="goal-type">${
              TYPE_LABELS[g.type] || g.type
            }</span></a></li>`
        )
        .join('')}</ul>`
    : '<p>No goals yet — add your first one below.</p>';

  return page(
    'GOAT — Your Goals',
    `
    <div class="container">
      <h1>Your Goals</h1>
      ${items}
      <div class="row">
        <a class="button" href="/goals/new">Add goal</a>
      </div>
      <div class="row"><a class="link" href="/">Back home</a></div>
    </div>
  `
  );
}

function newGoalPage({ error } = {}) {
  const errorHtml = error ? `<p style="color:#b3453f">${escapeHtml(error)}</p>` : '';
  return page(
    'GOAT — Add Goal',
    `
    <div class="container">
      <h1>Add Goal</h1>
      ${errorHtml}
      <form class="stack" method="POST" action="/goals">
        <div class="field">
          <label for="type">Type</label>
          <select id="type" name="type" required>
            <option value="target">Target — reach a value by a date</option>
            <option value="aggregate">Aggregate — accumulate a total by a date</option>
            <option value="streak">Streak — consecutive days of success</option>
          </select>
        </div>
        <div class="field">
          <label for="name">Name</label>
          <input id="name" name="name" type="text" required maxlength="80" />
        </div>
        <div class="field">
          <label for="unit">Unit <span style="opacity:.7">(target/aggregate only)</span></label>
          <input id="unit" name="unit" type="text" maxlength="20" placeholder="kg, min, pages..." />
        </div>
        <div class="field">
          <label for="startingValue">Starting value <span style="opacity:.7">(target only)</span></label>
          <input id="startingValue" name="startingValue" type="number" step="any" />
        </div>
        <div class="field">
          <label for="targetValue">Target value <span style="opacity:.7">(target only)</span></label>
          <input id="targetValue" name="targetValue" type="number" step="any" />
        </div>
        <div class="field">
          <label for="direction">Direction <span style="opacity:.7">(target only)</span></label>
          <select id="direction" name="direction">
            <option value="">—</option>
            <option value="decrease">Decrease</option>
            <option value="increase">Increase</option>
          </select>
        </div>
        <div class="field">
          <label for="targetTotal">Target total <span style="opacity:.7">(aggregate only)</span></label>
          <input id="targetTotal" name="targetTotal" type="number" step="any" />
        </div>
        <div class="field">
          <label for="deadline">Deadline <span style="opacity:.7">(optional for streak)</span></label>
          <input id="deadline" name="deadline" type="date" />
        </div>
        <div class="row">
          <button class="button" type="submit">Create goal</button>
        </div>
      </form>
      <div class="row"><a class="link" href="/goals">Cancel</a></div>
    </div>
  `
  );
}

function goalDetailPage(goal) {
  const fields = [];
  if (goal.type === 'target') {
    fields.push(`${goal.startingValue ?? '?'} → ${goal.targetValue ?? '?'} ${goal.unit || ''}`.trim());
  } else if (goal.type === 'aggregate') {
    fields.push(`Target: ${goal.targetTotal ?? '?'} ${goal.unit || ''}`.trim());
  }
  if (goal.deadline) fields.push(`Deadline: ${escapeHtml(goal.deadline)}`);

  const archiveForm = goal.archived
    ? '<p><em>Archived</em></p>'
    : `<form method="POST" action="/goals/${escapeHtml(goal.id)}/archive">
        <button class="link" type="submit">Archive this goal</button>
      </form>`;

  return page(
    `GOAT — ${goal.name}`,
    `
    <div class="container">
      <h1>${escapeHtml(goal.name)}</h1>
      <p>${TYPE_LABELS[goal.type] || goal.type}</p>
      ${fields.map((f) => `<p>${f}</p>`).join('')}
      ${archiveForm}
      <div class="row"><a class="link" href="/goals">Back to goals</a></div>
    </div>
  `
  );
}

module.exports = {
  signedOutPage,
  signedInPage,
  goalsListPage,
  newGoalPage,
  goalDetailPage,
  escapeHtml,
};
