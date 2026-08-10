---
title: Goal Tracker
status: draft
created: 2026-08-10
updated: 2026-08-10
---

# PRD: Goal Tracker
*Working title — confirm.*

## 0. Document Purpose

This PRD captures the scope for a personal, single-user goal-tracking web app for Smc. It is written for Smc as builder and future reference — vocabulary is fixed in the Glossary (§3), requirements are grouped by feature with globally-numbered FRs, and inferred decisions are tagged `[ASSUMPTION]` inline and indexed in §9 for confirmation before build starts. No prior UX or research artifacts exist yet; this PRD is the first captured document for the project.

## 1. Vision

Goal Tracker is a minimal personal app for tracking progress on a handful of self-set goals — a target to hit (like a weight), a cumulative total to reach (like meditation minutes), or a streak to keep alive (like avoiding meat). Every goal type reduces to the same daily ritual: open the app, log today, glance at how things stand. The app gets out of the way — no gamification, no decorative clutter, no social layer — just a clean daily log and an honest picture of progress, backed by a Google Sheet the user already owns and controls.

It matters because most habit/goal trackers either overwhelm with gamification (points, badges, social feeds) or lock personal data into a proprietary backend. This app stays small, stays legible, and keeps the data in the user's own Google Sheet.

## 2. Target User

### 2.1 Jobs To Be Done
- As the sole user and builder, I want a fast, low-friction way to log today's progress across all my active goals in one place, so tracking doesn't become its own chore.
- I want to see, at a glance, how each goal is trending relative to its target or streak, so I know whether I'm on pace without digging through history.
- I want my data to live somewhere I already trust and control (my own Google Sheet), not a third-party service's database.

### 2.2 Non-Users (v1)
Multi-user or shared tracking (couples, teams, coaches) is explicitly out of scope — this is a single-user tool for Smc's own Google account.

### 2.3 Key User Journeys
*Hobby/solo scope — journeys kept lightweight per PRD Discipline scope dial.*

- **UJ-1.** Smc, first thing in the morning on their phone, opens the app, taps into the "Today" section, and logs this morning's weight, today's meditation minutes, and a "yes" for no-meat — three quick taps/entries, done in under a minute.
- **UJ-2.** Smc, mid-week, wants to know if they're on pace for their weight target before a checkup — opens the app, glances at the progress section, sees "62% to target, 12 days left" without navigating anywhere else.
- **UJ-3.** Smc starts a new goal (e.g., "read 500 pages this month") — opens the Goals List page, taps "add goal," fills in type/target/deadline, and it appears immediately in both Today and Progress sections.

## 3. Glossary

- **Goal** — A trackable objective the user defines. Has a name, a **Goal Type** (Target, Aggregate, or Streak), and an ordered log of **Entries**. Belongs to one user (Smc).
- **Goal Type** — One of three shapes: **Target Goal**, **Aggregate Goal**, **Streak Goal**. Fixed at goal creation; not changeable afterward.
- **Target Goal** — A goal tracked toward a single numeric target by a **Deadline**, from a known starting point (e.g., weight: 80kg → 70kg). Has a **Starting Value**, **Target Value**, **Direction** (increase or decrease), and a **Unit**. Each Entry is a point-in-time reading (today's value), not cumulative.
- **Aggregate Goal** — A goal tracked as a running total accumulated toward a numeric target by a **Deadline** (e.g., meditation: 10,000 minutes). Has a **Target Total** and a **Unit**. Each Entry is an increment added to the running total.
- **Streak Goal** — A goal tracked as consecutive days of success (e.g., no non-veg). Has no numeric target; each Entry is a daily success/fail flag. Deadline is optional [ASSUMPTION, see §9].
- **Entry** (or **Daily Record**) — One day's logged data point for a Goal. At most one Entry per Goal per calendar day. v1 is append-only (§9 — no edit/delete of past Entries).
- **Deadline** — The date by which a Target or Aggregate Goal's target should be reached. Required for Target and Aggregate Goals.
- **Progress** — For Target/Aggregate Goals: percentage of the way from start (0, or Starting Value) to Target Value/Target Total, based on the latest/cumulative Entry data, shown alongside days remaining until Deadline.
- **Streak Length** — For Streak Goals: count of consecutive calendar days, ending on the most recent logged day, with a successful Entry. Resets to 0 the first calendar day that passes without a logged success (§4.3, FR-6).
- **Today Section** — Home screen area listing every active Goal with a quick-entry control for logging today's Entry.
- **Progress Section** — Home screen area summarizing current status (Progress % / days left, or Streak Length) for every active Goal.
- **Goals List Page** — Separate page listing every Goal as a link to its **Goal Detail View**, plus an entry point to create a new Goal.
- **Goal Detail View** — Per-goal page reachable from the Goals List, showing the goal's full Entry history and current status.

## 4. Features

### 4.1 Goal Creation & Management
**Description:** The Goals List Page is the canonical place to see and manage all Goals. Each Goal is a tappable link to its Goal Detail View (realizes UJ-3). Creating a Goal requires picking a Goal Type first, which determines which fields appear next.

#### FR-1: Create Goal
User can create a new Goal from the Goals List Page by choosing a Goal Type and filling in its type-specific fields. Realizes UJ-3.

**Consequences (testable):**
- Target Goal creation requires: name, unit, starting value, target value, direction (increase/decrease), deadline.
- Aggregate Goal creation requires: name, unit, target total, deadline.
- Streak Goal creation requires: name; deadline is optional. `[ASSUMPTION]`
- A newly created Goal appears immediately in the Today Section and Progress Section on the home screen without requiring a page refresh/re-login.
- Goal Type cannot be changed after creation.

**Out of Scope:**
- Editing a Goal's target value, deadline, or other fields after creation is not in v1 — see §9 Open Questions.

#### FR-2: View Goals List
User can view all Goals as a list of hyperlinks on the Goals List Page, each linking to its Goal Detail View.

**Consequences (testable):**
- Every Goal the user has created appears in the list, regardless of Goal Type or progress state.
- Tapping a Goal navigates to its Goal Detail View (FR-7).

#### FR-3: Archive/Delete Goal `[ASSUMPTION]`
User can archive or delete a Goal from its Goal Detail View so the Goals List, Today Section, and Progress Section don't accumulate abandoned goals indefinitely.

**Consequences (testable):**
- Archived Goals no longer appear in the Today Section or Progress Section.
- Archived Goals' historical Entries are preserved in the Google Sheet, not deleted.

**Notes:** Not explicitly requested — inferred as necessary for long-term usability. Confirm in §9.

### 4.2 Daily Logging
**Description:** The Today Section is the home-screen surface for logging today's progress across every active Goal in one pass (realizes UJ-1). The logging control adapts to Goal Type.

#### FR-4: Log Today's Entry
User can log today's Entry for any active Goal directly from the Today Section, using a control appropriate to its Goal Type.

**Consequences (testable):**
- Target Goal: numeric input for today's reading (e.g., today's weight). If logged more than once on the same calendar day, the latest value is what counts as today's reading. `[ASSUMPTION]`
- Aggregate Goal: numeric input for today's increment (e.g., minutes meditated in this session). If logged more than once on the same calendar day, increments sum together (e.g., two separate meditation sessions same day). `[ASSUMPTION]`
- Streak Goal: single success/fail toggle for today. Re-toggling the same day updates that day's flag rather than creating a duplicate day. `[ASSUMPTION]`
- A logged Entry is written to the user's Google Sheet (FR-8) and immediately reflected in the Progress Section without requiring navigation away from the home screen.
- v1 is append-only: once a calendar day is in the past, its Entry cannot be edited or deleted from the app (see §9).

**Out of Scope:**
- Editing/deleting a past day's Entry (deferred — see §9).

### 4.3 Progress Overview
**Description:** The Progress Section summarizes current status per Goal so the user can tell at a glance whether they're on pace (realizes UJ-2), without opening each Goal individually.

#### FR-5: View Progress Summary
User can view, in the Progress Section on the home screen, a one-line status per active Goal appropriate to its Goal Type.

**Consequences (testable):**
- Target Goal: shows Progress % (based on latest reading between Starting Value and Target Value) and days remaining until Deadline.
- Aggregate Goal: shows running total vs. Target Total (e.g., "3,200 / 10,000 min") and days remaining until Deadline.
- Streak Goal: shows current Streak Length (e.g., "14-day streak").
- A Goal past its Deadline without reaching its target is visually flagged as overdue rather than silently hidden. `[ASSUMPTION]`

#### FR-6: Streak Break Detection
System detects a broken Streak Goal when a calendar day passes with no logged success Entry.

**Consequences (testable):**
- Streak Length resets to 0 as soon as the app is opened on/after the first missed day (computed at render time by comparing the last successful Entry's date to today — no background job or cron required).
- An explicit "fail" log also resets Streak Length to 0 immediately.

#### FR-7: Goal Detail View
User can tap any Goal from the Goals List Page to see that Goal's full Entry history and current status. `[ASSUMPTION]`

**Consequences (testable):**
- Shows every logged Entry for the Goal, most recent first.
- Shows the same status summary as the Progress Section (FR-5) for that single Goal.

**Notes:** Inferred from "list all goals as hyperlinks" — a link needs a destination. Confirm in §9.

### 4.4 Google Account & Data Sync
**Description:** All Goal and Entry data lives in a Google Sheet in the user's own Drive, tied to their personal Gmail account — no separate backend database.

#### FR-8: Sign In With Google
User signs in with their Google account each session to authorize the app to read/write a Google Sheet in their Drive.

**Consequences (testable):**
- On first sign-in, the app creates (or lets the user select) a dedicated Google Sheet to store Goals and Entries. `[ASSUMPTION]`
- OAuth scope is limited to the files the app creates/uses (Drive file-scope), not full Drive access. `[ASSUMPTION]`
- Session persists across visits on the same browser without requiring re-login every time, until the user explicitly signs out or the token is revoked.
- The Node.js backend (§ Deployment & Development Standards) holds the Google OAuth refresh token server-side (not in the browser) so it can call the Sheets API on the user's behalf between sessions; since this is single-user, no multi-account token store is needed. `[ASSUMPTION]`

#### FR-9: Sheet as System of Record
All Goal definitions and Entries are stored in the connected Google Sheet; the app has no other persistent datastore.

**Consequences (testable):**
- Reads/writes to the Sheet use batched Sheets API calls (batchGet/batchUpdate), not per-cell calls, to stay well within Google's per-user quota. `[ASSUMPTION]`
- On a rate-limit response (HTTP 429), the app retries with exponential backoff rather than failing the log action outright.

**Feature-specific NFRs:**
- Logging today's Entry should complete (round trip to the Sheet) in under 2 seconds on a typical mobile connection.

## 5. Non-Goals (Explicit)

- Not a multi-user or shared/social tracker — no sharing, comments, or collaboration in v1.
- Not gamified — no points, badges, levels, or streak-shaming notifications. `(informed by research: gamification layers are a commonly cited source of clutter/overwhelm in comparable apps)`
- Not a native mobile app — v1 is a mobile-optimized responsive web app only.
- Not an offline-first app — v1 requires connectivity to log or view data (see §9).
- Not a general habit-tracking platform with arbitrary goal-type plugins — exactly three Goal Types (Target, Aggregate, Streak) for v1.

## 6. MVP Scope

### 6.1 In Scope
- Three Goal Types: Target, Aggregate, Streak (FR-1).
- Goals List Page: view all goals, create new goal, archive/delete goal (FR-1, FR-2, FR-3).
- Home screen with Today Section (FR-4) and Progress Section (FR-5, FR-6).
- Goal Detail View with full Entry history (FR-7).
- Google Sign-In and Google Sheet as sole datastore (FR-8, FR-9).
- Minimal, modern, mobile-optimized responsive UI (§ Aesthetic and Tone).

### 6.2 Out of Scope for MVP
- Editing or deleting a past day's Entry — append-only for v1. `[NOTE FOR PM]` — revisit if mistakes in logging become a frequent frustration.
- Reminders/notifications to log daily.
- Offline support (local queue + sync-on-reconnect) — deferred; v1 requires live connectivity.
- Multi-device conflict handling beyond "last write wins" per day, per FR-4 assumptions.
- Any monetization, ads, or account tiers — not applicable to a personal single-user tool.

## 7. Success Metrics

**Primary**
- **SM-1**: Smc logs at least one Entry on 5+ days per week, sustained for 4+ consecutive weeks after launch. Validates FR-4.

**Secondary**
- **SM-2**: Smc still opens the app without prompting after 30 days (no abandonment). Validates FR-4, FR-5.

**Counter-metrics (do not optimize)**
- **SM-C1**: Number of Goal Types or fields does not creep upward to "cover every possible use case" — three Goal Types stay sufficient. Counterbalances feature-creep pressure from SM-1/SM-2 usage data.

## Aesthetic and Tone
Minimal, modern, low text density. No marketing copy, no motivational microcopy, no decorative color blocking. Muted/neutral palette with sparing use of a single accent color for progress indicators; numbers-forward typography (large, legible figures for streak length and progress %) over illustrations or icons-as-decoration. `(informed by research: Habitica's multi-currency/gamified UI is a commonly cited example of clutter to avoid; Way of Life's clear "broken chain" indicator is a pattern worth keeping)`

## Platform
Mobile web browser is the primary surface (responsive layout, touch-first controls, large tap targets). Must also function correctly in a desktop browser for occasional multi-device use, but mobile is the design priority. No native app in v1.

## Information Architecture
Two top-level surfaces:
1. **Home** — Today Section + Progress Section (default landing page after sign-in).
2. **Goals List** — all goals as links + "add goal" entry point → **Goal Detail View** (per-goal drill-down).

## Cross-Cutting NFRs
- **Performance**: Today's logging action completes in <2s round trip under typical mobile network conditions (FR-9).
- **Data integrity**: Sheets API calls are batched; failed writes due to rate limiting are retried with backoff rather than silently dropped (FR-9).
- **Privacy**: All goal and entry data (including personal health data like weight) stays in the user's own Google Sheet; the backend does not persist a separate copy of Goal/Entry data in its own database — it only holds the OAuth refresh token needed to call the Sheets API (FR-8).

## Deployment & Development Standards
*Invented section — mirrors the standards already established by two sibling personal projects on this machine (`image-hospital`, `the-chocolate-room`), per explicit user instruction, so this project is operationally consistent with the rest of the user's personal infrastructure rather than introducing a new pattern.*

- **Backend**: Node.js (Express), matching both sibling projects' server framework choice.
- **Hosting**: Single AWS EC2 instance, managed with **PM2** as the process manager (`pm2 restart <app-name>` / `pm2 start ... --name <app-name>`), consistent with both siblings. `[ASSUMPTION: reuses the existing shared EC2 instance as a new PM2 app + Nginx vhost, rather than provisioning a separate instance — cheaper and matches the siblings' single-box pattern; confirm in §9]`
- **Reverse proxy / HTTPS**: **Nginx** reverse-proxies the Node app; config lives in-repo (`nginx/<app>.conf`) and is synced to `/etc/nginx/conf.d/` on every deploy, validated with `nginx -t` before reload — exact pattern used by both siblings.
- **DNS**: A new subdomain registered under the existing **DuckDNS** account (free, multi-subdomain), pointed at the shared EC2 instance's IP.
- **TLS certificates**: **Let's Encrypt** via DNS-01 challenge (certbot + DuckDNS DNS plugin), matching `image-hospital`'s `add-subdomain.yml` pattern for on-demand cert issuance.
- **CI**: GitHub Actions `ci.yml` runs tests (and typecheck, if TypeScript is used) on push/PR to `main` — mirrors both siblings.
- **CD**: A separate GitHub Actions `deploy.yml`, gated on CI success (`workflow_run` trigger), SSHes into the EC2 instance (`appleboy/ssh-action`) and runs an in-repo `deploy.sh` that: pulls latest code, installs deps, builds if needed, restarts the PM2 process, re-syncs the Nginx config from the repo, and reloads Nginx after `nginx -t` passes. Auto-deploy on every push to `main`.
- **Documentation convention**: `PRD.md` (this document) + a short `ARCHITECTURE.md` (key constraints/modules) + `CLAUDE.md` (agent-facing instructions, e.g. "run tests before and after any change") — same trio both siblings use.
- **Testing discipline**: tests run before starting any change (confirm green baseline) and again after finishing (catch regressions), enforced via `CLAUDE.md` instructions to the coding agent — same discipline as `image-hospital`.

## 8. Open Questions

1. Does a Streak Goal need an optional Deadline (e.g., "100-day streak challenge") or is it always open-ended? `[ASSUMPTION: optional, defaults to open-ended]`
2. What should happen to a Target/Aggregate Goal once its Deadline passes without reaching the target — stay flagged "overdue" indefinitely until the user archives it, or auto-archive? `[ASSUMPTION: stays flagged overdue, user manually archives via FR-3]`
3. Should Goal fields (target value, deadline, unit) be editable after creation, or is archive-and-recreate the intended fix? `[ASSUMPTION: not editable in v1 — archive and recreate]`
4. Confirm FR-3 (Archive/Delete Goal) is wanted — it was inferred, not explicitly requested.
5. Confirm FR-7 (Goal Detail View / Entry history) is wanted at the depth described, or should it be lighter (just current status, no full history list)?
6. What should the app do if the user opens it with no connectivity — hard error, or a lightweight "you're offline" state? (Full offline support is out of scope per §6.2, but *some* graceful state is likely needed.)
7. Should Goal Tracker share the existing EC2 instance (as a new PM2 app + Nginx vhost) used by `image-hospital`/`the-chocolate-room`, or run on a separate instance? `[ASSUMPTION: shares the existing instance]`
8. Should the backend be TypeScript (like `image-hospital`) or plain JavaScript (like `the-chocolate-room`)? Neither was specified for this project.

## 9. Assumptions Index

- §3/§4.1 — Streak Goals have an optional (not required) Deadline.
- §4.1 FR-1 — Goal Type is immutable after creation; other fields are not editable in v1 (archive-and-recreate instead).
- §4.1 FR-3 — Archive/Delete Goal capability exists, inferred for long-term usability.
- §4.2 FR-4 — Same-day re-logging behavior: Target = latest value wins; Aggregate = increments sum; Streak = toggle updates in place.
- §4.3 FR-5 — Overdue Target/Aggregate Goals are visually flagged, not auto-archived or hidden.
- §4.3 FR-7 — Goal Detail View exists and shows full Entry history (inferred from "list all goals as hyperlinks").
- §4.4 FR-8 — First sign-in either creates a new dedicated Google Sheet or lets the user pick an existing one; OAuth scope is limited to app-created files (Drive file-scope).
- §4.4 FR-9 — Sheets API calls are batched (batchGet/batchUpdate) and use exponential backoff on rate-limit errors.
- §4.4 FR-8 — Backend holds the OAuth refresh token server-side; no separate copy of Goal/Entry data is retained outside the Sheet.
- §Deployment & Development Standards — Reuses the existing shared EC2 instance (new PM2 app + Nginx vhost + DuckDNS subdomain) rather than provisioning a new instance.
