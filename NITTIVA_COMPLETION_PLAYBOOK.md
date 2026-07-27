# Nittiva — Completion Playbook

> **For**: The 5 agents (Priya, Arjun, Neha, Vikram, Aisha) and Sagar.
> **Prepared by**: Mavis (MiniMax Code agent) on 2026-07-28.
> **Live state**: Backend on `https://nittiva-backend.onrender.com/api`, frontend on `https://nittiva-frontend.vercel.app`.
> **This document** is the single source of truth for what each agent owns and how to ship it. The same content is also in the Nittiva project **"Complete Nittiva"** as one task per agent.

---

## 1. The team

Five manager-level agents are seeded in Nittiva with `User.role = "manager"` and added as members of the project **"Complete Nittiva"**. All have the same dummy password (`TempPass123!`) — rotate before sharing with anyone outside the team.

| # | Name | Email | Role | Owns |
|---|------|-------|------|------|
| 1 | Priya Sharma | `priya.sharma@halfmind.co` | Manager | Frontend — wire Chat.tsx and Invoice.tsx pages |
| 2 | Arjun Reddy  | `arjun.reddy@halfmind.co`  | Manager | Frontend — invite-by-email picker (OpenProject pattern) |
| 3 | Neha Kapoor  | `neha.kapoor@halfmind.co`  | Manager | Backend — per-tenant invoice numbering |
| 4 | Vikram Patel | `vikram.patel@halfmind.co` | Manager | Backend — TaskHistory / activity log + on-assign notifications |
| 5 | Aisha Khan   | `aisha.khan@halfmind.co`   | Manager | QA — pytest test coverage for the new viewsets |

Login: `https://nittiva-frontend.vercel.app` → any of the emails above → password `TempPass123!`.

---

## 2. Repo conventions (read this first)

- **Backend**: `nittiva-backend/api/` — Django 5.0.6 + DRF, multi-tenant via `X-Company-ID` (or `X-Tenant-Subdomain`) header, JWT auth.
- **Frontend**: `Nittiva-main/src/` — React 18 + Vite + TypeScript. New pages go in `src/pages/`, reusable components in `src/components/`.
- **Migrations**: numbered (e.g. `0013_note_todo_meeting.py`). Hand-written is fine; run `python manage.py makemigrations --dry-run` and match what Django would generate. The cosmetic diffs matter less than functional equivalence.
- **Smoke test**: `scripts/smoke-test.sh` — runs 28+ checks against the live API. Run it after every deploy. **Never** declare a round done if the smoke test regresses.
- **Naming**:
  - Backend model: `PascalCase` (e.g. `NoteMention`)
  - Backend file: `snake_case.py` (e.g. `api/models/note.py`)
  - Frontend component: `PascalCase.tsx` (e.g. `MentionInput.tsx`)
  - Frontend type: `PascalCase` (e.g. `MentionUser`)
- **Don't**: edit `.env.example` with real credentials. Use `getpass` / env vars / Render dashboard. (Round 1 already scrubbed a leaked SMTP password — don't reintroduce that pattern.)
- **TypeScript types must match backend response shapes**: `Note/Comment/TaskSubscriber` IDs are UUIDs (`id: string`); `User` ID is a bigint (`id: number`). Keep these in sync — see `Nittiva-main/src/lib/api.ts`.

---

## 3. Per-agent step-by-step

Each task is in the **Complete Nittiva** project. The full description is in the task body in Nittiva; this section is the executive summary + key file paths.

### 3.1 Priya Sharma — Wire Chat.tsx and Invoice.tsx (2 tasks)

**Task #3 — Wire `Chat.tsx` to the backend API**

- **What exists**: `api/views/chat.py` with `ChatRoomViewSet` + `ChatMessageViewSet`; `apiService.getChatRooms / getChatMessages / sendChatMessage / markChatRoomRead` already declared.
- **What's missing**: `Nittiva-main/src/pages/Chat.tsx` still uses a local `mockData` array.
- **Steps**:
  1. Read `pages/Chat.tsx` and the API at `/api/chat/rooms/` (and `/api/chat/rooms/<id>/messages/`).
  2. Swap `mockData` for a `useEffect` + `useState` pattern: load rooms on mount, load messages when a room is selected.
  3. `handleSendMessage` → `apiService.sendChatMessage(roomId, content)` then refresh.
  4. "Create room" dialog → `apiService.createChatRoom({ name, participant_ids, is_group })`.
  5. `apiService.markChatRoomRead(roomId)` when opening a room.
  6. Show the `unread_count` badge (already in the API response) on each room.
- **Acceptance**: Two users, two browsers, send a message back and forth, unread count clears on open.

**Task #4 — Wire `Invoice.tsx` to the backend API (this is a rewrite, not a port)**

- **Why it's hard**: the current page (1631 lines) uses a flat-field model (`clientName`, `clientEmail`, etc.) that doesn't map to the backend's FK-based model. You need a proper rewrite, not a port.
- **What exists**: `api/views/invoice.py` with `InvoiceViewSet` (CRUD + `mark_paid` / `mark_sent` / `pdf`); `apiService.{getInvoices, createInvoice, updateInvoice, deleteInvoice, markInvoicePaid, markInvoiceSent, downloadInvoicePdf}`.
- **Steps**:
  1. Read `pages/Invoice.tsx` and `api/serializers/invoice.py` (the writable nested `line_items` shape).
  2. Use the Plane/Linear pattern: sidebar with status filters, main panel with the invoice detail.
  3. List: `useEffect` + `apiService.getInvoices({ status, client })` → table.
  4. Detail/edit: `useState` for draft, hydrate from `apiService.getInvoice(id)`.
  5. Save: `apiService.createInvoice({ client, line_items: [...] })` — server recomputes subtotal/tax/total; don't send them.
  6. PDF: `apiService.downloadInvoicePdf(id)` returns a Blob; render as `<a href={URL.createObjectURL(blob)} download="invoice-N.pdf">`.
  7. Mark paid/sent buttons call the corresponding methods.
- **Acceptance**: Create an invoice with 2 line items → server returns the recomputed total; mark paid/sent; download a real PDF.

### 3.2 Arjun Reddy — Invite-by-email from assignee picker

**Task #5 — OpenProject-style "Invite by email" from the TaskDetail assignee picker**

- **Why it matters**: today, adding a teammate to a project requires leaving the task, going to `/dashboard/users`, creating the user, and coming back. The OpenProject pattern lets you type an email directly in the assignee dropdown and send a one-time signup link. This is the killer UX of 2026.
- **Steps**:
  1. **Backend** — add `Invitation` model (`api/models/invitation.py`): `id`, `tenant_id`, `email`, `role`, `project` (optional FK), `token` (UUID, unique), `expires_at`, `accepted_at`, `invited_by`.
  2. **Backend** — `POST /api/invitations/` creates the Invitation and best-effort emails a link like `https://<frontend>/invite/<token>/`. If SMTP is unconfigured, return the URL in the response so the UI can show it as a copyable link (Wekan pattern).
  3. **Backend** — `GET /api/invitations/<token>/` returns the invitation payload (email, role, project name) — used by the public signup page.
  4. **Backend** — `POST /api/invitations/accept/<token>/` creates a User with the given email + a password the user supplies, marks invitation accepted, adds them to the project.
  5. **Frontend** — extend the assignee picker in `pages/TaskDetail.tsx`: when the user types a string that doesn't match any existing user, show an "Invite `<email>`" row that calls `apiService.createInvitation({ email, role: 'user' })`.
  6. **Frontend** — toast: "Invitation sent to `<email>`. They'll get a link to join." (or, if SMTP is down, show the copyable link).
  7. **Frontend** — public route at `/invite/<token>` (no auth) with email pre-filled and a password field.
- **Acceptance**: Type a fake email in the assignee picker → "Invite `<email>`" row appears; click it; open the link in incognito; signup; the new user is in the project and can be assigned.
- **Reference**: `NITTIVA_MENTION_RESEARCH.md` §3.

### 3.3 Neha Kapoor — Per-tenant invoice numbering

**Task #6 — `Invoice.invoice_number` unique per tenant + auto-increment**

- **Why**: today two tenants can't both have `INV-0001` because the column is a global `CharField`. Consultant flagged this in feedback #2.
- **Steps**:
  1. **Migration** `0018_invoice_per_tenant_unique.py`:
     - `migrations.AlterUniqueTogether(name='invoice', unique_together={('tenant_id', 'invoice_number')})` **or** `models.UniqueConstraint(fields=['tenant_id', 'invoice_number'], name='uniq_invoice_per_tenant')` + `migrations.AddConstraint(...)`.
  2. **Auto-increment** — override `Invoice.save()` (or use a `pre_save` signal) to set `invoice_number` to the next available value for the tenant if not provided:
     ```python
     prefix = "INV-"
     next_n = Invoice.objects.filter(tenant_id=tenant_id).count() + 1
     invoice_number = f"{prefix}{next_n:04d}"  # e.g. "INV-0001"
     ```
  3. **API** — make sure `InvoiceSerializer` doesn't accept a custom `invoice_number` from the client; always auto-generate. (Today the serializer just stores what's sent.)
  4. **Backfill** — write a one-off data migration (or management command) that backfills `invoice_number` for any existing rows.
  5. **Test** — log in as two tenants, create an invoice in each → both have `INV-0001` (no collision).
- **Reference**: consultant feedback #2 in `NITTIVA_CHANGES.md` §Known issues.

### 3.4 Vikram Patel — TaskHistory / activity log + on-assign notifications

**Task #7 — Every change to a Task writes a history row; assignee changes fire a notification**

- **Why**: the "Activity" sidebar in `TaskDetail` is currently hardcoded mock data ("Sagar Mantry created this task"). Plane and Linear both have rich activity feeds. This is the difference between "tracker" and "real product".
- **Steps**:
  1. **Backend model** — add `TaskHistory` in `api/models/task.py`: `id` (UUID), `tenant_id`, `task` (FK), `actor` (FK to User), `verb` (e.g. `created` / `updated` / `assigned` / `status_changed`), `diff` (JSONField like `{"status": ["to-do", "in-progress"]}`), `created_at`.
  2. **Backend view** — extend `TaskViewSet.perform_update` to detect changes and write a history row:
     - On any change: write a row with the diff
     - On assignee change: also call `Notification.objects.create(recipient=new_assignee, type='info', title='You were assigned to <task name>', link=f'/dashboard/tasks/<id>')`
  3. **Backend view** — `GET /api/tasks/<id>/history/` returns the rows.
  4. **Frontend** — `apiService.getTaskHistory(taskId)`.
  5. **Frontend** — replace the hardcoded mock activity list in `TaskDetail.tsx` with a `useEffect` that loads history; render each row as "<actor> changed <field> from X to Y" or "<actor> created this task".
  6. **Frontend** — the activity sidebar should poll every 30s OR use a websocket (out of scope for v1 — just polling).
- **Acceptance**: Change a task's status `to-do` → `in-progress` → `completed` → reload → see 3 history rows. Add an assignee → assignee gets a Notification row, sees it in the bell icon.
- **Reference**: Plane's `apps/api/schema/issue/issue_activity.py` (cloned at `~/.minimax/workspace/research/plane`).

### 3.5 Aisha Khan — pytest test coverage

**Task #8 — Add minimal happy-path tests for each new viewset**

- **Why**: zero tests exist today. The Round 6 e2e rollout found 3 bugs (object_id type mismatch, TaskSubscriberSerializer dropping user kwarg, maybe_subscribe not threading tenant_id) that the GET-only smoke test would have missed. Tests are the safety net.
- **Steps**:
  1. **Setup** — add `pytest`, `pytest-django`, `pytest-cov` to `requirements.txt`. Create `pytest.ini` and `conftest.py` with a fixture that:
     - Creates a `Tenant` + `User` with superuser flag
     - Sets `request.tenant` and `request.tenant_id` via the middleware
     - Returns a DRF `APIClient` with the token
  2. **Smoke test** — for each new viewset, write one test that hits `GET /api/<viewset>/` and asserts a 200 with a non-empty list: `NoteViewSet`, `TodoViewSet`, `MeetingViewSet`, `LeaveRequestViewSet`, `NotificationViewSet`, `ChatRoomViewSet`, `InvoiceViewSet`, `TaskSubscriberViewSet`, `UserViewSet` (new search action).
  3. **CRUD test** — for each viewset, write one test that creates an instance, lists it, and deletes it. Verify the response shape matches what the frontend expects (UUIDs for `Note/Todo/Meeting/Comment/TaskSubscriber`; bigint for `User` id).
  4. **@mention test** — post a comment with `@<other_user.name>`, verify:
     - `CommentMention` row exists
     - `TaskSubscriber` rows include the author and the mentioned user
     - `Notification` row exists for the mentioned user (not the actor)
  5. **CI hook** — add a `.github/workflows/test.yml` that runs pytest on every push to `main`.
- **Acceptance**: `pytest -q` passes locally; coverage report shows the 8 new viewsets covered (target: 70% line coverage on the new files); the smoke test `scripts/smoke-test.sh` keeps passing.

---

## 4. After each task

1. Run `scripts/smoke-test.sh` — should still be 28/28+ green. New endpoints deserve a new check.
2. `git commit -m "<type>(<scope>): <what>"` — match the existing style (look at `git log --oneline` for examples). Examples: `feat(frontend): wire Chat.tsx to backend API`, `fix(backend): per-tenant invoice numbering`.
3. `git push origin main` — Vercel auto-deploys the frontend. For backend changes, fire the Render deploy hook:
   ```bash
   curl -X POST "https://api.render.com/deploy/srv-d9ij4i4m0tmc73csuc3g?key=O4BZhDo2MR0"
   ```
   (Rotate this key after Round 7 — it's exposed in chat history.)
4. Wait for the deploy to land (2-3 min) and re-run the smoke test.

---

## 5. After all 5 tasks are done

- Sagar walks through the consultant review (`NITTIVA_CHANGES.md`) and either signs off or flags new items.
- The 5 agents get rotated to a real auth flow (the current `TempPass123!` is throwaway).
- The 5 dummy emails get replaced with the actual team emails when the agency hires them.
- A new round of tasks can be seeded using the same pattern (project + agents + tasks).

---

## 6. Reference files

- `NITTIVA_AUDIT.md` — the original 6-issue audit
- `NITTIVA_CHANGES.md` — what's been changed so far (Rounds 1-6), with the consultant's open items
- `NITTIVA_MENTION_RESEARCH.md` — UX patterns from Plane / Taiga / OpenProject / Wekan, plus the invite-by-email design
- `scripts/smoke-test.sh` — the live-API integration test
- `~/.minimax/workspace/research/plane` — local clone of Plane (49K+ stars, the closest reference)
- Plane's `apps/web/core/hooks/editor/use-editor-mention.tsx` — the Tiptap mention picker (not used in v1 but useful for v2)
