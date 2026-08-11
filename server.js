const express = require('express');
const auth = require('./lib/auth');
const sheets = require('./lib/sheets');
const goalsRepo = require('./lib/goalsRepo');
const views = require('./lib/views');

const app = express();
const PORT = process.env.PORT || 3002;

// Nginx terminates TLS and forwards X-Forwarded-Proto; without this,
// req.protocol always reports "http" behind the proxy, which would make
// the computed OAuth redirect_uri mismatch the one registered with Google.
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false }));

async function requireAuth(req, res, next) {
  const signedIn = await auth.isSignedIn();
  if (!signedIn) {
    res.redirect('/');
    return;
  }
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

app.get('/goals/:id', requireAuth, async (req, res) => {
  const goal = await goalsRepo.getGoal(sheets.loadSheetId(), req.params.id);
  if (!goal) {
    res.redirect('/goals');
    return;
  }
  res.type('html').send(views.goalDetailPage(goal));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`GOAT listening on port ${PORT}`);
  });
}

module.exports = app;
