// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ (US-08)
// ─────────────────────────────────────────────────────────────
import { auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

// ล็อกอินอยู่แล้ว ไม่ต้องมาเห็นหน้านี้อีก
onAuthStateChanged(auth, function (ผู้ใช้) {
  if (ผู้ใช้) location.href = 'leave-requests.html';
});

var ฟอร์ม = document.getElementById('ฟอร์มล็อกอิน');
var กล่องเตือน = document.getElementById('ข้อความเตือน');

ฟอร์ม.addEventListener('submit', async function (e) {
  e.preventDefault();

  var อีเมล = document.getElementById('email').value.trim();
  var รหัสผ่าน = document.getElementById('password').value;
  var ปุ่ม = document.getElementById('ปุ่มล็อกอิน');

  กล่องเตือน.classList.add('hidden');
  ปุ่ม.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
    location.href = 'leave-requests.html';
  } catch (err) {
    กล่องเตือน.textContent = '⚠️ เข้าสู่ระบบไม่สำเร็จ — ตรวจสอบอีเมลและรหัสผ่านอีกครั้ง';
    กล่องเตือน.classList.remove('hidden');
    ปุ่ม.disabled = false;
  }
});
