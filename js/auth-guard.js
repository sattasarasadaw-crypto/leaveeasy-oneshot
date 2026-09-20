// ─────────────────────────────────────────────────────────────
// js/auth-guard.js — ทุกหน้าที่ต้องล็อกอินก่อนใช้งาน import ไฟล์นี้เป็นอันดับแรก (US-08)
// ไม่ล็อกอิน → เด้งไป login.html ทันที · ล็อกอินแล้ว → เปิดให้สคริปต์อื่น await เอารหัส/ชื่อ/บทบาทไปใช้
// ─────────────────────────────────────────────────────────────
import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import {
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

var ปลดล็อกผู้ใช้;
var ผู้ใช้พร้อมใช้ = new Promise(function (resolve) { ปลดล็อกผู้ใช้ = resolve; });

// สคริปต์ของแต่ละหน้า: await รอผู้ใช้ปัจจุบัน() ก่อนแตะ Firestore เสมอ
// เพราะ onAuthStateChanged เป็น async และยังไม่รู้ผลตอนสคริปต์เริ่มรัน
export function รอผู้ใช้ปัจจุบัน() {
  return ผู้ใช้พร้อมใช้;
}

window.ออกจากระบบ = async function () {
  await signOut(auth);
  location.href = 'login.html';
};

onAuthStateChanged(auth, async function (ผู้ใช้ดิบ) {
  if (!ผู้ใช้ดิบ) {
    location.href = 'login.html';
    return;
  }

  var สแนป = await getDoc(doc(db, 'users', ผู้ใช้ดิบ.uid));
  // เผื่อกรณี doc ใน users ยังไม่ทันสร้าง (ไม่ควรเกิดถ้าสมัครผ่าน register.html) — กันหน้าพังแทนที่จะปล่อยว่าง
  var ข้อมูล = สแนป.exists() ? สแนป.data() : { name: ผู้ใช้ดิบ.email, role: 'employee' };

  var ผู้ใช้ = { uid: ผู้ใช้ดิบ.uid, name: ข้อมูล.name, role: ข้อมูล.role };

  if (typeof window.ปรับนำทางตามผู้ใช้ === 'function') window.ปรับนำทางตามผู้ใช้(ผู้ใช้);
  ปลดล็อกผู้ใช้(ผู้ใช้);
});
