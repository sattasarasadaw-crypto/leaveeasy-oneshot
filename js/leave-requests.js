// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา (US-01)
// อ่านจาก Firestore จริง · employee เห็นเฉพาะใบของตัวเอง ตาม ACL หัวข้อ 2
// ─────────────────────────────────────────────────────────────
import { รอผู้ใช้ปัจจุบัน } from './auth-guard.js';
import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

(async function () {
  var กล่อง = document.getElementById('ผลลัพธ์');
  var ผู้ใช้ = await รอผู้ใช้ปัจจุบัน();

  var เงื่อนไข = [];
  if (ผู้ใช้.role === 'employee') {
    เงื่อนไข.push(where('requesterId', '==', ผู้ใช้.uid));
  }

  var สแนป = await getDocs(query(collection(db, 'leaveRequests'), ...เงื่อนไข));
  var ใบลาทั้งหมด = สแนป.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });

  // เรียงใหม่ไปเก่าให้อ่านง่าย — จัดเรียงฝั่ง client เพราะยังไม่ต้องผสม orderBy กับ where
  ใบลาทั้งหมด.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });

  var สถานะที่กรอง = ค่าจากURL('status');
  if (สถานะที่กรอง) {
    ใบลาทั้งหมด = ใบลาทั้งหมด.filter(function (ใบ) { return ใบ.status === สถานะที่กรอง; });
    document.querySelector('.subtitle').textContent =
      'กำลังแสดงเฉพาะใบลาที่สถานะ ' + สถานะที่กรอง + ' · กดเมนู รายการใบลา เพื่อดูทั้งหมด';
  }

  แสดงตาราง(ใบลาทั้งหมด);

  function แสดงตาราง(รายการ) {
    if (รายการ.length === 0) {
      กล่อง.innerHTML = สถานะที่กรอง
        ? '<p>ไม่พบใบขอลาที่ตรงกับตัวกรอง</p>'
        : '<p>ยังไม่มีใบขอลาในระบบ</p>';
      return;
    }

    var html =
      '<table><thead><tr>' +
      '<th>หัวข้อ</th>' +
      '<th>ประเภทการลา</th>' +
      '<th>สถานะ</th>' +
      '<th class="hide-mobile">ผู้ขอลา</th>' +
      '<th class="hide-mobile">วันที่ลา</th>' +
      '</tr></thead><tbody>';

    รายการ.forEach(function (ใบ) {
      html +=
        '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
        '<td>' + esc(ใบ.title) + '</td>' +
        '<td>' + esc(ใบ.leaveTypeName) + '</td>' +
        '<td>' + ป้ายสถานะ(ใบ.status) + '</td>' +
        '<td class="hide-mobile">' + esc(ใบ.requesterName) + '</td>' +
        '<td class="hide-mobile">' + esc(ใบ.startDate) + ' ถึง ' + esc(ใบ.endDate) + '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    กล่อง.innerHTML = html;

    กล่อง.querySelectorAll('tr.clickable').forEach(function (แถว) {
      แถว.addEventListener('click', function () {
        location.href = 'leave-request-detail.html?id=' + แถว.dataset.id;
      });
    });
  }
})();
