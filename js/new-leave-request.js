// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่ (US-02) + ปุ่มผู้ช่วย AI (US-09)
// ─────────────────────────────────────────────────────────────
import { รอผู้ใช้ปัจจุบัน } from './auth-guard.js';
import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  addDoc
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

(async function () {
  var ฟอร์ม = document.getElementById('ฟอร์มใบลา');
  var ช่องประเภท = document.getElementById('leaveTypeId');
  var กล่องเตือน = document.getElementById('ข้อความเตือน');
  var ปุ่มบันทึก = document.getElementById('ปุ่มบันทึก');

  var ผู้ใช้ = await รอผู้ใช้ปัจจุบัน();

  var สแนปประเภท = await getDocs(collection(db, 'leaveTypes'));
  var ประเภททั้งหมด = สแนปประเภท.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
  ประเภททั้งหมด.forEach(function (ประเภท) {
    var ตัวเลือก = document.createElement('option');
    ตัวเลือก.value = ประเภท.id;
    ตัวเลือก.textContent = ประเภท.name;
    ช่องประเภท.appendChild(ตัวเลือก);
  });

  ฟอร์ม.addEventListener('submit', async function (e) {
    e.preventDefault();

    var ค่า = {
      title: document.getElementById('title').value.trim(),
      reason: document.getElementById('reason').value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById('startDate').value,
      endDate: document.getElementById('endDate').value
    };

    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      เตือน('กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก');
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      เตือน('วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา');
      return;
    }

    var ประเภท = ประเภททั้งหมด.find(function (t) { return t.id === ค่า.leaveTypeId; });

    ปุ่มบันทึก.disabled = true;
    try {
      await addDoc(collection(db, 'leaveRequests'), {
        title: ค่า.title,
        reason: ค่า.reason,
        status: 'รอพิจารณา', // ใบใหม่เริ่มที่ รอพิจารณา เสมอ ตั้งค่าอัตโนมัติ
        requesterId: ผู้ใช้.uid, requesterName: ผู้ใช้.name,
        approverId: '', approverName: '',
        leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
        startDate: ค่า.startDate,
        endDate: ค่า.endDate,
        createdAt: เวลาตอนนี้()
      });
      location.href = 'leave-requests.html';
    } catch (err) {
      เตือน('บันทึกไม่สำเร็จ — ลองใหม่อีกครั้ง');
      ปุ่มบันทึก.disabled = false;
    }
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = '⚠️ ' + ข้อความ;
    กล่องเตือน.classList.remove('hidden');
  }

  // ── US-09: ปุ่มให้ AI ช่วยจัดประเภทการลา ──
  var ปุ่มAI = document.getElementById('ปุ่มAI');
  var กล่องผลAI = document.getElementById('ผลAI');
  var ช่องเหตุผล = document.getElementById('reason');
  var ข้อความปุ่มAIปกติ = ปุ่มAI.textContent;

  ปุ่มAI.addEventListener('click', async function () {
    var เหตุผล = ช่องเหตุผล.value.trim();
    if (!เหตุผล) {
      แสดงผลAI('พิมพ์เหตุผลการลาก่อน แล้วค่อยกดให้ AI ช่วยจัดประเภท');
      return;
    }

    ปุ่มAI.disabled = true;
    ปุ่มAI.textContent = 'กำลังให้ AI ช่วยดู…';
    กล่องผลAI.classList.add('hidden');

    var ตัวยกเลิก = new AbortController();
    var หมดเวลา = setTimeout(function () { ตัวยกเลิก.abort(); }, 15000);

    try {
      // โหลดคีย์แบบ dynamic import เฉพาะตอนกดปุ่มเท่านั้น — ถ้า import แบบ static ตั้งแต่บนสุดของไฟล์
      // แล้วยังไม่มี js/config.local.js (เพราะถูก .gitignore ไว้) ทั้งโมดูลนี้จะพังไปด้วย รวมถึงปุ่มบันทึกฟอร์ม
      var ค่าคีย์ = await import('./config.local.js');
      var รายชื่อประเภท = ประเภททั้งหมด.map(function (t) { return { id: t.id, name: t.name }; });

      var คำตอบ = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: ตัวยกเลิก.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + ค่าคีย์.OPENROUTER_API_KEY
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            { role: 'system', content: 'ตอบกลับเป็น id ของประเภทการลาที่ตรงที่สุดเพียงค่าเดียวเท่านั้น ห้ามมีคำอธิบายอื่นปนมา' },
            { role: 'user', content: 'เหตุผลการลา: ' + เหตุผล + '\nประเภทการลาที่มีอยู่จริงในระบบ: ' + JSON.stringify(รายชื่อประเภท) }
          ]
        })
      });

      if (!คำตอบ.ok) throw new Error('เรียก AI ไม่สำเร็จ');
      var ผล = await คำตอบ.json();
      var ข้อความตอบ = ((ผล.choices && ผล.choices[0] && ผล.choices[0].message && ผล.choices[0].message.content) || '').trim();

      // ต้องเป็นประเภทที่มีอยู่จริงเท่านั้น ห้ามเชื่อคำตอบที่ AI มโนขึ้นมาเอง
      var ประเภทที่เลือก = ประเภททั้งหมด.find(function (t) { return ข้อความตอบ.indexOf(t.id) !== -1; });

      if (ประเภทที่เลือก) {
        ช่องประเภท.value = ประเภทที่เลือก.id; // แค่เติมให้ล่วงหน้า ผู้ใช้ยังแก้เองได้เสมอ
        แสดงผลAI('ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน: "' + ประเภทที่เลือก.name + '"');
      } else {
        แสดงผลAI('จัดให้ไม่ได้ — โปรดเลือกประเภทการลาเอง');
      }
    } catch (err) {
      var เหตุผลพัง = err.name === 'AbortError' ? 'รอนานเกินไป' : 'เรียก AI ไม่สำเร็จ';
      แสดงผลAI('จัดให้ไม่ได้ (' + เหตุผลพัง + ') — เลือกประเภทการลาเองได้เลย บันทึกใบลาได้ตามปกติ');
    } finally {
      clearTimeout(หมดเวลา);
      ปุ่มAI.disabled = false;
      ปุ่มAI.textContent = ข้อความปุ่มAIปกติ;
    }
  });

  function แสดงผลAI(ข้อความ) {
    กล่องผลAI.textContent = ข้อความ;
    กล่องผลAI.classList.remove('hidden');
  }
})();
