// ─────────────────────────────────────────────────────────────
// js/leave-types.js — หน้าที่ 4 จัดการประเภทการลา (US-06)
// เฉพาะฝ่ายบุคคล (hr) เท่านั้นที่แก้ไขได้จริง — ซ่อนทั้งหน้าจากคนอื่น (สัปดาห์ที่ 8 ตามหัวข้อ 2 + 8)
// ─────────────────────────────────────────────────────────────
import { รอผู้ใช้ปัจจุบัน } from './auth-guard.js';
import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

(async function () {
  var ผู้ใช้ = await รอผู้ใช้ปัจจุบัน();

  if (ผู้ใช้.role !== 'hr') {
    document.querySelector('.container').innerHTML =
      '<h1>จัดการประเภทการลา</h1><p class="alert alert-error">หน้านี้สำหรับฝ่ายบุคคลเท่านั้น</p>';
    return;
  }

  var ที่วางตาราง = document.getElementById('ตารางประเภท');
  var ช่องชื่อใหม่ = document.getElementById('ชื่อประเภทใหม่');
  var กล่องเตือน = document.getElementById('เตือนประเภท');

  var รายการ = await โหลดประเภท();
  วาดตาราง();

  document.getElementById('ปุ่มเพิ่ม').addEventListener('click', เพิ่มประเภท);

  async function โหลดประเภท() {
    var สแนป = await getDocs(collection(db, 'leaveTypes'));
    return สแนป.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
  }

  function วาดตาราง() {
    if (รายการ.length === 0) {
      ที่วางตาราง.innerHTML = '<p>ยังไม่มีประเภทการลาในระบบ</p>';
      return;
    }

    var html = '<table><thead><tr><th>ชื่อประเภทการลา</th><th>จัดการ</th></tr></thead><tbody>';
    รายการ.forEach(function (ประเภท) {
      html +=
        '<tr><td>' + esc(ประเภท.name) + '</td><td>' +
        '<button type="button" class="btn-ghost" data-edit="' + esc(ประเภท.id) + '">แก้ไข</button> ' +
        '<button type="button" class="btn-danger" data-del="' + esc(ประเภท.id) + '">ลบ</button>' +
        '</td></tr>';
    });
    html += '</tbody></table>';
    ที่วางตาราง.innerHTML = html;

    ที่วางตาราง.querySelectorAll('[data-edit]').forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener('click', function () { แก้ประเภท(ปุ่ม.dataset.edit); });
    });
    ที่วางตาราง.querySelectorAll('[data-del]').forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener('click', function () { ลบประเภท(ปุ่ม.dataset.del); });
    });
  }

  async function เพิ่มประเภท() {
    var ชื่อ = ช่องชื่อใหม่.value.trim();
    if (!ชื่อ) {
      กล่องเตือน.textContent = '⚠️ พิมพ์ชื่อประเภทการลาก่อน จึงจะเพิ่มได้';
      กล่องเตือน.classList.remove('hidden');
      return;
    }
    กล่องเตือน.classList.add('hidden');
    var อ้างอิงใหม่ = await addDoc(collection(db, 'leaveTypes'), { name: ชื่อ });
    รายการ.push({ id: อ้างอิงใหม่.id, name: ชื่อ });
    ช่องชื่อใหม่.value = '';
    วาดตาราง();
  }

  async function แก้ประเภท(id) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    var ชื่อใหม่ = prompt('แก้ชื่อประเภทการลา', ประเภท.name);
    if (ชื่อใหม่ === null) return; // กดยกเลิก
    if (!ชื่อใหม่.trim()) { alert('ชื่อประเภทการลาว่างเปล่าไม่ได้'); return; }
    await updateDoc(doc(db, 'leaveTypes', id), { name: ชื่อใหม่.trim() });
    ประเภท.name = ชื่อใหม่.trim();
    วาดตาราง();
  }

  async function ลบประเภท(id) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    if (!confirm('ยืนยันการลบประเภท "' + ประเภท.name + '" หรือไม่')) return;
    await deleteDoc(doc(db, 'leaveTypes', id));
    รายการ = รายการ.filter(function (t) { return t.id !== id; });
    วาดตาราง();
  }
})();
