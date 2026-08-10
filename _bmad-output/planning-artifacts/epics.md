---
stepsCompleted: ["step-01", "step-02", "step-03"]
inputDocuments: ["_bmad-output/planning-artifacts/prds/prd-smc-goal-tracker-2026-08-10/prd.md"]
---

# GOAT (Goal Tracker) - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for GOAT (GOAl Tracker), decomposing the requirements from the PRD (draft) into implementable stories. No Architecture.md or UX design document exists yet for this project — by user decision, this breakdown proceeds from the PRD alone; the PRD's own "Deployment & Development Standards" section stands in for formal architecture decisions. Repo name stays `goal-tracker`; the product/subdomain/PM2-process name is `goat` (`goat.duckdns.org`).

## Requirements Inventory

### Functional Requirements

FR1: User can create a new Goal from the Goals List Page by choosing a Goal Type (Target, Aggregate, or Streak) and filling in its type-specific fields. Target requires name, unit, starting value, target value, direction, deadline. Aggregate requires name, unit, target total, deadline. Streak requires name; deadline optional. Goal Type is immutable after creation.
FR2: User can view all Goals as a list of hyperlinks on the Goals List Page, each linking to its Goal Detail View.
FR3: User can archive or delete a Goal from its Goal Detail View. Archived Goals no longer appear in the Today Section or Progress Section; their historical Entries remain in the Google Sheet.
FR4: User can log today's Entry for any active Goal from the Today Section, with an input control appropriate to Goal Type: numeric reading for Target Goals (latest same-day log wins), numeric increment for Aggregate Goals (same-day logs sum), success/fail toggle for Streak Goals (same-day re-toggle updates in place, no duplicate day). v1 is append-only — past days' Entries cannot be edited or deleted.
FR5: User can view a one-line Progress Summary per active Goal in the Progress Section: Progress % + days remaining until Deadline (Target), running total vs. Target Total + days remaining (Aggregate), or current Streak Length (Streak). A Goal past its Deadline without reaching target is visually flagged as overdue.
FR6: System detects a broken Streak Goal and resets Streak Length to 0 when a calendar day passes with no logged success Entry (computed at render time, no background job) or when an explicit "fail" Entry is logged.
FR7: User can tap any Goal from the Goals List Page to reach its Goal Detail View, showing the Goal's full Entry history (most recent first) and the same status summary shown in the Progress Section.
FR8: User signs in with Google each session to authorize the app. On first sign-in the app creates or lets the user select a dedicated Google Sheet. OAuth scope is limited to app-created files (Drive file-scope). The Node.js backend holds the OAuth refresh token server-side between sessions.
FR9: All Goal and Entry data is stored in the connected Google Sheet as the sole datastore. Sheets API reads/writes are batched (batchGet/batchUpdate); rate-limit responses (HTTP 429) are retried with exponential backoff rather than failing the action.

### NonFunctional Requirements

NFR1 (Performance): Logging today's Entry completes (round trip to the Sheet) in under 2 seconds on a typical mobile connection.
NFR2 (Reliability/Data integrity): Sheets API calls stay within Google's per-user quota via batching; failed writes due to rate limiting are retried, never silently dropped.
NFR3 (Privacy): The backend never persists a separate copy of Goal/Entry data in its own database — only the OAuth refresh token is held server-side; all substantive data lives solely in the user's Google Sheet.
NFR4 (Usability/UI): Minimal, modern, low-text-density UI — no marketing copy, no gamification, muted/neutral palette with a single sparing accent color, numbers-forward typography. Mobile-first responsive (primary surface is mobile browser, touch-first, large tap targets); must also work correctly in a desktop browser. No native app in v1.
NFR5 (Availability): No offline support in v1 — the app requires live connectivity to log or view data; a graceful "you're offline" state is expected rather than a hard error (exact behavior open — see PRD §8 Open Question 6).

### Additional Requirements

(No Architecture.md exists; these are drawn from the PRD's "Deployment & Development Standards" section, which the user asked to mirror two sibling personal projects — `image-hospital` and `the-chocolate-room`.)

- Backend implemented in Node.js (Express), consistent with both sibling projects.
- Hosted on the existing shared AWS EC2 instance as a new PM2-managed process (`pm2 start ... --name goat`), not a new instance.
- Nginx reverse-proxies the app; its config lives in-repo (`nginx/goat.conf`), is synced to `/etc/nginx/conf.d/` on every deploy, and validated with `nginx -t` before reload.
- The subdomain `goat.duckdns.org` is registered under the existing DuckDNS account and pointed at the shared EC2 instance's IP (44.192.81.22).
- TLS certificate obtained via Let's Encrypt using the DNS-01 challenge (certbot + DuckDNS plugin), matching `image-hospital`'s on-demand cert-issuance workflow.
- GitHub Actions `ci.yml` runs tests (and typecheck, if TypeScript is used) on push/PR to `main`.
- GitHub Actions `deploy.yml`, gated on CI success, SSHes into the EC2 instance (`appleboy/ssh-action`) and runs an in-repo `deploy.sh`: pull latest code, install deps, build if needed, restart the PM2 process, re-sync Nginx config, reload Nginx after `nginx -t` passes. Auto-deploys on every push to `main`.
- Documentation trio: `PRD.md` + `ARCHITECTURE.md` + `CLAUDE.md` (agent instructions, including "run tests before and after any change"), matching both sibling projects.
- Google OAuth client must be registered (Google Cloud Console) with Sheets API + Drive file-scope enabled before FR8 can be implemented.

### UX Design Requirements

None — no UX design document exists for this project. UI direction is captured directly in the PRD's "Aesthetic and Tone," "Platform," and "Information Architecture" sections (see NFR4) and is used as-is by story authors; a dedicated UX spec was judged unnecessary for a single-user hobby-scale app.

### FR Coverage Map

FR1: Epic 2 - Create Goal
FR2: Epic 2 - View Goals List
FR3: Epic 2 - Archive/Delete Goal
FR4: Epic 3 - Log Today's Entry
FR5: Epic 4 - View Progress Summary
FR6: Epic 4 - Streak Break Detection
FR7: Epic 4 - Goal Detail View
FR8: Epic 1 - Sign In With Google
FR9: Epic 1 - Sheet as System of Record

NFR1-NFR5 are cross-cutting and are addressed as acceptance criteria within relevant stories across epics rather than as standalone epics.

## Epic List

### Epic 1: Google Account Connection & Data Home
User can sign in with their Google account and have a dedicated Google Sheet automatically set up (or selected) as the single home for all their goal data — the foundation every other epic writes to and reads from. Also carries initial project scaffolding and the deployment pipeline (Node/Express on the shared EC2 instance via PM2 + Nginx + DuckDNS + Let's Encrypt, GitHub Actions CI/CD) and Google Cloud OAuth client registration, since neither has standalone user value and both are prerequisites for everything else.
**FRs covered:** FR8, FR9

### Epic 2: Goal Management
User can define a new goal of any of the three types (Target, Aggregate, Streak), browse all goals on the Goals List page, and archive/delete a goal no longer tracked.
**FRs covered:** FR1, FR2, FR3

### Epic 3: Daily Logging
User can record today's progress across every active goal in one pass from the Today Section — the core daily ritual.
**FRs covered:** FR4

### Epic 4: Progress Visibility
User can see, at a glance and in detail, how each goal is trending: progress % / days remaining, streak length with break detection, overdue flags, and full per-goal entry history.
**FRs covered:** FR5, FR6, FR7

---

## Epic 1: Google Account Connection & Data Home

User can sign in with their Google account and have a dedicated Google Sheet automatically set up as the single home for all their goal data — the foundation every other epic writes to and reads from. Also carries initial project scaffolding and the deployment pipeline.

### Story 1.1: Project Scaffolding & Deployment Pipeline

As the app's operator (Smc),
I want the Node/Express project scaffolded and wired to the shared EC2 deployment pipeline,
So that every subsequent story can be built, tested, and shipped to a live URL immediately.

**Acceptance Criteria:**

**Given** a fresh empty repository
**When** the initial scaffolding commit is made
**Then** a Node.js/Express server exists with a health-check endpoint (`GET /health` → 200)
**And** a GitHub Actions `ci.yml` runs the test suite on push/PR to `main`
**And** a GitHub Actions `deploy.yml`, gated on CI success, SSHes into the shared EC2 instance and runs `deploy.sh`
**And** `deploy.sh` pulls latest code, installs deps, restarts the app under a new PM2 process (`goat`), syncs an in-repo Nginx config, validates with `nginx -t`, and reloads Nginx
**And** the app is reachable over HTTPS at `https://goat.duckdns.org` once the subdomain and cert are in place
**And** `PRD.md` + `ARCHITECTURE.md` + `CLAUDE.md` exist in the repo per the Deployment & Development Standards

### Story 1.2: Google Sign-In

As Smc,
I want to sign in with my Google account,
So that the app is authorized to act on my behalf.

**Acceptance Criteria:**

**Given** I open the app while signed out
**When** I tap "Sign in with Google"
**Then** I go through Google's OAuth consent flow scoped to Drive file-scope only (not full Drive access)
**And** on success I land on the Home screen, signed in
**Given** I'm already signed in on this browser
**When** I revisit later
**Then** I stay signed in without re-authenticating
**Given** my token is later revoked/expired
**When** I try to use the app
**Then** I'm prompted to sign in again rather than seeing a silent failure

### Story 1.3: Automatic Google Sheet Setup as Data Home

As Smc,
I want a dedicated Google Sheet automatically created the first time I sign in,
So that all my goal data has a single home I control.

**Acceptance Criteria:**

**Given** I sign in for the very first time
**When** sign-in completes
**Then** the app creates a new Google Sheet in my Drive dedicated to GOAT data
**And** the Sheet ID is persisted so future sessions reuse the same Sheet
**Given** I sign in on a later session
**When** sign-in completes
**Then** the app reuses the previously linked Sheet rather than creating a new one

### Story 1.4: Backend Holds Refresh Token & Batches Sheets API Calls

As Smc,
I want the backend to manage my Google OAuth token and talk to the Sheets API efficiently,
So that logging/viewing data stays fast and reliable without hitting rate limits.

**Acceptance Criteria:**

**Given** I've completed sign-in
**When** the backend calls the Sheets API on my behalf
**Then** it uses a server-side stored refresh token, not a browser-held token
**Given** multiple reads/writes are needed for one action
**When** the backend talks to the Sheets API
**Then** it batches calls (batchGet/batchUpdate) rather than per-cell requests
**Given** the Sheets API returns HTTP 429
**When** a request fails this way
**Then** the backend retries with exponential backoff rather than surfacing a hard failure
**And** no Goal/Entry data is persisted anywhere other than the linked Sheet — the backend's only user-related persisted state is the Sheet ID and OAuth refresh token (NFR3)

## Epic 2: Goal Management

User can define a new goal of any of the three types, browse all goals on the Goals List page, and archive/delete a goal no longer tracked.

### Story 2.1: View Goals List

As Smc,
I want to see all my goals as a list on the Goals List page,
So that I have one place to browse everything I'm tracking.

**Acceptance Criteria:**

**Given** I have zero goals
**When** I open the Goals List page
**Then** I see an empty state with a clear "add goal" entry point
**Given** I have one or more goals
**When** I open the Goals List page
**Then** every goal appears as a tappable link, regardless of type or progress state
**And** tapping a goal navigates to its Goal Detail View

### Story 2.2: Create a New Goal (Target, Aggregate, or Streak)

As Smc,
I want to create a goal of any of the three types,
So that I can start tracking progress toward it.

**Acceptance Criteria:**

**Given** I'm on the Goals List page
**When** I tap "add goal" and choose Target
**Then** I'm prompted for name, unit, starting value, target value, direction, and deadline
**Given** I choose Aggregate
**Then** I'm prompted for name, unit, target total, and deadline
**Given** I choose Streak
**Then** I'm prompted for name, with an optional deadline
**Given** I submit valid values for any type
**When** the goal is created
**Then** it's written to my Google Sheet and immediately appears in the Goals List, Today Section, and Progress Section without a page refresh
**And** Goal Type cannot be changed after creation

### Story 2.3: Archive/Delete Goal

As Smc,
I want to archive or delete a goal I no longer track,
So that my Goals List, Today Section, and Progress Section don't accumulate abandoned goals.

**Acceptance Criteria:**

**Given** I'm on a Goal's Detail View
**When** I choose to archive/delete it
**Then** it no longer appears in the Today Section or Progress Section
**Given** the goal was archived (not deleted)
**When** I check the underlying Sheet
**Then** its historical Entries are still present, not removed

## Epic 3: Daily Logging

User can record today's progress across every active goal in one pass from the Today Section — the core daily ritual.

### Story 3.1: Log Today's Entry

As Smc,
I want to log today's progress for any active goal from the Today Section,
So that tracking is a single quick daily action across all my goals.

**Acceptance Criteria:**

**Given** an active Target Goal
**When** I enter today's reading and submit
**Then** it's saved as today's Entry; resubmitting the same day overwrites with the latest value
**Given** an active Aggregate Goal
**When** I enter today's increment
**Then** it's added to the running total; resubmitting the same day sums another increment
**Given** an active Streak Goal
**When** I toggle success/fail for today
**Then** re-toggling the same day updates that day's flag in place, no duplicate day
**And** any saved Entry writes to the Google Sheet and the Progress Section reflects it immediately, round-trip under 2 seconds (NFR1)
**Given** a day has already passed
**When** I try to modify that day's Entry
**Then** the app does not allow it (v1 append-only)
**Given** no network connectivity
**When** I try to submit an entry
**Then** I see a clear "you're offline" message rather than a silent failure (NFR5)

## Epic 4: Progress Visibility

User can see, at a glance and in detail, how each goal is trending: progress % / days remaining, streak length with break detection, overdue flags, and full per-goal entry history.

### Story 4.1: View Progress Summary

As Smc,
I want to see a one-line progress status for each active goal in the Progress Section,
So that I know at a glance whether I'm on pace.

**Acceptance Criteria:**

**Given** an active Target Goal
**When** I view the Progress Section
**Then** I see Progress % (starting value to target value, based on latest reading) and days remaining until deadline
**Given** an active Aggregate Goal
**Then** I see running total vs. target total (e.g. "3,200 / 10,000 min") and days remaining
**Given** an active Streak Goal
**Then** I see the current Streak Length (e.g. "14-day streak")
**Given** a Target or Aggregate Goal whose deadline has passed without reaching target
**Then** it's visually flagged as overdue rather than hidden or silently removed

### Story 4.2: Streak Break Detection

As Smc,
I want my streak to reset automatically when I miss a day,
So that the streak length I see is always honest.

**Acceptance Criteria:**

**Given** a Streak Goal's last successful Entry was before yesterday
**When** I open the app
**Then** the Streak Length shown resets to 0, computed at render time
**Given** I explicitly log a "fail" for today
**When** the Entry is saved
**Then** the Streak Length resets to 0 immediately

### Story 4.3: Goal Detail View

As Smc,
I want to open a goal from the Goals List and see its full history,
So that I can review exactly how I've been progressing.

**Acceptance Criteria:**

**Given** I tap a goal on the Goals List Page
**When** the Goal Detail View loads
**Then** I see every logged Entry for that goal, most recent first
**And** I see the same status summary shown in the Progress Section for that single goal
