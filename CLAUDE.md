# GOAT (Goal Tracker)

See `_bmad-output/planning-artifacts/prds/prd-smc-goal-tracker-2026-08-10/prd.md` for full requirements,
`_bmad-output/planning-artifacts/epics.md` for the epic/story breakdown, and `ARCHITECTURE.md` / `SERVER_INFO.md`
for design and deployment constraints.

## Testing

Run `npm test` before starting any code change and again after finishing it — both to confirm you're
starting from a green baseline and to catch regressions before reporting the work as done. Currently
runs Node's built-in test runner (`node --test`) over `tests/*.test.js`.

## Deployment

Every push to `main` that passes CI auto-deploys to the shared EC2 instance via `deploy.sh` (PM2 process
`goat`, Nginx vhost `nginx/goat.conf`). Live at https://goat.duckdns.org. See `SERVER_INFO.md` for
server access details.
