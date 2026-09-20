# BACKLOG — issues found during Week 9 testing, deliberately not fixed here

All 5 required tests (see `test-results.md`) passed cleanly. Nothing broken was found that
blocks the tested workflows, validation, or security rules. Per the tester agent's rule, no
application code was edited during this test pass — anything below is left for a future
session to triage.

## Minor / cosmetic

1. **`favicon.ico` 404 on every page.** Noticed in the browser console during Security Test 2
   (and present on other pages too). No `favicon.ico` file exists in the project root or is
   referenced/linked in the HTML `<head>`. Cosmetic only — never surfaced to the user, doesn't
   affect any functionality — but a stray 404 on every page load is easy to fix by dropping a
   favicon file in the root or adding a `<link rel="icon" href="data:,">` no-op tag.

## Confirmed by-design, not bugs (documenting so a future pass doesn't "fix" them)

2. **Approving/rejecting a request never sets `approverId`/`approverName`.** After a manager
   approves a request, the "ผู้อนุมัติ" (approver) field on `leave-request-detail.html` still
   reads "ยังไม่ได้กำหนดผู้อนุมัติ" (no approver assigned) instead of showing the approving
   manager's name. This looks surprising at first glance, but it is intentional per
   `leaveeasy-spec.md` §2 (assigning an approver to a request is an **hr-only** action, separate
   from a manager approving/rejecting) and is enforced server-side by `firestore.rules`'
   `approverChangesStatusOnly()`, which only allows the `status` key to change on an
   approve/reject transition (`request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status'])`).
   The "assign approver" UI itself doesn't appear to be built yet anywhere (checked
   `leave-request-detail.html`/`.js`, `leave-requests.html`/`.js`) — that's expected, since
   spec §8 scopes this feature to a later week ("หน้าโครงจาก prototype · ต่อข้อมูลจริงใน Module 3"
   per spec line 61). No action needed now; flagging only so it isn't mistaken for a defect and
   "fixed" by loosening the security rule, which would be a real regression.

3. **AI leave-type classify button fails on the live URL.** Already known/expected per the
   orchestrating session's brief — the OpenRouter API key is deliberately not deployed to
   Firebase Hosting for security reasons, so `js/config.local.js` 404s and the button falls back
   to its "จัดให้ไม่ได้ (เรียก AI ไม่สำเร็จ)" message, degrading gracefully. Not tested as part of
   the 5 required tests and not treated as a bug.

## Notes on test accounts created

- `tester.a.20260920051047@example.com` (employee, "Tester Employee A") — owns one leave
  request, now in terminal `อนุมัติ` state after Workflow Test 2. Left in Firestore; harmless
  sample data, but a future cleanup pass could delete these two throwaway accounts/documents
  from Firebase Console if the project wants a clean seed state again.
- `tester.b.20260920051303@example.com` (employee, "Tester Employee B") — has no leave
  requests of its own, used only to prove it *cannot* read Tester A's request.

No third role-promoted account was required — `test.manager@example.com` (manager) and
`test.hr@example.com` (hr), already promoted before this run, covered every test that needed
elevated roles.
