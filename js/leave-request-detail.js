// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// US-03 ดูรายละเอียด · US-04 เปลี่ยนสถานะ · US-05 ความเห็น · US-07 ลบใบของตัวเอง
// ─────────────────────────────────────────────────────────────
import { รอผู้ใช้ปัจจุบัน } from './auth-guard.js';
import { db } from './firebase-config.js';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

(async function () {
  var รหัสใบลา = ค่าจากURL('id');
  var กล่องใบลา = document.getElementById('กล่องใบลา');
  var กล่องความเห็น = document.getElementById('กล่องความเห็น');

  var ผู้ใช้ = await รอผู้ใช้ปัจจุบัน();

  var อ้างอิงใบลา = doc(db, 'leaveRequests', รหัสใบลา);

  // firestore.rules ตอบกลับเป็น "ไม่มีสิทธิ์" ทั้งตอนเปิดใบของคนอื่น (US-08) และตอนใบถูกลบไปแล้ว
  // (กฎอ่าน resource.data ของไฟล์ที่ไม่มีอยู่ไม่ได้) — ไม่ดักไว้ หน้าจะค้างที่ "กำลังโหลดข้อมูล…" เฉย ๆ
  var สแนปใบลา;
  try {
    สแนปใบลา = await getDoc(อ้างอิงใบลา);
  } catch (err) {
    กล่องใบลา.innerHTML =
      '<p>เปิดใบขอลานี้ไม่ได้ — ใบนี้อาจถูกลบไปแล้ว หรือเป็นใบของผู้อื่นซึ่งคุณไม่มีสิทธิ์เปิดดู</p>';
    return;
  }

  if (!สแนปใบลา.exists()) {
    กล่องใบลา.innerHTML = '<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>';
    return;
  }

  var ใบ = Object.assign({ id: สแนปใบลา.id }, สแนปใบลา.data());
  var เป็นเจ้าของ = ผู้ใช้.uid === ใบ.requesterId;
  var เป็นผู้อนุมัติ = ผู้ใช้.role === 'manager' || ผู้ใช้.role === 'hr';

  var ความเห็น = await โหลดความเห็น();

  วาดใบลา();
  วาดความเห็น();

  if (เป็นเจ้าของ || เป็นผู้อนุมัติ) {
    กล่องความเห็น.classList.remove('hidden');
    document.getElementById('ปุ่มส่งความเห็น').addEventListener('click', ส่งความเห็น);
  }

  async function โหลดความเห็น() {
    var สแนป = await getDocs(collection(db, 'leaveRequests', ใบ.id, 'approvals'));
    return สแนป.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
  }

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    var แถว = [
      ['หัวข้อ', esc(ใบ.title)],
      ['เหตุผลการลา', esc(ใบ.reason)],
      ['ประเภทการลา', esc(ใบ.leaveTypeName)],
      ['วันที่ลา', esc(ใบ.startDate) + ' ถึง ' + esc(ใบ.endDate)],
      ['ผู้ขอลา', esc(ใบ.requesterName)],
      ['ผู้อนุมัติ', ใบ.approverName ? esc(ใบ.approverName) : 'ยังไม่ได้กำหนดผู้อนุมัติ'],
      ['สถานะ', ป้ายสถานะ(ใบ.status)],
      ['วันที่ยื่น', esc(ใบ.createdAt)]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + '</span><span>' + r[1] + '</span></div>';
    }).join('');

    // ปุ่มอนุมัติ/ไม่อนุมัติ: เฉพาะผู้อนุมัติ/ฝ่ายบุคคล และเฉพาะใบที่ยังรอพิจารณา (หัวข้อ 6)
    if (ใบ.status === 'รอพิจารณา' && เป็นผู้อนุมัติ) {
      html +=
        '<div class="btn-row">' +
        '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
        '</div>';
    } else if (ใบ.status === 'รอพิจารณา') {
      html += '<p class="hint">รอผู้อนุมัติหรือฝ่ายบุคคลพิจารณา</p>';
    } else {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    // ปุ่มลบ: เจ้าของเท่านั้น และเฉพาะใบที่ยังรอพิจารณา (US-07)
    if (ใบ.status === 'รอพิจารณา' && เป็นเจ้าของ) {
      html += '<div class="btn-row"><button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบขอลานี้</button></div>';
    }

    กล่องใบลา.innerHTML = html;

    if (ใบ.status === 'รอพิจารณา' && เป็นผู้อนุมัติ) {
      document.getElementById('ปุ่มอนุมัติ').addEventListener('click', function () { เปลี่ยนสถานะ('อนุมัติ'); });
      document.getElementById('ปุ่มไม่อนุมัติ').addEventListener('click', function () { เปลี่ยนสถานะ('ไม่อนุมัติ'); });
    }
    if (ใบ.status === 'รอพิจารณา' && เป็นเจ้าของ) {
      document.getElementById('ปุ่มลบ').addEventListener('click', ลบใบลา);
    }
  }

  // ── เปลี่ยนสถานะ — แก้เฉพาะช่อง status เท่านั้น ห้ามเขียนทับช่องอื่น (หัวข้อ 6) ──
  async function เปลี่ยนสถานะ(สถานะใหม่) {
    if (สถานะใหม่ === 'ไม่อนุมัติ' && ความเห็น.length === 0) {
      alert('ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้');
      return;
    }
    await updateDoc(อ้างอิงใบลา, { status: สถานะใหม่ });
    ใบ.status = สถานะใหม่;
    วาดใบลา();
  }

  // ── ลบใบลา (US-07) ──
  async function ลบใบลา() {
    if (!confirm('ยืนยันการลบใบขอลานี้หรือไม่ — ลบแล้วกู้คืนไม่ได้')) return;
    await deleteDoc(อ้างอิงใบลา);
    location.href = 'leave-requests.html';
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById('รายการความเห็น');
    if (ความเห็น.length === 0) {
      ที่วาง.innerHTML = '<p>ยังไม่มีความเห็นในใบนี้</p>';
      return;
    }
    ที่วาง.innerHTML = ความเห็น
      .slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
      .map(function (c) {
        return '<div class="comment"><div class="meta">' + esc(c.authorName) + ' · ' + esc(c.createdAt) +
               '</div><div>' + esc(c.message) + '</div></div>';
      }).join('');
  }

  // ── ส่งความเห็นใหม่ — เก็บใน approvals ซึ่งเป็นโฟลเดอร์ย่อยของใบนี้ (US-05) ──
  async function ส่งความเห็น() {
    var ช่อง = document.getElementById('ข้อความความเห็น');
    var เตือน = document.getElementById('เตือนความเห็น');
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือน.textContent = '⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้';
      เตือน.classList.remove('hidden');
      return;
    }
    เตือน.classList.add('hidden');

    var รายการใหม่ = {
      authorId: ผู้ใช้.uid, authorName: ผู้ใช้.name,
      message: ข้อความ,
      createdAt: เวลาตอนนี้()
    };
    await addDoc(collection(db, 'leaveRequests', ใบ.id, 'approvals'), รายการใหม่);
    ความเห็น.push(รายการใหม่);
    ช่อง.value = '';
    วาดความเห็น();
  }
})();
