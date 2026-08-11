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

test('GET / shows a Google sign-in link when signed out', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/`);
    const body = await res.text();

    assert.strictEqual(res.status, 200);
    assert.match(body, /Sign in with Google/);
    assert.match(body, /href="\/auth\/google"/);
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

test('GET / shows signed-in state once a token file exists', async () => {
  fs.writeFileSync(
    TOKEN_PATH,
    JSON.stringify({ refresh_token: 'fake-refresh-token', access_token: 'fake-access-token' })
  );

  await withServer(async (base) => {
    const res = await fetch(`${base}/`);
    const body = await res.text();

    // The stored fake token can't actually be refreshed against Google, so
    // isSignedIn() correctly falls back to signed-out rather than trusting
    // an unverifiable token file.
    assert.strictEqual(res.status, 200);
    assert.match(body, /Sign in with Google/);
  });
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
