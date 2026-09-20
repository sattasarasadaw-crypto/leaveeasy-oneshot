// ─────────────────────────────────────────────────────────────
// js/nav.js — แถบเมนูด้านบนที่ใช้ร่วมกันทุกหน้า
// แก้เมนูที่ไฟล์นี้ที่เดียว ทุกหน้าเปลี่ยนตามพร้อมกัน
//
// วิธีใช้: ทุกหน้ามี <div id="nav"></div> ไว้บนสุดของ body
// ─────────────────────────────────────────────────────────────

(function () {
  var เมนู = [
    { href: "index.html",             ชื่อ: "หน้าแรก" },
    { href: "leave-requests.html",    ชื่อ: "รายการใบลา" },
    { href: "new-leave-request.html", ชื่อ: "ยื่นใบลาใหม่" },
    { href: "leave-types.html",       ชื่อ: "ประเภทการลา", เฉพาะhr: true },
    { href: "dashboard.html",         ชื่อ: "แดชบอร์ด" }
  ];

  // ชื่อไฟล์ของหน้าที่กำลังเปิดอยู่ เอาไว้ขีดเส้นใต้เมนูที่ตรงกัน
  var หน้าปัจจุบัน = location.pathname.split("/").pop() || "index.html";

  var html = '<div class="navbar"><span class="brand">🔧 LeaveEasy</span>';
  เมนู.forEach(function (m) {
    var active = m.href === หน้าปัจจุบัน ? ' class="active"' : "";
    // เมนูเฉพาะ hr ซ่อนไว้ก่อน — js/auth-guard.js จะสั่งเปิดให้ผ่าน ปรับนำทางตามผู้ใช้() เมื่อรู้บทบาทแล้ว
    var ซ่อน = m.เฉพาะhr ? ' style="display:none" data-hr-only="1"' : "";
    html += '<a href="' + m.href + '"' + active + ซ่อน + ">" + m.ชื่อ + "</a>";
  });
  html += '<span class="nav-user" id="navUser"></span></div>';

  var ที่วาง = document.getElementById("nav");
  if (ที่วาง) ที่วาง.innerHTML = html;
})();

// เรียกจาก js/auth-guard.js ทันทีที่รู้ตัวตน/บทบาทของผู้ใช้ที่ล็อกอินอยู่ (US-08, ACL หัวข้อ 2)
window.ปรับนำทางตามผู้ใช้ = function (ผู้ใช้) {
  var กล่องชื่อ = document.getElementById("navUser");
  if (กล่องชื่อ) {
    กล่องชื่อ.innerHTML =
      esc(ผู้ใช้.name) + ' <button type="button" id="ปุ่มออกจากระบบ">ออกจากระบบ</button>';
    var ปุ่มออก = document.getElementById("ปุ่มออกจากระบบ");
    if (ปุ่มออก) {
      ปุ่มออก.addEventListener("click", function () {
        if (typeof window.ออกจากระบบ === "function") window.ออกจากระบบ();
      });
    }
  }
  if (ผู้ใช้.role === "hr") {
    document.querySelectorAll('[data-hr-only="1"]').forEach(function (a) { a.style.display = ""; });
  }
};

// แถบเตือนสีเหลือง ใช้ตอนที่ยังไม่ได้ตั้งค่า Firebase
function showConfigWarning(ข้อความ) {
  var กล่อง = document.createElement("div");
  กล่อง.className = "alert alert-warn";
  กล่อง.innerHTML =
    "⚠️ <strong>ยังไม่ได้ตั้งค่า Firebase</strong> — " +
    (ข้อความ || "หน้านี้จึงยังไม่ได้อ่านข้อมูลจากฐานข้อมูลจริง") +
    "<br>วิธีตั้งค่าอยู่ในไฟล์ SETUP.md ขั้นที่ 4";
  var ที่วาง = document.querySelector(".container") || document.body;
  ที่วาง.insertBefore(กล่อง, ที่วาง.firstChild);
}
