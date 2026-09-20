// ─────────────────────────────────────────────────────────────
// js/register.js — หน้าสมัครสมาชิก (US-08)
// สมัครสำเร็จ → สร้างไฟล์ users/{uid} ทันที ด้วย role เริ่มต้น "employee" เสมอ
// ─────────────────────────────────────────────────────────────
import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import {
  doc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

// ⚠️ ไม่ใส่ onAuthStateChanged เพื่อเด้งคนที่ล็อกอินอยู่แล้วออกจากหน้านี้ตั้งแต่ต้น —
// createUserWithEmailAndPassword ทำให้สถานะล็อกอินเปลี่ยนทันทีที่สมัครสำเร็จ
// ถ้ามี listener แบบนั้นจะแข่งกับ setDoc ด้านล่างและอาจเด้งออกไปก่อนไฟล์ users/{uid} ถูกสร้างจริง

var ฟอร์ม = document.getElementById('ฟอร์มสมัคร');
var กล่องเตือน = document.getElementById('ข้อความเตือน');

ฟอร์ม.addEventListener('submit', async function (e) {
  e.preventDefault();

  var ชื่อ = document.getElementById('name').value.trim();
  var อีเมล = document.getElementById('email').value.trim();
  var รหัสผ่าน = document.getElementById('password').value;
  var ปุ่ม = document.getElementById('ปุ่มสมัคร');

  กล่องเตือน.classList.add('hidden');
  if (!ชื่อ) {
    กล่องเตือน.textContent = '⚠️ กรอกชื่อ-นามสกุลก่อน';
    กล่องเตือน.classList.remove('hidden');
    return;
  }

  ปุ่ม.disabled = true;

  try {
    var ข้อมูลรับรอง = await createUserWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
    await setDoc(doc(db, 'users', ข้อมูลรับรอง.user.uid), {
      name: ชื่อ,
      email: อีเมล,
      role: 'employee'
    });
    location.href = 'leave-requests.html';
  } catch (err) {
    กล่องเตือน.textContent = '⚠️ สมัครสมาชิกไม่สำเร็จ — ' + แปลข้อผิดพลาด(err);
    กล่องเตือน.classList.remove('hidden');
    ปุ่ม.disabled = false;
  }
});

function แปลข้อผิดพลาด(err) {
  if (err.code === 'auth/email-already-in-use') return 'อีเมลนี้ถูกใช้สมัครแล้ว';
  if (err.code === 'auth/weak-password') return 'รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)';
  if (err.code === 'auth/invalid-email') return 'รูปแบบอีเมลไม่ถูกต้อง';
  return 'ลองใหม่อีกครั้ง';
}
