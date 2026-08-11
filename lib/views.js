const BASE_STYLE = `
  :root {
    color-scheme: light dark;
    --bg: #fafaf9;
    --surface: #ffffff;
    --fg: #171715;
    --muted: #79766f;
    --accent: #3f6b52;
    --accent-fg: #f4f7f5;
    --border: #e7e5e1;
    --danger: #b3453f;
    --radius: 0.9rem;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #101010;
      --surface: #1a1a18;
      --fg: #f2f1ee;
      --muted: #96938c;
      --accent: #86c9a3;
      --accent-fg: #0d1a13;
      --border: #2b2a26;
      --danger: #e08079;
    }
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  a { color: inherit; }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    padding: 0.9rem 1.25rem;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
  }
  .brand {
    font-weight: 700;
    font-size: 1.05rem;
    letter-spacing: -0.01em;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }
  .brand::before {
    content: "";
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: var(--accent);
  }
  main {
    max-width: 30rem;
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
  }
  .hero {
    min-height: calc(100vh - 3.5rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 1.1rem;
    padding: 1.5rem 0;
  }
  h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.25rem; letter-spacing: -0.02em; }
  .hero h1 { font-size: 1.9rem; margin: 0; }
  p { color: var(--muted); margin: 0; line-height: 1.5; }
  .eyebrow {
    font-size: 0.76rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin: 0 0 0.35rem;
  }
  .btn, button.btn {
    appearance: none;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
    font-weight: 600;
    font-family: inherit;
    padding: 0.7rem 1.3rem;
    border-radius: 999px;
    text-decoration: none;
    transition: opacity 0.15s ease, transform 0.1s ease;
  }
  .btn:active { transform: scale(0.98); }
  .btn-primary { background: var(--accent); color: var(--accent-fg); }
  .btn-primary:hover { opacity: 0.9; }
  .btn-block { width: 100%; }
  .text-link, button.text-link {
    appearance: none;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--muted);
    font-size: 0.88rem;
    font-family: inherit;
    text-decoration: none;
    padding: 0;
  }
  .text-link:hover { color: var(--fg); }
  .stack { display: flex; flex-direction: column; gap: 0.9rem; }
  .actions { display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center; }
  .card-list { list-style: none; margin: 1.25rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
  .card-list a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem 1.1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    text-decoration: none;
    color: var(--fg);
    font-weight: 600;
    transition: border-color 0.15s ease, transform 0.1s ease;
  }
  .card-list a:hover { border-color: var(--accent); }
  .card-list a:active { transform: scale(0.99); }
  .badge {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--muted);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.22rem 0.6rem;
    white-space: nowrap;
  }
  .empty-state { padding: 1.5rem 0 0.5rem; }
  .empty-state p { margin-bottom: 1.1rem; }
  form.stack { margin-top: 1.25rem; }
  .field { display: flex; flex-direction: column; gap: 0.4rem; }
  .field label { font-size: 0.82rem; font-weight: 600; color: var(--muted); }
  .field .hint { font-weight: 400; opacity: 0.8; }
  .field input, .field select {
    padding: 0.7rem 0.85rem;
    border-radius: 0.6rem;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--fg);
    font-size: 1rem;
    font-family: inherit;
  }
  .field input:focus, .field select:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
    border-color: var(--accent);
  }
  .error-banner {
    color: var(--danger);
    border: 1px solid var(--danger);
    border-radius: 0.6rem;
    padding: 0.6rem 0.85rem;
    font-size: 0.9rem;
  }
  .stat-line { font-size: 1.15rem; font-weight: 600; color: var(--fg); margin: 0.9rem 0 0; }
  .meta-line { font-size: 0.88rem; margin-top: 0.35rem; }
  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    text-decoration: none;
    cursor: pointer;
    flex: none;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .icon-btn:hover { color: var(--fg); border-color: var(--muted); }
  .icon-btn.danger:hover { color: var(--danger); border-color: var(--danger); }
  .icon-btn svg { width: 18px; height: 18px; }
  .topbar .icon-btn { border: none; background: none; }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

const ICON_BACK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
const ICON_ARCHIVE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 13h4"/></svg>';
const ICON_TRASH =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';
const ICON_PLUS =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>';

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

function topbar(backHref) {
  const back = backHref
    ? `<a class="icon-btn" href="${escapeHtml(backHref)}" aria-label="Back">${ICON_BACK}</a>`
    : '';
  return `<header class="topbar" style="gap:0.75rem">${back}<a class="brand" href="/goals">GOAT</a></header>`;
}

function signedOutPage() {
  return page(
    'GOAT',
    `
    ${topbar()}
    <main>
      <div class="hero">
        <p class="eyebrow">Welcome</p>
        <h1>GOAT</h1>
        <p>Sign in with Google to start tracking your goals.</p>
        <a class="btn btn-primary" href="/auth/google">Sign in with Google</a>
      </div>
    </main>
  `
  );
}

function signedInPage(spreadsheetId) {
  const sheetLink = spreadsheetId
    ? `<p class="meta-line"><a class="text-link" href="https://docs.google.com/spreadsheets/d/${escapeHtml(
        spreadsheetId
      )}/edit" target="_blank" rel="noopener">Open your GOAT data sheet ↗</a></p>`
    : '';
  return page(
    'GOAT',
    `
    ${topbar()}
    <main>
      <div class="hero">
        <p class="eyebrow">Signed in</p>
        <h1>Ready to track</h1>
        <p>Today &amp; Progress sections are on their way.</p>
        <div class="actions">
          <a class="btn btn-primary" href="/goals">Your goals</a>
        </div>
        ${sheetLink}
        <form method="POST" action="/auth/signout">
          <button class="text-link" type="submit">Sign out</button>
        </form>
      </div>
    </main>
  `
  );
}

const TYPE_LABELS = { target: 'Target', aggregate: 'Aggregate', streak: 'Streak' };

function goalsListPage(goals) {
  const items = goals.length
    ? `<ul class="card-list">${goals
        .map(
          (g) =>
            `<li><a href="/goals/${escapeHtml(g.id)}"><span>${escapeHtml(g.name)}</span><span class="badge">${
              TYPE_LABELS[g.type] || g.type
            }</span></a></li>`
        )
        .join('')}</ul>`
    : '<div class="empty-state"><p>No goals yet — add your first one below.</p></div>';

  return page(
    'GOAT — Your Goals',
    `
    ${topbar()}
    <main>
      <p class="eyebrow">Goals</p>
      <h1>Your Goals</h1>
      ${items}
      <div class="actions" style="margin-top:1.25rem">
        <a class="icon-btn" style="width:2.75rem;height:2.75rem;border-color:var(--accent);color:var(--accent)" href="/goals/new" aria-label="Add goal">
          ${ICON_PLUS}
        </a>
      </div>
    </main>
  `
  );
}

function newGoalPage({ error, values = {} } = {}) {
  const errorHtml = error ? `<div class="error-banner">${escapeHtml(error)}</div>` : '';
  const v = (name, fallback = '') => escapeHtml(values[name] !== undefined ? values[name] : fallback);
  const selected = (name, option) => (values[name] === option ? ' selected' : '');

  return page(
    'GOAT — Add Goal',
    `
    ${topbar('/goals')}
    <main>
      <p class="eyebrow">New</p>
      <h1>Add Goal</h1>
      <form class="stack" method="POST" action="/goals">
        ${errorHtml}
        <div class="field">
          <label for="type">Type</label>
          <select id="type" name="type" required>
            <option value="target"${selected('type', 'target')}>Target — reach a value by a date</option>
            <option value="aggregate"${selected('type', 'aggregate')}>Aggregate — accumulate a total by a date</option>
            <option value="streak"${selected('type', 'streak')}>Streak — consecutive days of success</option>
          </select>
        </div>
        <div class="field">
          <label for="name">Name</label>
          <input id="name" name="name" type="text" required maxlength="80" value="${v('name')}" />
        </div>
        <div class="field">
          <label for="unit">Unit <span class="hint">(target/aggregate only)</span></label>
          <input id="unit" name="unit" type="text" maxlength="20" placeholder="lbs, min, pages..." value="${v(
            'unit',
            'lbs'
          )}" />
        </div>
        <div class="field">
          <label for="startingValue">Starting value <span class="hint">(target only)</span></label>
          <input id="startingValue" name="startingValue" type="number" step="any" value="${v('startingValue')}" />
        </div>
        <div class="field">
          <label for="targetValue">Target value <span class="hint">(target only)</span></label>
          <input id="targetValue" name="targetValue" type="number" step="any" value="${v('targetValue')}" />
        </div>
        <div class="field">
          <label for="direction">Direction <span class="hint">(target only)</span></label>
          <select id="direction" name="direction">
            <option value="">—</option>
            <option value="decrease"${selected('direction', 'decrease')}>Decrease</option>
            <option value="increase"${selected('direction', 'increase')}>Increase</option>
          </select>
        </div>
        <div class="field">
          <label for="targetTotal">Target total <span class="hint">(aggregate only)</span></label>
          <input id="targetTotal" name="targetTotal" type="number" step="any" value="${v('targetTotal')}" />
        </div>
        <div class="field">
          <label for="deadline">Deadline <span class="hint">(optional for streak)</span></label>
          <input id="deadline" name="deadline" type="date" value="${v('deadline')}" />
        </div>
        <button class="btn btn-primary btn-block" type="submit">Create goal</button>
      </form>
    </main>
  `
  );
}

function goalDetailPage(goal) {
  const statLine =
    goal.type === 'target'
      ? `${goal.startingValue ?? '?'} → ${goal.targetValue ?? '?'} ${goal.unit || ''}`.trim()
      : goal.type === 'aggregate'
      ? `Target: ${goal.targetTotal ?? '?'} ${goal.unit || ''}`.trim()
      : null;

  const actions = goal.archived
    ? '<span class="badge">Archived</span>'
    : `<form method="POST" action="/goals/${escapeHtml(goal.id)}/archive">
        <button class="icon-btn" type="submit" aria-label="Archive this goal" title="Archive">
          ${ICON_ARCHIVE}<span class="sr-only">Archive this goal</span>
        </button>
      </form>
      <form method="POST" action="/goals/${escapeHtml(goal.id)}/delete" onsubmit="return confirm('Delete this goal? This cannot be undone.')">
        <button class="icon-btn danger" type="submit" aria-label="Delete this goal" title="Delete">
          ${ICON_TRASH}<span class="sr-only">Delete this goal</span>
        </button>
      </form>`;

  return page(
    `GOAT — ${goal.name}`,
    `
    ${topbar('/goals')}
    <main>
      <p class="eyebrow">${TYPE_LABELS[goal.type] || goal.type}</p>
      <h1>${escapeHtml(goal.name)}</h1>
      ${statLine ? `<p class="stat-line">${escapeHtml(statLine)}</p>` : ''}
      ${goal.deadline ? `<p class="meta-line">Deadline: ${escapeHtml(goal.deadline)}</p>` : ''}
      <div class="actions" style="margin-top:1.5rem">${actions}</div>
    </main>
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
