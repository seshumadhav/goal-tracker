const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const TOKEN_PATH = path.join(os.tmpdir(), `goat-test-token-${process.pid}.json`);
process.env.GOOGLE_TOKEN_PATH = TOKEN_PATH;
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

const app = require('../server.js');

function cleanup() {
  try {
    fs.unlinkSync(TOKEN_PATH);
  } catch {
    // already gone
  }
}

before(cleanup);
after(cleanup);
beforeEach(cleanup);

async function withServer(fn) {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    await fn(`http://localhost:${port}`);
  } finally {
    server.close();
  }
}

// TEMP: "/" is the Home screen and currently bypasses sign-in while the UI
// is built against ephemeral storage (see server.js) — these assertions
// reflect that intentionally, not a silent auth regression.
test('GET / is reachable without signing in (auth temporarily bypassed)', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/`);
    assert.strictEqual(res.status, 200);
  });
});

test('GET /auth/google redirects to Google\'s OAuth consent screen', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/auth/google`, { redirect: 'manual' });

    assert.strictEqual(res.status, 302);
    const location = res.headers.get('location');
    assert.match(location, /^https:\/\/accounts\.google\.com/);
    assert.match(location, /drive\.file/);
  });
});

test('GET /auth/google computes an https redirect_uri when Nginx forwards X-Forwarded-Proto', async () => {
  // Nginx passes the original Host header through unchanged (proxy_set_header
  // Host $host in nginx/goat.conf), so only the protocol needs `trust proxy`
  // to be reported correctly — Express's req.protocol otherwise always says
  // "http" for a plain TCP connection, even when Nginx terminated TLS.
  await withServer(async (base) => {
    const res = await fetch(`${base}/auth/google`, {
      redirect: 'manual',
      headers: { 'X-Forwarded-Proto': 'https' },
    });

    const location = res.headers.get('location');
    const redirectUri = new URL(location).searchParams.get('redirect_uri');
    assert.match(redirectUri, /^https:\/\//);
  });
});

test('isSignedIn() falls back to signed-out for an unrefreshable token (auth.js still exercised, just not wired into "/")', async () => {
  const authLib = require('../lib/auth');
  fs.writeFileSync(
    TOKEN_PATH,
    JSON.stringify({ refresh_token: 'fake-refresh-token', access_token: 'fake-access-token' })
  );

  const signedIn = await authLib.isSignedIn();
  assert.strictEqual(signedIn, false);
});

test('POST /auth/signout clears the token file and redirects home', async () => {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify({ refresh_token: 'fake-refresh-token' }));

  await withServer(async (base) => {
    const res = await fetch(`${base}/auth/signout`, { method: 'POST', redirect: 'manual' });

    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.headers.get('location'), '/');
    assert.strictEqual(fs.existsSync(TOKEN_PATH), false);
  });
});
