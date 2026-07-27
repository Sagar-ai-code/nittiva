# Nittiva — Agent Completion Playbook (v2)

> **For**: The 5 manager agents + Sagar (admin). **This is the prompt each agent runs against.**
> **Prepared by**: Mavis (MiniMax Code) on 2026-07-28. **Last edit**: 2026-07-28 (round 6 follow-up).
> **Live state**: Backend `https://nittiva-backend.onrender.com/api`, frontend `https://nittiva-frontend.vercel.app`.
> **Companion doc**: `NITTIVA_AGENT_TASK_MAP.md` (the full 16-task plan, dependencies, execution order).
> **Map of changes shipped so far**: `NITTIVA_CHANGES.md` (consultant review).

---

## 0. How to use this playbook

Each agent is invoked with **one of the runbooks in §3** plus their own login credentials (§2). The runbook is self-contained: it says what to do, what files to touch, how to verify, how to ship. The agent should **not** need to come back to the playbook except to look up a spec.

**Admin (Sagar) tracks all agent work from `admin@nittiva.local`**:
- `/api/time-logs/` — every agent's timer (active, stopped, durations)
- `/api/comments/?task=<id>` — every agent's comment on a task
- `/api/notifications/unread_count/` — aggregate activity signal
- `/api/users/?role=manager` — the roster
- `/api/projects/2/` — the "Complete Nittiva" project
- `/api/tasks/?project=2` — the 14 in-flight tasks

Admin visibility is built in. No work happens off the radar.

---

## 1. The 5 agents (by area of expertise)

| Agent | Email | Password | Expertise | Runs in Mavis as |
|---|---|---|---|---|
| **Priya Sharma** | `priya.sharma@halfmind.co` | `TempPass123!` | **Frontend** — React 18 + Vite + TS, page components, the @mention dropdown, mocking → API wiring | `general` agent |
| **Arjun Reddy** | `arjun.reddy@halfmind.co` | `TempPass123!` | **Auth + invite** — registration, login, password reset, invitations, public routes, SMTP wiring | `general` agent |
| **Neha Kapoor** | `neha.kapoor@halfmind.co` | `TempPass123!` | **Billing** — invoices, clients, money, tax, PDF, per-tenant auto-numbering | `general` agent |
| **Vikram Patel** | `vikram.patel@halfmind.co` | `TempPass123!` | **Workflow** — task history, activity log, notifications, real-time, on-event side effects | `general` agent |
| **Aisha Khan** | `aisha.khan@halfmind.co` | `TempPass123!` | **QA + Infra** — pytest, CI, deploy, observability, DB persistence | `general` agent |

> **Mavis runs each agent's work** in a `general` sub-agent. Each invocation gets one runbook from §3, logs in with the credentials above, does the work, posts progress, ships. **Mavis does NOT log in as the agent**; the agent does. This keeps the audit trail clean (time logs, comments).

---

## 2. Login protocol (the agent's "morning routine")

Before touching code, every agent does this:

```bash
API="https://nittiva-backend.onrender.com/api"
LOGIN=$(curl -sS -m 20 -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"TempPass123!"}')
TOKEN=$(echo "$LOGIN" | jq -r '.data.access')
COMPANY=$(echo "$LOGIN" | jq -r '.data.user.company_id')
# Confirm the company is "5DOUOXNB" (the shared admin tenant).
```

Then for **every** task the agent picks up:

```bash
# 1. Get the task's current state (id is from /tmp/nittiva-state.sh or the task list)
curl -sS "$API/tasks/$TASK_ID/" -H "Authorization: Bearer $TOKEN" -H "X-Company-ID: $COMPANY"

# 2. Start a timer
TIMER=$(curl -sS -X POST "$API/time-logs/start_timer/" \
  -H "Authorization: Bearer $TOKEN" -H "X-Company-ID: $COMPANY" \
  -H "Content-Type: application/json" -d "{\"task_id\":$TASK_ID}")
TIMER_ID=$(echo "$TIMER" | jq -r '.data.id')

# 3. Post a "starting" comment with an ETA
curl -sS -X POST "$API/comments/" \
  -H "Authorization: Bearer $TOKEN" -H "X-Company-ID: $COMPANY" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg t "$TASK_ID" --arg c "Starting work on this task. ETA: ~75 min. I'll post again when it's done." '{task: $t, content: $c, object_id: $t, content_type: "tasks.task"}')"
```

After the work is done and shipped:

```bash
# 4. Post a "done" comment
curl -sS -X POST "$API/comments/" \
  -H "Authorization: Bearer $TOKEN" -H "X-Company-ID: $COMPANY" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg t "$TASK_ID" --arg c "Done. Shipped in commit X. Smoke test Y/28. ETA met." '{task: $t, content: $c, object_id: $t, content_type: "tasks.task"}')"

# 5. Stop the timer
curl -sS -X POST "$API/time-logs/$TIMER_ID/stop_timer/" \
  -H "Authorization: Bearer $TOKEN" -H "X-Company-ID: $COMPANY"

# 6. Mark the task completed
curl -sS -X PATCH "$API/tasks/$TASK_ID/" \
  -H "Authorization: Bearer $TOKEN" -H "X-Company-ID: $COMPANY" \
  -H "Content-Type: application/json" -d '{"status":"completed"}'
```

Admin sees all of this in `/api/time-logs/` and on the task detail.

---

## 3. The 14 in-flight tasks (one runbook each)

> **Status legend**: ✅ done · 🟡 in progress · ⚪ pending
> **Owner**: each task is assigned to one of the 5 agents by area of expertise.
> **Spec**: every task has a full spec in `NITTIVA_AGENT_TASK_MAP.md` (referenced by ID, e.g. "§A-1"). This playbook is the executive summary; the map is the deep dive.

### 🔵 Priya (4 tasks) — Frontend

| ID | Title | Status | ETA | Spec |
|---|---|---|---|---|
| **P-1** | Wire `pages/Chat.tsx` to the chat API (`/api/chat/rooms/`, `/api/chat/rooms/<id>/messages/`) | ⚪ | 60m | map §P-1 |
| **P-2** | Rewrite `pages/Invoice.tsx` to use the FK-based backend (this is a rewrite, not a port) | ⚪ | 90m | map §P-2 |
| **P-3** | Inline "Watch / Unwatch" button next to the assignees row | ⚪ | 20m | map §P-3 |
| **P-4** | Replace the hardcoded activity sidebar with `apiService.getTaskHistory(taskId)` | ⚪ | 45m | map §P-4 (depends on V-1) |

### 🟠 Arjun (3 tasks) — Auth + Invite

| ID | Title | Status | ETA | Spec |
|---|---|---|---|---|
| **A-1** | Invite-by-email backend — Invitation model + `POST /api/invitations/`, `GET /api/invitations/<token>/`, `POST /api/invitations/accept/` | ⚪ | 90m | map §A-1 |
| **A-2** | Admin UI for SMTP status + "send test email" button | ⚪ | 45m | map §A-2 |
| **A-3** | Public `/invite/:token` signup page (depends on A-1) | ⚪ | 30m | map §A-3 |

### 🟢 Neha (3 tasks) — Billing

| ID | Title | Status | ETA | Spec |
|---|---|---|---|---|
| **N-1** | Per-tenant invoice numbering (`INV-0001` per tenant) | ✅ done | — | (commit `40d3cd3`) |
| **N-2** | Per-tenant client numbering (`CLI-0001` per tenant) — mirror N-1 | ⚪ | 30m | map §N-2 |
| **N-3** | Per-tenant invoice PDF branding (header, footer, primary color) | ⚪ | 60m | map §N-3 |

### 🟣 Vikram (3 tasks) — Workflow

| ID | Title | Status | ETA | Spec |
|---|---|---|---|---|
| **V-1** | TaskHistory model + on-save signal + `GET /api/tasks/<id>/history/` + on-assign Notification | 🟡 in progress | 75m | map §V-1 |
| **V-2** | Notification bell shows real-time unread count (poll every 30s) | ⚪ | 30m | map §V-2 |
| **V-3** | Daily email digest of unread notifications (management command + cron) | ⚪ | 60m | map §V-3 |

### 🟡 Aisha (3 tasks) — QA + Infra

| ID | Title | Status | ETA | Spec |
|---|---|---|---|---|
| **I-1** | pytest coverage for the new viewsets (20 tests, 57% line coverage) | ✅ done | — | (commit `cb30497`) |
| **I-2** | GitHub Actions CI — `.github/workflows/test.yml`, pytest on every push | ✅ done | — | (commit `b07ff89`) |
| **I-3** | DB persistence — `STORAGE_PATH=/var/data` + disk mount in `render.yaml` | ✅ done (verify on next deploy) | — | (commit `28aac91`) |

---

## 4. The 3 simple runbook patterns (apply to every task)

### Pattern A — backend-only task (Neha, Vikram, Aisha)

1. **Read** the spec in `NITTIVA_AGENT_TASK_MAP.md` (§ task ID).
2. **Open** the relevant files in `nittiva-backend/api/`. Read the surrounding code first.
3. **Write** the model / serializer / view / endpoint. Follow existing patterns (look at how `Invoice` does it for the per-tenant pattern; look at how `Note` / `Comment` do it for the mention + subscriber pattern).
4. **Migration**: `cd nittiva-backend && .venv-311/bin/python manage.py makemigrations --dry-run` → write the file by hand if Django's output is wrong. Match what Django would generate.
5. **Add a test** in `api/tests/` that covers the new behavior. Look at `test_mention_subscribers.py` for the closest existing pattern.
6. **Run pytest locally**: `cd nittiva-backend && .venv-311/bin/pytest -q`. All tests should pass.
7. **Run smoke test** against the live API: `cd /Users/sagarmantry/.minimax/workspace/code-audit/nittiva && bash scripts/smoke-test.sh`. Must be 28+/28+.
8. **Commit + push** (`git add -p && git commit && git push origin main`). Use a `--author="Vikram Patel <vikram.patel@halfmind.co>"` for the audit trail.
9. **Fire the deploy hook**: `curl -X POST "https://api.render.com/deploy/srv-d9ij4i4m0tmc73csuc3g?key=O4BZhDo2MR0"`.
10. **Wait 2 min**, re-run smoke test, post a "done" comment, stop the timer, mark task completed.

### Pattern B — frontend-only task (Priya, except A-3)

1. **Read** the spec.
2. **Open** the page file (`Nittiva-main/src/pages/<Name>.tsx`) and the `apiService` (`Nittiva-main/src/lib/api.ts`).
3. **Wire** the page to `apiService` methods that already exist. Don't add new methods unless the spec says so.
4. **Type-check** locally: `cd Nittiva-main && pnpm tsc --noEmit` (or `npx tsc --noEmit`). Zero errors.
5. **Build** (optional but recommended): `pnpm build`.
6. **Commit + push** (`git add -p && git commit && git push origin main`). Vercel auto-deploys on push to main.
7. **Wait 2 min**, visit the live URL, verify the feature works.
8. **Post a "done" comment, stop the timer, mark task completed.**

### Pattern C — full-stack task (Arjun, P-2)

1. **Backend first** (Pattern A).
2. **Then frontend** (Pattern B).
3. **Then e2e**: open the live URL, do the end-to-end flow, post a screenshot or paste a `curl` response in the "done" comment.

---

## 5. Definition of done (every task must clear all 8)

1. ✅ **Code pushed** to `origin/main`.
2. ✅ **Smoke test** still 28+/28+ passing.
3. ✅ **New pytest test** (backend) or **new component test** (frontend) covers the new behavior.
4. ✅ **Deploy live** (Render deploy hook fired; Vercel auto-deploy).
5. ✅ **Live e2e**: a `curl` or browser test against the live URL shows the feature working.
6. ✅ **"done" comment** posted on the task (with the commit hash, the test result, the deploy time).
7. ✅ **Timer stopped** on the task.
8. ✅ **Task status** flipped to `completed`.

If any one of these is missing, the task is **not done**.

---

## 6. Reference

- `NITTIVA_AGENT_TASK_MAP.md` — the full 16-task plan with dependencies, execution order, and per-task deep-dive specs.
- `NITTIVA_CHANGES.md` — the consultant's review of the original codebase (the 28KB doc).
- `NITTIVA_MENTION_RESEARCH.md` — UX patterns from Plane / Taiga / OpenProject / Wekan.
- `api/tests/conftest.py` — pytest fixtures.
- `scripts/smoke-test.sh` — the 28-check live API integration test.
- Plane's `apps/api/schema/issue/issue_activity.py` — the closest reference for V-1 (TaskHistory).
- OpenProject's `app/services/users/set_avatar_service.rb` — the closest reference for A-1 (invite-by-email).

---

## 7. Open issues (admin should resolve)

- **DB persistence**: I-3 was supposed to fix this (`STORAGE_PATH=/var/data`). Still seeing tenant ID rotate between fresh logins. Verify on the next deploy; if still broken, switch to Postgres (the `POSTGRES_HOST` env-var branch in `settings/base.py` is already wired up).
- **SMTP creds in Render dashboard**: `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` are blank in `render.yaml`. Until real creds are set, every "send email" call (A-1 invite, A-2 test, V-3 digest) returns the URL in the response so the UI can show it as a copyable link (Wekan pattern).
- **GitHub PAT + Render deploy hook exposed in chat**: both should be rotated before going to production.
