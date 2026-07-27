# Nittiva @Mention + Task-Assignment UX Research

A quick reference of patterns from open-source task trackers (Plane, Taiga,
OpenProject, Wekan) consulted while building the @mention / auto-subscribe
feature in Nittiva. Useful for the consultant review and for the next round
(per-tenant invoice numbering, plus the next obvious step: invite-by-email
from the assignee picker).

---

## 1. The "Assignment" UX pattern (general)

Most modern trackers (Plane, Linear, Jira, ClickUp, Asana) treat assignment
as a **distinct** concept from mention / watcher / reviewer / approver.

| Concept         | Responsibility                       | Gets notifications? | Appears in "My work"? |
|-----------------|--------------------------------------|---------------------|-----------------------|
| Assignee        | Owns the work, accountability        | Yes                 | Yes                   |
| Watcher         | Wants to be kept informed            | Yes                 | No                    |
| Reviewer        | Approves or reviews before next step | Yes                 | In a review queue     |
| Mention         | Highlighted for context, not owner   | Yes (one-shot)      | No                    |
| Reporter        | Filed the issue                      | Often yes           | Sometimes             |
| Collaborator    | Has access, can comment              | Configurable        | No                    |
| Permission role | Read / write / admin                 | N/A                 | N/A                   |

### What the good ones do

- **Self-assign / Reassign / Clear (unassigned state)**: every good one
  has a "Assign to me" shortcut, an X to clear, and a visible "Unassigned"
  state. Linear even greys out the unassigned list to make it obvious.
- **Eligibility filter**: when picking, only show users who are *members* of
  the tenant / project / team. Plane and OpenProject both pre-filter.
- **Single vs multiple**: state the limit in the UI ("Up to 3 assignees").
  Nittiva's `Task.assignees` M2M already supports multiple.
- **Activity log of assignment changes**: every tracker writes a row
  ("Sagar assigned to Alex"). Nittiva's `TaskHistory` doesn't yet — easy add.
- **Notification preview on assign**: Linear shows "Alex will be notified".
  Plane just shows the bell silently.

## 2. Plane (the closest reference)

Plane is the model we copied for the data model. Specific UX decisions worth
mirroring later:

- **IssueSubscriber** is a separate model from Assignee and from Mention.
  Auto-subscribe = the author of any note/comment, plus anyone mentioned.
  ✅ We did this in commit `6aa7a46`.
- **IssueMention** stores the (issue, mentioned_user) pair separately from
  IssueActivity. We matched it: `NoteMention`, `CommentMention`.
  ✅ Same shape.
- **Assignment changes write an IssueActivity row** ("assigned to Alex").
  We do not yet — TaskHistory could grow an `assignees_changed` event.
- **Plane's mention picker is a Tiptap extension** that searches users
  server-side. We picked plain text + a controlled `<textarea>` + dropdown
  for simplicity. Plane's Tiptap picker is at:
  `apps/web/core/hooks/editor/use-editor-mention.tsx` (cloned locally).

## 3. OpenProject: the "invite from assignee" pattern

This is the killer pattern for **user creation**:

- When you open the Assignee dropdown on a work package, the picker shows
  existing members *and* a "Invite `newperson@example.com`" row if the email
  isn't found.
- Picking that row sends an email with a one-time signup link.
- The invited user lands in the project, gets the chosen role, and is
  immediately the assignee.

**Why it matters for Nittiva:** instead of admins having to go to
`/dashboard/users` to create a user, an assignee picker that allows
"Invite by email" lets a project lead add a teammate inline while working
on a task. The `User.email` field already exists; the missing piece is:
- A "send invite" endpoint (creates a row with a token, emails a link)
- An `/invite/<token>/` public signup page (sets password, becomes active)
- An Invitation model (or reuse an existing token table)

This is the obvious next step after per-tenant invoice numbering. The
backend plumbing is ~150 lines (model + 1 view + email hook) and the
frontend is a single PickUser dropdown that grows an "Invite" row.

## 4. Taiga

- Invitations are accepted via a unique link in an email.
- Roles are project-scoped (not global) and include a default `Member` role
  + custom roles.
- Self-registration is toggleable per instance
  (`PUBLIC_REGISTER_ENABLED: "True"`).
- **Email is critical** for invite flows; Taiga's docs include a long
  section on SMTP/SSL/TLS port gotchas. Worth keeping in mind: our email
  backend in `production.py` is exactly the kind of config Taiga warns
  about (Gmail SMTP, port 465 SSL vs 587 TLS).

## 5. Wekan

- First registered user is admin. No "create your org" flow.
- Email is **not required** — Wekan explicitly says "WORKING EMAIL IS NOT
  REQUIRED. Wekan works without setting up email."
- That's a useful reminder: Nittiva's email is also currently best-effort
  (SMTP falls back to console). Invite flow should not require working
  email to exist; show the invite link in the UI as a copyable URL if SMTP
  fails.

## 6. What Nittiva did (this session)

- ✅ `NoteMention`, `CommentMention` — bridge tables, copy of Plane's pattern
- ✅ `TaskSubscriber` — bridge table for "who watches this task"
- ✅ `parse_mentions()` regex: `@<word>` (letters, digits, `.`, `-`, `+`, `_`, `@`)
- ✅ Resolution order: exact email → email-prefix → exact name
- ✅ Auto-subscribe on note/comment create: author + mentioned users
- ✅ In-app `Notification` row for each mention (skips the actor)
- ✅ `GET /api/users/search/?q=foo&limit=N` for the picker
- ✅ Frontend `apiService.searchUsers`, `getTaskSubscribers`,
  `subscribeToTask`, `unsubscribeFromTask`

## 7. What Nittiva still doesn't have

Listed in priority order so the consultant can push back on what matters:

1. **Invite-by-email from assignee picker** (OpenProject pattern, §3) — high
   value, blocks agency-grade onboarding.
2. **Assignment-change activity log entry** (Plane pattern, §2) — small, but
   makes the audit trail complete.
3. **Self-registration** for the public sign-up page — low value for
   B2B/agency tenants; only matters if Sagar wants a self-serve free tier.
4. **Tiptap rich-text editor** for notes/comments — Plane went this way for
   a reason (formatting + mentions + image embeds in one box). Current
   plain-text + dropdown is fine for v1.

## 8. References

- Plane repo: https://github.com/makeplane/plane (cloned locally at
  `~/.minimax/workspace/research/plane`)
- Taiga docs: https://docs.taiga.io
- OpenProject docs: https://www.openproject.org/docs/getting-started/invite-members/
- Wekan docs: https://github.com/wekan/wekan/blob/main/docs/Login/Adding-users.md
- UX Patterns Guide (Assignment): https://uxpatternsguide.com/patterns/assignment/
