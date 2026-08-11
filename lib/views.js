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
  p { color: var(--muted); margin: 0; max-width: 28ch; }
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
  button.link {
    appearance: none;
    background: none;
    border: none;
    color: var(--muted);
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.9rem;
  }
`;

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
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

function signedInPage() {
  return page(
    'GOAT',
    `
    <h1>GOAT</h1>
    <p>You're signed in. Today &amp; Progress sections are on their way.</p>
    <form method="POST" action="/auth/signout">
      <button class="link" type="submit">Sign out</button>
    </form>
  `
  );
}

module.exports = { signedOutPage, signedInPage };
