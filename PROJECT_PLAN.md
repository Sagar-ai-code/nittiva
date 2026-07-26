# Nittiva — Step-by-Step Completion Plan

> Created: 2026-07-26
> Status: Based on the current codebase audit
> Goal: Turn the existing Nittiva skeleton into a production-ready task-management app.

---

## 1. Current State Summary

### What is deployed and working today
| Component | URL / Detail | Status |
|-----------|--------------|--------|
| Django backend | https://nittiva-backend.onrender.com | Live on Render |
| Vite/React frontend | https://nittiva-frontend.vercel.app | Live on Vercel |
| Admin login | admin@nittiva.local / Admin@123 | Works |
| Backend API health | `/api/healthz`, `/api/readyz` | 200 |
| Backend login | `POST /api/auth/login` | 200 |
| CORS frontend → backend | `https://nittiva-frontend.vercel.app` → Render | Verified |

### Backend models that exist
`Tenant`, `User`, `Client`, `Project`, `ProjectMember`, `Task`, `TaskAssignment`, `Invitation`, `Goal`, `GoalLinkedEntity`, `Comment`, `Attachment`, `TimeLog`, `CustomField`, `Sprint`, `SprintMember`, `TaskStatus`, `TaskPriority`.

### Backend viewsets / endpoints that exist
`users`, `clients`, `projects`, `tasks`, `tenants`, `goals`, `comments`, `attachments`, `time-logs`, `custom-fields`, `sprints`, `task-statuses`, `task-priorities`, plus auth, password-reset, invitations, and dashboard statistics.

### Frontend pages that exist
Landing, Login, Register, EmailVerification, ForgotPassword, ResetPassword, AcceptInvitation, AdminLogin, Dashboard (Index), Projects, ProjectTasks, TaskBoard, TaskDetail, TimeTracking, Users, Clients, Meetings, Todos, Notes, Chat, Invoice, LeaveRequests, Notifications, TenantManagement, Timeline, Sprint, Progress, AgentTimeLogDetail, Statuses, Priorities.

---

## 2. Major Gaps & Placeholders

### Frontend-only / mock pages (no backend persistence yet)
- **Projects** (`src/pages/Projects.tsx`) — full placeholder (“Coming soon”)
- **Users** (`src/pages/Users.tsx`) — uses `UserContext` with hard-coded demo users, never calls the API
- **Clients** (`src/pages/Clients.tsx`) — appears to be local-state only
- **Notes, Todos, Meetings, LeaveRequests, Notifications, Chat, Invoice** — UI exists but backend models/endpoints do not
- **Tasks page** (`src/pages/Tasks.tsx`) and `TaskListDemo.tsx` — not wired into routing

### Backend gaps
- No backend models for `Note`, `Todo`, `Meeting`, `LeaveRequest`, `Notification`, `ChatMessage`, `Invoice`
- No `Tag` or `SupportTicket` models despite frontend API methods referencing them
- No root page at `/` on the backend (currently returns 404)
- Tenant resolution relies heavily on `X-Company-ID` header; subdomain routing is partial
- No email backend configured for password reset / invitations in production
- Google OAuth credentials not configured in production

### Architecture / wiring gaps
- `UserContext` is not connected to `apiService`
- `ProjectContext` and `TaskContext` are connected but error handling is minimal
- Many pages use local `useState` instead of shared contexts or API calls
- No centralized loading/error UI
- Type mismatches between frontend `User`/`Task` types and backend responses

### Deployment / ops gaps
- Render dashboard settings are manual (`render.yaml` is not auto-detected)
- Git remote contains a personal access token in the URL
- No CI/CD pipeline
- No production-grade PostgreSQL on Render (currently SQLite unless env vars are set)
- Frontend env var `VITE_API_BASE_URL` must be set in Vercel dashboard

---

## 3. Completion Roadmap

### Phase 1 — Foundation & Stability (do this first)

| # | Step | Files / Actions |
|---|------|-----------------|
| 1.1 | Fix repository hygiene | Remove PAT from git remote URL; use HTTPS or SSH; rotate token if exposed |
| 1.2 | Add environment templates | Create `nittiva-backend/.env.example` and `Nittiva-main/.env.example` |
| 1.3 | Document Render/Vercel env vars | List `SECRET_KEY`, `POSTGRES_*`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `VITE_API_BASE_URL` |
| 1.4 | Add backend root page | `nittiva_backend/urls.py` → add a `/` view returning `{"name":"Nittiva API","version":"1.0.0","status":"ok"}` |
| 1.5 | Harden production settings | `production.py`: enforce `DEBUG=False`, configure `ALLOWED_HOSTS`, set secure cookie flags |
| 1.6 | Add logging & Sentry | Add structured logging; optional Sentry integration for Render |
| 1.7 | Add a management command sanity check | `./manage.py check --deploy` and a custom `verify_setup` command |
| 1.8 | Configure a real email backend | For Render: Mailgun/SendGrid/Postmark; for dev: console backend |
| 1.9 | Set up PostgreSQL on Render | Create Render Postgres; update env vars; remove SQLite fallback in production |
| 1.10 | Add CI/CD basics | GitHub Actions workflow to run backend tests and build frontend on push |

### Phase 2 — Core Task/Project Loop

| # | Step | Files / Actions |
|---|------|-----------------|
| 2.1 | Replace Projects placeholder | Rewrite `src/pages/Projects.tsx`: list projects from `ProjectContext`, add create/edit/delete dialogs |
| 2.2 | Wire Users page to backend | Refactor `src/context/UserContext.tsx` to use `apiService.getUsers/createUser/updateUser/deleteUser`; update `src/pages/Users.tsx` |
| 2.3 | Complete Clients CRUD | Wire `src/pages/Clients.tsx` to `ClientViewSet` (`GET/POST/PATCH/DELETE /api/clients/`) |
| 2.4 | Stabilize Task board & detail | Polish `src/pages/TaskBoard.tsx`, `TaskDetail.tsx`, `ProjectTasks.tsx`; ensure `TaskContext.refresh(projectId)` is used |
| 2.5 | Attachments on tasks | Wire `AttachmentViewSet` into `TaskDetail.tsx` for upload / delete |
| 2.6 | Comments on tasks | Wire `CommentViewSet` into `TaskDetail.tsx` |
| 2.7 | Custom statuses & priorities | Finish `src/pages/Statuses.tsx` and `src/pages/Priorities.tsx`; connect to `/api/task-statuses/` and `/api/task-priorities/` |
| 2.8 | Goals | Connect `src/pages/Goal*` (if present) or add a Goals page; use `GoalViewSet` |
| 2.9 | Dashboard | Ensure `src/pages/Index.tsx` consumes `apiService.getDashboardStats()` |
| 2.10 | Type cleanup | Align `src/types/fieldTypes.ts` and `src/lib/api.ts` with actual backend response shapes |

### Phase 3 — Collaboration & Time Tracking

| # | Step | Files / Actions |
|---|------|-----------------|
| 3.1 | Invitations | Finish `AcceptInvitation.tsx`; ensure invite flow works end-to-end (`/api/projects/<id>/invite`, `/api/invitations/<token>`) |
| 3.2 | Time tracking | Wire `src/pages/TimeTracking.tsx` and `AgentTimeLogDetail.tsx` to `TimeLogViewSet` |
| 3.3 | Timer start/stop | Add UI buttons calling `POST /api/time-logs/start_timer/` and `POST /api/time-logs/<id>/stop_timer/` |
| 3.4 | Timesheet summary | Use `/api/time-logs/summary/` and `/api/time-logs/agents_summary/` |
| 3.5 | Leave Requests | Add backend model + serializer + viewset (`LeaveRequest`); build `src/pages/LeaveRequests.tsx` CRUD |
| 3.6 | Meetings | Add backend model + viewset (`Meeting`); wire `src/pages/Meetings.tsx` |
| 3.7 | Notifications | Add backend model + viewset (`Notification`) and a global notification bell; wire `src/pages/Notifications.tsx` |

### Phase 4 — Admin & Multi-tenant

| # | Step | Files / Actions |
|---|------|-----------------|
| 4.1 | Admin login flow | Fix `src/pages/admin/AdminLogin.tsx` and role-based redirect after login |
| 4.2 | Tenant management | Complete `src/pages/admin/TenantManagement.tsx`; connect to `TenantViewSet` |
| 4.3 | Subdomain routing | Decide final tenant strategy: subdomain (`acme.nittiva.com`) vs company ID header; update `TenantMiddleware` and frontend `config.ts` |
| 4.4 | Roles & permissions | Audit all backend views for `agent`/`manager` role checks; add a `Role` enum on frontend |
| 4.5 | Superuser bypass | Ensure superusers can access all tenants for support |

### Phase 5 — Nice-to-Have Modules

| # | Step | Files / Actions |
|---|------|-----------------|
| 5.1 | Notes | Add backend `Note` model/viewset; wire `src/pages/Notes.tsx` |
| 5.2 | Todos | Add backend `Todo` model/viewset; wire `src/pages/Todos.tsx` |
| 5.3 | Chat | Add backend `ChatMessage` model/viewset (or integrate a chat service); wire `src/pages/Chat.tsx` |
| 5.4 | Invoicing | Add backend `Invoice` model, line items, PDF generation; wire `src/pages/Invoice.tsx` |
| 5.5 | Sprints | Finish `src/pages/Sprint.tsx`; use sprint actions (`add_member`, `remove_member`, `add_tasks`, `burndown`, `statistics`) |
| 5.6 | Timeline / Progress | Wire `src/pages/Timeline.tsx` and `src/pages/Progress.tsx` to real task/sprint data |
| 5.7 | Tags & Tickets | Either implement `Tag`/`SupportTicket` backend or remove unused frontend API methods |

### Phase 6 — Polish & Production

| # | Step | Files / Actions |
|---|------|-----------------|
| 6.1 | Landing page | Build a real marketing landing at `src/pages/Landing.tsx` |
| 6.2 | Global UI state | Add loading skeletons, error boundaries, empty states, toast messages |
| 6.3 | Form validation | Standardize with Zod or React Hook Form on all create/edit dialogs |
| 6.4 | Testing | Add backend pytest/DRF tests; add frontend Vitest + React Testing Library smoke tests |
| 6.5 | SEO / meta | Add proper `<title>` and meta tags per route |
| 6.6 | Custom domain | Point `nittiva.com` / `api.nittiva.com` to Vercel/Render; update `CSRF_TRUSTED_ORIGINS` and `CORS_ALLOWED_ORIGINS` |
| 6.7 | Monitoring | Add uptime monitoring (e.g. UptimeRobot) and Render logs alerts |
| 6.8 | Backups | Enable Render Postgres automated backups |
| 6.9 | Documentation | Update `README.md` with accurate local setup, deployment, and env-var instructions |
| 6.10 | Security audit | Run `pip-audit`, `npm audit`, review CORS, disable `DEBUG`, rotate secrets |

---

## 4. Immediate Next Steps (Suggested Order)

1. **Fix the exposed git token** (security).  
2. **Add a backend root page** so `https://nittiva-backend.onrender.com` no longer looks broken.  
3. **Rewrite the Projects page** to use the existing `ProjectContext` / API.  
4. **Wire the Users page** to the real backend `UserViewSet`.  
5. **Decide on tenant strategy** (subdomain vs company ID) before building more admin features.  
6. **Choose one module from Phase 3** (e.g. Leave Requests or Notifications) and implement backend + frontend end-to-end as a pattern for the rest.

---

## 5. Definition of Done

- A user can register, log in, create a project, add members, create tasks, assign tasks, track time, and view a dashboard.
- All dashboard routes render real data from the backend.
- No page shows a hard-coded “Coming soon” or placeholder content.
- Backend has no 404 at root; admin panel, API docs, and frontend are reachable.
- Production uses PostgreSQL, secure env vars, and automated deployments.
