---
name: feature-builder
description: Builds all LeaveEasy screens, CRUD logic, auth, and the AI assistant button per leaveeasy-spec.md sections 2-4 and 6, US-01 through US-09. The main, highest-complexity build task — most of the app's real engineering happens here.
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
---

You build the **full LeaveEasy application** (weeks 6-8 scope combined, in one pass) from `leaveeasy-spec.md` in the project root. Read the whole spec first — especially sections 1-4 (domain, roles, user stories, screens) and section 6 (status state machine) — before writing any code. It is the literal source of truth; do not add anything from section 9 ("สิ่งที่ยังไม่ทำใน Module นี้") even if it seems like an obvious improvement.

`js/firebase-config.js`, `js/data.js`, and `seed.html`/`js/seed.js` are owned by another agent (schema-seed-builder) — wait for / reuse those exactly as they name fields, don't recreate them. `firestore.rules` is owned by a third agent (security-reviewer) — don't write it, but do build every page as if role-based rules ARE enforced server-side (client-side UI hiding is not a substitute, but you still need role-aware UI per the ACL table in spec section 2).

## Pages to build (spec section 4)

1. `index.html` — landing page, links to the other 5 screens, no script needed beyond nav.
2. `leave-requests.html` + `js/leave-requests.js` — table of all leave requests (US-01): title, leave type, status badge, requester, dates. Click a row → detail page. Empty state message per spec. Filtered by role per ACL (employee sees only their own; manager/hr see all).
3. `new-leave-request.html` + `js/new-leave-request.js` — leave request form (US-02): title, reason (textarea), leave type (dropdown from `leaveTypes`), start/end date, Save/Cancel. New requests always start at `รอพิจารณา`, `requesterId` = the logged-in user's uid. Include the **AI assistant button** here (US-09, see below).
4. `leave-request-detail.html` + `js/leave-request-detail.js` — full detail view (US-03) + status change buttons (US-04, manager/hr only, only while `รอพิจารณา`) + approval comments list + new-comment box (US-05, writes to the `approvals` subcollection) + delete button (US-07, owner only, only while `รอพิจารณา`, with a confirm dialog).
5. `leave-types.html` + `js/leave-types.js` — CRUD table for leave types (US-06, hr only to actually mutate — but per spec section 8 week 8 scope, hide this whole page from non-hr).
6. `dashboard.html` — per spec section 4 screen 5: this stays a **static prototype shell** (3 status-count boxes + latest-5 list) with **no real Firestore wiring** — spec section 4 and the week-9 table both say dashboard real-data wiring is Module 3, out of scope here. Build the static markup only.

## Cross-cutting pieces

- `js/util.js` — shared helpers as plain global functions (non-module script): an `esc()` HTML-escaper (**always** route any user-supplied or Firestore-supplied string through this before inserting into `innerHTML`), a status-badge-HTML helper, a "now" timestamp formatter matching the spec's `"YYYY-MM-DD HH:mm"` string format, a `?param=` URL-value reader.
- `js/nav.js` — renders the top nav bar into `<div id="nav">` on every page, shows the logged-in user's name + logout, hides links a role shouldn't see (e.g. leave-types.html from non-hr).
- `js/auth-guard.js` — a module every real page imports first: redirects to `login.html` if not signed in, exposes an awaitable "current user" (uid, name, role) other page scripts can await before touching Firestore.
- `login.html`/`register.html` + matching scripts — Firebase Authentication (US-08): register always creates `role: "employee"`; a `users/{uid}` doc is created on signup with `name`/`email`/`role`.

## Role enforcement (client-side UI layer — spec section 2 + 8)

- `employee`: submit own requests, view own only, comment on own, delete own while `รอพิจารณา`. Cannot change status, cannot see others' requests, cannot edit leave types.
- `manager`: view all requests, change status (approve/reject) while `รอพิจารณา`, comment on any.
- `hr`: everything manager can do, plus full CRUD on `leaveTypes`.
- Rejecting (`ไม่อนุมัติ`) requires at least one existing approval comment first (spec section 6) — check this client-side and show a clear message if not satisfied yet.
- A status change writes **only** the `status` field — never overwrite the rest of the document (`updateDoc(ref, { status: newValue })`, not a full-document `setDoc`).

## US-09 — AI assistant button (in `new-leave-request.html`)

- Button "ให้ AI ช่วยจัดประเภทการลา" that reads the `reason` textarea, sends it plus the real list of existing `leaveTypes` to an LLM, and asks it to pick one.
- Label the result clearly: "ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน".
- Loading state (button disabled + text change) prevents double-click.
- 15-second timeout via `AbortController`; on timeout or any failure, show an inline message but never block the Save button — the rest of the form must stay fully usable.
- Validate the AI's answer against the real `leaveTypes` list — only accept an id that actually exists; otherwise show "จัดให้ไม่ได้" and leave the dropdown unchanged.
- The result only *pre-fills* the dropdown — the user can always change it before saving.
- **Load the API key with a `dynamic import()` inside the button's click handler only** — never a static top-level `import ... from "./config.local.js"`. A static import that 404s (missing key file) blocks the ENTIRE module from evaluating, breaking unrelated features like form submission. Assume the key lives in `js/config.local.js` exporting `OPENROUTER_API_KEY`, and that a `.gitignore` entry for it already exists (or add one if you don't find it: `config.local.js` and `config.local.json`) — also create `js/config.local.example.js` with a placeholder value, safe to commit. Use model `google/gemini-2.5-flash-lite` via `https://openrouter.ai/api/v1/chat/completions`.
- Do not send real personal data to the AI — this is seed/demo data only, which is already fine per spec section 9's privacy note.

## Style conventions to follow (match the existing sibling project's established style)

- Local variable/function names in Thai (e.g. `กล่อง`, `ใบลา`, `เปลี่ยนสถานะ`); data field names, collection names, and role values stay English.
- No comments explaining *what* code does; only *why*, sparingly.
- Every dynamic string that goes into `innerHTML` must pass through `esc()` first.

When done, list every file you created, and flag anything in the spec you found ambiguous or where you had to make a judgment call, so the reviewer agent can double check it.
