---
stepsCompleted: ["step-01", "step-02"]
inputDocuments: ["_bmad-output/planning-artifacts/prds/prd-smc-goal-tracker-2026-08-10/prd.md"]
---

# Goal Tracker - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Goal Tracker, decomposing the requirements from the PRD (draft) into implementable stories. No Architecture.md or UX design document exists yet for this project — by user decision, this breakdown proceeds from the PRD alone; the PRD's own "Deployment & Development Standards" section stands in for formal architecture decisions.

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
- Hosted on the existing shared AWS EC2 instance as a new PM2-managed process (`pm2 start ... --name goal-tracker`), not a new instance.
- Nginx reverse-proxies the app; its config lives in-repo (`nginx/goal-tracker.conf`), is synced to `/etc/nginx/conf.d/` on every deploy, and validated with `nginx -t` before reload.
- A new subdomain is registered under the existing DuckDNS account and pointed at the shared EC2 instance's IP.
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
