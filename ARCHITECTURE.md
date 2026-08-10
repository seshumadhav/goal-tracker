# GOAT (Goal Tracker) — Architecture

## Product Semantics
- Single user (Smc) tracks personal goals of three types: Target, Aggregate, Streak
- Home screen: Today Section (log today's progress) + Progress Section (status per goal)
- Goals List page: browse all goals, create new, archive/delete
- Goal Detail View: full entry history + status for one goal

## Key Constraints
- Backend: Node.js (Express), plain JavaScript, no build step
- Frontend: minimal, modern, mobile-first responsive; plain HTML/CSS/JS served by Express (no framework), matching the-chocolate-room's lightweight approach
- Storage: the user's own Google Sheet via the Sheets API — no other database
- Auth: Google OAuth (Drive file-scope only), refresh token held server-side, never in the browser
- v1 is append-only: a past calendar day's Entry cannot be edited or deleted
- No offline support — the app requires live connectivity to log or view data

## Core Modules
- HTTP API Layer (Express routes)
- Auth Module (Google OAuth flow, server-side token storage/refresh)
- Sheets Client Module — batched reads/writes (batchGet/batchUpdate), exponential backoff on HTTP 429; kept behind an interface so Sheet layout details don't leak into route handlers
- Goal Domain Logic — progress % calculation, streak length + break detection
- UI Layer — static assets + server-rendered views

## Explicit Non-Goals
- No multi-user support or sharing
- No native mobile app
- No offline-first sync
- No editing/deleting past Entries in v1
- No gamification (points, badges, social feed)
