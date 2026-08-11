const fs = require('fs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');

// Drive file-scope only: the app can only see/edit files it creates or that
// the user explicitly opens with it, never the user's whole Drive (FR8).
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const TOKEN_PATH =
  process.env.GOOGLE_TOKEN_PATH || path.join(__dirname, '..', 'data', 'google-token.json');

function redirectUriFor(req) {
  return `${req.protocol}://${req.get('host')}/auth/google/callback`;
}

function createOAuthClient(redirectUri) {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

function loadToken() {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function saveToken(token) {
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
}

function clearToken() {
  try {
    fs.unlinkSync(TOKEN_PATH);
  } catch {
    // already signed out
  }
}

function authUrlFor(req) {
  const client = createOAuthClient(redirectUriFor(req));
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
}

async function handleCallback(req) {
  const client = createOAuthClient(redirectUriFor(req));
  const { tokens } = await client.getToken(req.query.code);
  saveToken(tokens);
  return tokens;
}

// Verifies the stored refresh token still works by attempting to mint a
// fresh access token. A revoked/expired refresh token is treated as signed
// out rather than a silent failure (FR8).
async function isSignedIn() {
  const token = loadToken();
  if (!token || !token.refresh_token) return false;

  const client = createOAuthClient();
  // Only supply the refresh_token (not any cached access_token) so
  // getAccessToken() is forced to actually exchange it with Google rather
  // than trusting a cached token that looks unexpired.
  client.setCredentials({ refresh_token: token.refresh_token });
  try {
    await client.getAccessToken();
    return true;
  } catch {
    clearToken();
    return false;
  }
}

module.exports = {
  TOKEN_PATH,
  authUrlFor,
  handleCallback,
  isSignedIn,
  clearToken,
  loadToken,
};
