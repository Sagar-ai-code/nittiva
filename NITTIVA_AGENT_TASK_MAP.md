# Nittiva — Agent Task Map (the whole project, decomposed)

> **For**: Sagar (admin), Priya, Arjun, Neha, Vikram, Aisha, and anyone picking this up after.
> **Prepared**: 2026-07-28 by Mavis (MiniMax Code).
> **Live state**: Backend on `https://nittiva-backend.onrender.com/api`, frontend on `https://nittiva-frontend.vercel.app`.

This is the **whole project map** — every open work item from the consultant
review (NITTIVA_CHANGES.md §Planned changes + the gaps surfaced during the
Round 6 e2e rollout) decomposed into tasks, each assigned to one of the
5 manager agents by **area of expertise**. Each task has a step-by-step
guide, ETA, acceptance criterion, and definition-of-done.

> **Tracking convention**: each task is created in the Nittiva
> "Complete Nittiva" project (id 2). When an agent starts a task, they
> log in with their own email, start a timer (`/api/time-logs/start_timer/`),
> post a "starting" comment on the task, do the work, push + deploy,
> verify, post a "done" comment, and stop the timer. Admin sees
> everything via `GET /api/time-logs/`.

---

## 1. The team (areas of expertise)

| Agent | Email | Role | Area of expertise | Stance |
|---|---|---|---|---|
| **Priya Sharma** | `priya.sharma@halfmind.co` | Manager | **Frontend lead** — React 18 + Vite + TypeScript, the page components, the UI, the @mention dropdown | "If it shows on a screen, I own it" |
| **Arjun Reddy**  | `arjun.reddy@halfmind.co`  | Manager | **Auth + invite lead** — registration, login, password reset, invitations, public routes, SMTP wiring | "If it lets a new person in, I own it" |
| **Neha Kapoor**  | `neha.kapoor@halfmind.co`  | Manager | **Billing lead** — Invoices, clients, money, tax, PDF | "If money touches it, I own it" |
| **Vikram Patel** | `vikram.patel@halfmind.co` | Manager | **Workflow lead** — activity log, task history, notifications, real-time | "If a thing happened, I'll show you" |
| **Aisha Khan**   | `aisha.khan@halfmind.co`   | Manager | **QA + Infra lead** — tests, CI, deploy, monitoring, observability | "If it runs in production, I own it" |

---

## 2. The task map (16 tasks, in execution order)

Tasks are grouped by the agent who owns them, ordered within each group
by recommended execution sequence (smallest / highest-value first).

### 🔵 Priya Sharma — Frontend (4 tasks)

#### P-1 · Wire `Chat.tsx` page to backend API  · *done in spirit, not committed*
- **What exists**: `apiService.getChatRooms / getChatMessages / sendChatMessage / markChatRoomRead / createChatRoom`. `ChatRoomViewSet` + `ChatMessageViewSet` on the backend.
- **What's missing**: `pages/Chat.tsx` still uses a local `mockData` array.
- **Steps**:
  1. Read `pages/Chat.tsx` and the API at `/api/chat/rooms/` (and `/api/chat/rooms/<id>/messages/`).
  2. Swap `mockData` for `useEffect` + `useState`: rooms on mount, messages on selection.
  3. `handleSendMessage` → `apiService.sendChatMessage(roomId, content)` then refresh.
  4. "Create room" dialog → `apiService.createChatRoom({ name, participant_ids, is_group })`.
  5. `apiService.markChatRoomRead(roomId)` when opening a room.
  6. Render the `unread_count` badge on each room (already in API response).
- **ETA**: 60 min
- **Acceptance**: 2 users, 2 browsers, message back and forth, unread clears on open.
- **Definition of done**: smoke test still 28/28, manual two-browser test passes, the page reads from the API (no `mockData`).

#### P-2 · Wire `Invoice.tsx` page to backend API (rewrite, not a port)  · *high value*
- **What exists**: 1631-line page using flat-field model (`clientName`, `clientEmail`, etc.) that doesn't map to the FK-based backend.
- **What's missing**: a proper backend-driven rewrite.
- **Steps**:
  1. Read `pages/Invoice.tsx` and `api/serializers/invoice.py` (the writable nested `line_items` shape).
  2. Use the Plane/Linear pattern: sidebar with status filters, main panel with the invoice detail.
  3. List: `useEffect` + `apiService.getInvoices({ status, client })` → table.
  4. Detail/edit: `useState` for draft, hydrate from `apiService.getInvoice(id)`.
  5. Save: `apiService.createInvoice({ client, line_items: [...] })` — server recomputes subtotal/tax/total; don't send them.
  6. PDF: `apiService.downloadInvoicePdf(id)` returns a Blob → `<a href={URL.createObjectURL(blob)} download="invoice-N.pdf">`.
  7. Mark paid/sent buttons call the corresponding methods.
- **ETA**: 90 min
- **Acceptance**: create invoice with 2 line items → server returns recomputed total; mark paid/sent; download a real PDF.
- **DoD**: smoke test still 28/28, manual test creates + downloads a PDF.

#### P-3 · Frontend `assignee` picker shows the Watchers badge
- **What exists**: `TaskDetail.tsx` already has a Watchers sidebar (added in Round 6).
- **What's missing**: a small "Watch" toggle inline next to the assignees (so a user can watch a task they're not assigned to).
- **Steps**:
  1. In the `Assignees` row of `TaskDetail.tsx`, add a small "Watch" / "Unwatch" button (only visible to the current user if they're NOT already an assignee).
  2. Wire to `apiService.subscribeToTask(taskId)` / `unsubscribeFromTask(subscriberId)`.
  3. Show a toast on success.
- **ETA**: 20 min
- **Acceptance**: open any task, click "Watch" → user appears in the Watchers list. Click again → removed.
- **DoD**: one smoke check, manual test on the live URL.

#### P-4 · Replace hardcoded "Activity" sidebar with real history
- **What exists**: the right sidebar in `TaskDetail.tsx` has hardcoded mock activity ("Sagar Mantry created this task").
- **What's missing**: a real activity feed (Vikram's `TaskHistory` work feeds this; see V-1).
- **Steps**:
  1. Add `apiService.getTaskHistory(taskId)` (returns Vikram's `TaskHistory` rows).
  2. Replace the hardcoded activity list in `TaskDetail.tsx` with a `useEffect` that loads the history.
  3. Render each row: "<actor> changed <field> from X to Y" or "<actor> created this task" (parse the `diff` JSON).
  4. Poll every 30s for v1 (websocket is a v2 thing).
- **ETA**: 45 min
- **Acceptance**: change a task's status, refresh the page, see a new history row in the sidebar.
- **DoD**: depends on V-1 (Vikram's TaskHistory), so execute **after V-1**.

---

### 🟠 Arjun Reddy — Auth + Invite (3 tasks)

#### A-1 · Invite-by-email from assignee picker (OpenProject pattern)  · *high value*
- **What exists**: assignee picker in `TaskDetail.tsx` shows only existing users.
- **What's missing**: an "Invite `<email>`" row that creates an Invitation + emails a signup link.
- **Steps**:
  1. Add `Invitation` model in `api/models/invitation.py`: `id` (UUID), `tenant_id`, `email`, `role`, `project` (optional FK), `token` (UUID, unique), `expires_at`, `accepted_at`, `invited_by`.
  2. `POST /api/invitations/` creates the Invitation + best-effort emails a link like `https://<frontend>/invite/<token>/`. If SMTP is unconfigured, return the URL in the response so the UI can show it as a copyable link (Wekan pattern).
  3. `GET /api/invitations/<token>/` returns the payload (used by the public signup page).
  4. `POST /api/invitations/accept/<token>/` creates a User with the given email + a password the user supplies, marks accepted, adds them to the project.
  5. Extend the assignee picker: when the user types a string that doesn't match any existing user, show an "Invite `<email>`" row that calls `apiService.createInvitation({ email, role: 'user' })`.
  6. Toast: "Invitation sent to `<email>`. They'll get a link to join." (or, if SMTP is down, show the copyable link).
  7. Public route at `/invite/<token>` (no auth) with email pre-filled and a password field.
- **ETA**: 90 min
- **Acceptance**: type a fake email in the assignee picker → "Invite `<email>`" row appears; click it; open the link in incognito; signup; new user is in the project.
- **DoD**: e2e test in P-1 / a manual end-to-end test.

#### A-2 · Fix the SMTP path: add `SMTP settings` UI + status indicator
- **What exists**: `production.py` already configures SMTP if env vars are set (Round 2).
- **What's missing**: a UI to check whether SMTP is configured + a "send test email" button (admin only).
- **Steps**:
  1. `GET /api/system/email_status/` returns `{configured: bool, backend: str, host: str}` (admin only).
  2. `POST /api/system/email_status/test/` sends a test email to the current admin (admin only).
  3. Add a small admin panel: `pages/admin/EmailSettings.tsx` (or extend the existing admin/).
  4. Show the result inline.
- **ETA**: 45 min
- **Acceptance**: admin opens the page, sees the SMTP status, can click "send test" and receives the email (or sees a copyable URL if SMTP not configured).
- **DoD**: smoke test, manual test of the UI.

#### A-3 · Public signup page at `/invite/<token>` (frontend)
- **What exists**: backend endpoints (A-1).
- **What's missing**: a public React route that displays the invitation and lets the user set a password.
- **Steps**:
  1. Add a public route to the frontend router: `/invite/:token`.
  2. On mount, call `apiService.getInvitation(token)` → display the email + project name.
  3. Form fields: password, confirm password. On submit, call `apiService.acceptInvitation(token, { password })` → redirect to login.
- **ETA**: 30 min
- **Acceptance**: visit `/invite/<valid_token>` → see the form. Submit → redirected to login.
- **DoD**: depends on A-1.

---

### 🟢 Neha Kapoor — Billing (3 tasks)

#### N-1 · Per-tenant invoice numbering  · *done this round*
- **What exists**: per-tenant uniqueness, auto-increment (Neha shipped this in commit `cb30497`'s parent).
- **What's missing**: nothing — task is **completed**.

#### N-2 · Per-tenant client numbering
- **What exists**: `Client` model has `name` + `email` (no `client_number`).
- **What's missing**: a per-tenant auto-incremented `client_number` (e.g., `CLI-0001`), shown in the client list + invoice list.
- **Steps**:
  1. Migration: add `client_number = CharField(max_length=50, blank=True, default="")` to `Client`. Add `UniqueConstraint(tenant_id, client_number)`.
  2. Override `Client.save()` to auto-generate `CLI-0001`, `CLI-0002`, etc. (mirror N-1).
  3. Add `client_number` to `ClientSerializer` as read-only.
  4. (Optional) add a "view invoices for this client" tab.
- **ETA**: 30 min
- **Acceptance**: two clients in the same tenant get sequential numbers; two tenants both get `CLI-0001`.
- **DoD**: smoke test still 28/28, manual e2e.

#### N-3 · Invoice PDF with per-tenant branding
- **What exists**: `InvoiceViewSet.pdf` action returns a generic PDF via reportlab (Round 5).
- **What's missing**: per-tenant branding — tenant's company name, address, logo (if uploaded), color.
- **Steps**:
  1. Extend `Tenant` model with optional `invoice_header_text`, `invoice_footer_text`, `primary_color`.
  2. Add these to the `TenantSerializer` (or a new `TenantBrandingSerializer`).
  3. Update the PDF action to use these settings (fall back to defaults if not set).
  4. Add a small admin UI to set the branding (or extend the existing `admin/TenantManagement.tsx`).
- **ETA**: 60 min
- **Acceptance**: two tenants produce visually distinct PDFs.
- **DoD**: smoke test + manual test (download a PDF from each tenant).

---

### 🟣 Vikram Patel — Workflow (3 tasks)

#### V-1 · TaskHistory / activity log  · *high value*
- **What exists**: hardcoded mock activity in `TaskDetail.tsx`.
- **What's missing**: a real `TaskHistory` model + signal that writes a row on every Task change.
- **Steps**:
  1. Add `TaskHistory` model in `api/models/task.py`: `id` (UUID), `tenant_id`, `task` (FK), `actor` (FK to User), `verb` (`created` / `updated` / `assigned` / `status_changed` / `priority_changed`), `diff` (JSONField like `{"status": ["to-do", "in-progress"]}`), `created_at`.
  2. Override `Task.save()` (or use a `pre_save` signal) to detect changes and write a history row. Detect changes by comparing the in-memory instance fields with the DB row.
  3. On `perform_create`: write a "created" row.
  4. `GET /api/tasks/<id>/history/` returns the rows.
  5. On assignee change: also create a `Notification` for the new assignee.
  6. Add `apiService.getTaskHistory(taskId)`.
  7. Update `TaskDetail.tsx` to show the real history (depends on P-4).
- **ETA**: 75 min
- **Acceptance**: change a task's status, refresh, see a history row in the API response. Add an assignee, they get a Notification.
- **DoD**: pytest test added (V-1 test), smoke test still 28/28.

#### V-2 · Notification bell shows real-time unread count
- **What exists**: `Notification` model + endpoints. `notifications/unread_count/` returns the count.
- **What's missing**: the bell icon in the header (`components/layout/Header.tsx`?) shows a static badge.
- **Steps**:
  1. Find the bell component (search for `Bell` in the codebase).
  2. Add a `useEffect` that calls `apiService.getNotificationUnreadCount()` on mount + every 30s.
  3. Display the count as a small badge. If 0, hide the badge.
  4. On click, navigate to `/dashboard/notifications` (already exists).
- **ETA**: 30 min
- **Acceptance**: as the admin, mark a notification as read → the badge updates within 30s.
- **DoD**: manual test.

#### V-3 · Email digest of unread notifications (daily)
- **What exists**: notifications are in-app only.
- **What's missing**: a daily email digest for users with > N unread notifications.
- **Steps**:
  1. Add a management command `send_notification_digest` that finds users with unread notifications and emails them a summary.
  2. Add a cron job (Render Cron Job or a simple scheduler) that runs the command daily at 9am in the user's local timezone (use the tenant's timezone).
  3. Use the same SMTP settings as A-2.
  4. Add an opt-out setting on the user (`User.notification_digest_enabled` boolean field).
- **ETA**: 60 min
- **Acceptance**: a user with 5+ unread notifications gets an email the next morning.
- **DoD**: smoke test (call the management command manually + verify the email).

---

### 🟡 Aisha Khan — QA + Infra (3 tasks)

#### I-1 · pytest coverage for the new viewsets  · *done this round*
- **What exists**: 20 tests, 57% coverage (Aisha shipped in commit `cb30497`).
- **What's missing**: nothing — task is **completed**.

#### I-2 · GitHub Actions CI: run pytest on every push
- **What exists**: pytest tests in `api/tests/`.
- **What's missing**: a CI pipeline that runs the tests on every PR + push to `main`.
- **Steps**:
  1. Add `.github/workflows/test.yml` that:
     - Spins up Python 3.11
     - Installs requirements
     - Runs `SECRET_KEY=test pytest -q` (or sets a real secret)
  2. Add a badge to `README.md`.
  3. (Optional) Block merges to `main` if tests fail.
- **ETA**: 30 min
- **Acceptance**: open a PR, see "All checks passed" badge.
- **DoD**: pipeline runs successfully on the next push.

#### I-3 · Fix the DB persistence bug (render.yaml disk mount)
- **What exists**: `render.yaml` mounts the disk at `/opt/render/project/src`, but the SQLite file lives in `/opt/render/project/src/nittiva-backend/db.sqlite3`. The mount looks correct, but data still resets between deploys.
- **What's missing**: a definitive answer to "why is data being wiped?".
- **Steps**:
  1. Reproduce locally: build the Docker image, run the `startCommand`, verify data persists across container restarts.
  2. Check Render's docs for the SQLite-on-disk pattern. Render's free plan might not persist disk across deploys (in which case the fix is to switch to Postgres).
  3. If Render does persist, add a `STORAGE_PATH` env var that the settings file uses, and update `render.yaml` to set it.
  4. If Render doesn't persist, the answer is "switch to Postgres" — set up a free Postgres on Render and update `DATABASES` in `settings/base.py` to use it.
- **ETA**: 90 min (could be longer if switching to Postgres is needed)
- **Acceptance**: the 5 agents and the projects/tasks survive a fresh deploy.
- **DoD**: deploy, redeploy, see the same data.

---

## 3. Execution order (the recommended sequence)

```
Round 1 (parallel-safe, ~30 min each, ship first):
  ├── I-2 · Aisha · GitHub Actions CI
  └── I-3 · Aisha · DB persistence fix

Round 2 (Vikram + Priya, ~75 min each, ship next):
  ├── V-1 · Vikram · TaskHistory + on-assign notification
  └── P-4 · Priya · Replace mock activity with real history (depends on V-1)

Round 3 (the big frontend rewrites, ~90 min each):
  ├── A-1 · Arjun · Invite-by-email backend
  ├── A-3 · Arjun · Public invite signup page (depends on A-1)
  ├── P-1 · Priya · Wire Chat.tsx
  └── P-2 · Priya · Wire Invoice.tsx (the big rewrite)

Round 4 (nice-to-haves, in any order):
  ├── N-2 · Neha · Per-tenant client numbering
  ├── N-3 · Neha · Per-tenant invoice PDF branding
  ├── V-2 · Vikram · Notification bell real-time count
  ├── V-3 · Vikram · Daily email digest
  ├── A-2 · Arjun · SMTP status admin UI
  └── P-3 · Priya · Watch button next to assignees
```

**Total**: 16 tasks, ~16-20 hours of work. Can be parallelized across the 5 agents (they don't share files except in obvious dependency pairs like V-1 → P-4).

---

## 4. The "definition of done" checklist (per task)

For every task, when you mark it done, the following must be true:

1. **Code pushed**: a `git push origin main` of clean commits (or one squashed commit)
2. **Smoke test**: `./scripts/smoke-test.sh` returns 28+ passed, 0 failed
3. **New test** (if backend): at least one pytest test in `api/tests/` covers the new behavior
4. **Deploy**: the Render deploy hook has been fired and the new code is live
5. **Live e2e**: a `curl` against the live API (or a manual browser test for frontend) shows the feature working
6. **Comment posted**: a "done" comment on the task in Nittiva, summarising what shipped
7. **Time stopped**: the timer on the task is stopped
8. **Task marked completed**: the task's `status` is `completed`

---

## 5. Cross-cutting items (not assigned to one agent)

These are infrastructure / cross-cutting. They block work for multiple agents and should be unblocked first.

- **DB persistence bug** (I-3): currently every deploy wipes the agents. Arjun and Priya lose their work in progress. Fix this first.
- **GitHub Actions CI** (I-2): once Aisha has this, every agent's PR gets a green/red signal automatically.
- **SMTP creds in Render dashboard**: the `EMAIL_HOST_USER` + `EMAIL_HOST_PASSWORD` env vars are blank in render.yaml. Until Sagar sets real creds in the Render dashboard, every "send email" call (A-1 invite, A-2 status, V-3 digest) returns the link as a copyable URL instead of sending. Not blocking, but the experience is degraded.

---

## 6. Reference

- `NITTIVA_CHANGES.md` — the consultant's findings
- `NITTIVA_MENTION_RESEARCH.md` — UX patterns from Plane / Taiga / OpenProject / Wekan
- `NITTIVA_COMPLETION_PLAYBOOK.md` — the original 6-task playbook (Neha + Aisha done; this doc supersedes it)
- `api/tests/conftest.py` — the pytest fixtures
- `scripts/smoke-test.sh` — the live-API integration test
- Plane's `apps/api/schema/issue/issue_activity.py` — the closest reference for V-1
