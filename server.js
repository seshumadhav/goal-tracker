const express = require('express');
const auth = require('./lib/auth');
const sheets = require('./lib/sheets');
// TEMP: building the UI end-to-end against ephemeral in-memory storage
// before wiring Google Sheets persistence back in. lib/goalsRepo.js (Sheets-
// backed, same function signatures, already built in Story 2.1) is the
// drop-in replacement — swap this one require line when re-enabling it.
const goalsRepo = require('./lib/goalsRepoMemory');
const { validateGoalInput } = require('./lib/goalValidation');
const views = require('./lib/views');

const app = express();
const PORT = process.env.PORT || 3002;

// Nginx terminates TLS and forwards X-Forwarded-Proto; without this,
// req.protocol always reports "http" behind the proxy, which would make
// the computed OAuth redirect_uri mismatch the one registered with Google.
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false }));

// TEMP: sign-in requirement disabled while the UI is built out against
// ephemeral in-memory storage (see goalsRepo require above) — no real user
// data is behind this yet, so there's nothing for auth to protect. Re-enable
// this check when Sheets persistence is wired back in.
async function requireAuth(req, res, next) {
  next();
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', async (req, res) => {
  const signedIn = await auth.isSignedIn();
  res.type('html').send(signedIn ? views.signedInPage(sheets.loadSheetId()) : views.signedOutPage());
});

app.get('/auth/google', (req, res) => {
  res.redirect(auth.authUrlFor(req));
});

app.get('/auth/google/callback', async (req, res) => {
  if (req.query.error || !req.query.code) {
    res.redirect('/');
    return;
  }
  try {
    const tokens = await auth.handleCallback(req);
    await sheets.ensureSheet(tokens.access_token);
  } catch (err) {
    console.error('Google OAuth callback failed:', err.message);
  }
  res.redirect('/');
});

app.post('/auth/signout', (req, res) => {
  auth.clearToken();
  res.redirect('/');
});

app.get('/goals', requireAuth, async (req, res) => {
  const goals = await goalsRepo.listGoals(sheets.loadSheetId());
  res.type('html').send(views.goalsListPage(goals));
});

app.get('/goals/new', requireAuth, (req, res) => {
  res.type('html').send(views.newGoalPage());
});

app.post('/goals', requireAuth, async (req, res) => {
  const result = validateGoalInput(req.body);
  if (!result.ok) {
    res.type('html').send(views.newGoalPage({ error: result.error, values: req.body }));
    return;
  }
  await goalsRepo.createGoal(sheets.loadSheetId(), result.goal);
  res.redirect('/goals');
});

app.get('/goals/:id', requireAuth, async (req, res) => {
  const goal = await goalsRepo.getGoal(sheets.loadSheetId(), req.params.id);
  if (!goal) {
    res.redirect('/goals');
    return;
  }
  res.type('html').send(views.goalDetailPage(goal));
});

app.post('/goals/:id/archive', requireAuth, async (req, res) => {
  try {
    await goalsRepo.archiveGoal(sheets.loadSheetId(), req.params.id);
  } catch (err) {
    console.error('Archive failed:', err.message);
  }
  res.redirect('/goals');
});

app.post('/goals/:id/delete', requireAuth, async (req, res) => {
  await goalsRepo.deleteGoal(sheets.loadSheetId(), req.params.id);
  res.redirect('/goals');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`GOAT listening on port ${PORT}`);
  });
}

module.exports = app;
