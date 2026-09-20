# LeaveEasy — Test Results (Week 9)

Tested against the live deployed app: **https://leaveeasy-oneshot-sat.web.app**
Test run date: 2026-09-20 (all times below are UTC, taken from the automation log)
Tool: Playwright MCP browser automation, driven manually test-by-test (not a saved `.spec.js` suite).

Accounts used:
- Fresh employee accounts registered for this run via `register.html`:
  - `tester.a.20260920051047@example.com` / `TestPass123!` — "Tester Employee A"
  - `tester.b.20260920051303@example.com` / `TestPass123!` — "Tester Employee B"
- Pre-existing, pre-promoted accounts supplied by the orchestrating session (not created by this run):
  - `test.manager@example.com` / `TestPass123!` — role `manager`, display name "ทดสอบ หัวหน้า"
  - `test.hr@example.com` / `TestPass123!` — role `hr` (not needed by any of the 5 required tests, so not exercised)

No third role-promoted account was needed — the two pre-existing manager/hr accounts covered everything required.

---

## 1. Workflow Test 1 — Submit a leave request (employee)

**Result: PASS**

**Steps:**
1. Registered fresh employee "Tester Employee A" via `register.html` (lands as `role: employee` automatically).
2. Navigated to `new-leave-request.html`, filled all fields (title "ทดสอบระบบ WF1 20260920", reason, leave type "ลาพักร้อน", start 2026-10-01, end 2026-10-02) and clicked "บันทึก".
3. App redirected to `leave-requests.html`.
4. Confirmed the new row appeared with the correct title, leave type, status "รอพิจารณา", requester name, and date range.
5. Did a full page navigation (`page.goto`, not a client-side re-render) back to `leave-requests.html` to force a real reload from Firestore.

**Observed:** Row was present with identical data both immediately after creation and after the full reload — confirms the read comes from Firestore (`getDocs` in `js/leave-requests.js`), not leftover in-memory/optimistic UI. Clicking the row navigated to `leave-request-detail.html?id=Kl4P72BM074l9ct6yOla`, which rendered the same data correctly (this ID was reused as the target for Workflow Test 2 and Security Test 2 below).

Timestamp: ~05:11–05:12 UTC.

---

## 2. Workflow Test 2 — Approve a request (manager)

**Result: PASS**

**Steps:**
1. Logged out employee A, logged in as `test.manager@example.com` (pre-promoted `manager` role).
2. Navigated directly to `leave-request-detail.html?id=Kl4P72BM074l9ct6yOla` (employee A's request from Test 1).
3. Confirmed manager can see full request detail (cross-employee read allowed for `manager`/`hr` per rules) with "อนุมัติ" / "ไม่อนุมัติ" buttons visible.
4. Clicked "อนุมัติ".
5. Confirmed in-page status flipped to "อนุมัติ" and the action buttons were replaced by "ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้" (this request has been decided, status can no longer change).
6. Did a full page reload (`page.goto` on the same URL) to rule out optimistic-UI-only update.

**Observed:** After reload, status still read "อนุมัติ" and the approve/reject buttons stayed gone, terminal-state message still shown — confirms persistence in Firestore and that `firestore.rules`' `approverChangesStatusOnly()` one-way-only transition is enforced/reflected correctly in the UI.

**Noted but not a bug:** the "ผู้อนุมัติ" (approver) field still reads "ยังไม่ได้กำหนดผู้อนุมัติ" after approval. Per spec §6 and `firestore.rules` (`approverChangesStatusOnly` only allows the `status` key to change), the approve/reject action is intentionally status-only — assigning `approverId`/`approverName` is a separate HR-only "assign approver" feature described in spec §2/§5 that is out of scope for this week's build. Confirmed this is by design, not logged to BACKLOG.md.

Timestamp: ~05:13–05:14 UTC.

---

## 3. Validation Test — Submit with a required field missing

**Result: PASS**

**Steps:**
1. As employee A, opened `new-leave-request.html`.
2. Filled title, reason, start date, end date — deliberately left "ประเภทการลา" (leave type) at the placeholder "— เลือกประเภทการลา —" (empty value).
3. Clicked "บันทึก".

**Observed:**
- Page did **not** navigate away / did not call `addDoc` — client-side check in `js/new-leave-request.js` (`if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || ...)`) caught the empty `leaveTypeId` before touching Firestore.
- A visible error banner appeared: "⚠️ กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก" ("Incomplete — all fields are required before saving").
- Navigated to `leave-requests.html` afterward and searched for the test's title ("ทดสอบ Validation ขาดประเภท") — no matching row found, confirming no Firestore document was created for the invalid submission. Employee A's request list still only contained the one request from Workflow Test 1.

Timestamp: ~05:12 UTC.

---

## 4. Security Test 1 — Unauthenticated access to leave-requests.html

**Result: PASS**

**Steps:**
1. With no prior login in this browser session, navigated directly to `https://leaveeasy-oneshot-sat.web.app/leave-requests.html`.

**Observed:** `js/auth-guard.js`'s `onAuthStateChanged` callback fired with `user === null` and immediately redirected to `login.html` (final URL was `login.html`, title "เข้าสู่ระบบ · LeaveEasy"). No table, no leave-request data, and no Firestore read was ever attempted (Firestore rules would have blocked it server-side anyway, but the client redirected before even trying). Console showed no errors.

Timestamp: ~05:32 UTC (run first, before any accounts existed in this session).

---

## 5. Security Test 2 — Cross-employee direct URL access

**Result: PASS**

**Steps:**
1. Registered a second fresh employee, "Tester Employee B" (`tester.b.20260920051303@example.com`).
2. While logged in as B, navigated directly to `leave-request-detail.html?id=Kl4P72BM074l9ct6yOla` — employee A's specific request ID from Test 1.

**Observed:** Page did not render any of employee A's data (no title, reason, dates, etc.). Instead it showed: "เปิดใบขอลานี้ไม่ได้ — ใบนี้อาจถูกลบไปแล้ว หรือเป็นใบของผู้อื่นซึ่งคุณไม่มีสิทธิ์เปิดดู" ("Can't open this request — it may have been deleted, or it belongs to someone else you don't have permission to view"). This is the `catch` branch in `js/leave-request-detail.js`, triggered by Firestore's `PERMISSION_DENIED` from the `allow read: if isMine() || isApprover();` rule correctly rejecting B's read of A's document. Checked console messages — no leaked data, only routine Firebase SDK logs and one unrelated `favicon.ico` 404.

Timestamp: ~05:13 UTC.

---

## Summary

| # | Test | Result |
|---|------|--------|
| 1 | Workflow Test 1 (submit as employee) | PASS |
| 2 | Workflow Test 2 (approve as manager) | PASS |
| 3 | Validation Test (missing required field) | PASS |
| 4 | Security Test 1 (unauthenticated access) | PASS |
| 5 | Security Test 2 (cross-employee direct URL) | PASS |

**5 / 5 PASS.** No app code was modified to make any test pass. No additional role promotion was needed beyond the two pre-existing manager/hr accounts supplied by the orchestrating session. See `BACKLOG.md` for minor non-blocking items noticed in passing.
