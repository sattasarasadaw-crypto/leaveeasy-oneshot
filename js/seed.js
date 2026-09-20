import { db } from './firebase-config.js';
import {
  collection,
  doc,
  setDoc,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

// Get UI elements
const seedBtn = document.getElementById('seedBtn');
const seedBtnText = document.getElementById('seedBtnText');
const seedStatus = document.getElementById('seedStatus');

// Enable button once page loads (Firebase initialized)
window.addEventListener('load', () => {
  seedBtn.disabled = false;
  seedBtnText.textContent = 'ทำเมล็ด Firestore';
});

// Seed button click handler
seedBtn.addEventListener('click', async () => {
  if (seedBtn.disabled) return;

  seedBtn.disabled = true;
  seedBtnText.textContent = 'กำลังทำเมล็ด...';
  seedStatus.textContent = '';

  try {
    // Wait for window.LEAVE_DATA to be available
    if (!window.LEAVE_DATA) {
      throw new Error('ข้อมูลตัวอย่างยังโหลดไม่สำเร็จ');
    }

    const batch = writeBatch(db);
    const data = window.LEAVE_DATA;

    // Write users
    for (const user of data.users) {
      const userRef = doc(collection(db, 'users'), user.id);
      batch.set(userRef, {
        name: user.name,
        email: user.email,
        role: user.role
      });
    }

    // Write leave types
    for (const leaveType of data.leaveTypes) {
      const typeRef = doc(collection(db, 'leaveTypes'), leaveType.id);
      batch.set(typeRef, {
        name: leaveType.name
      });
    }

    // Write leave requests
    for (const request of data.leaveRequests) {
      const requestRef = doc(collection(db, 'leaveRequests'), request.id);
      batch.set(requestRef, {
        title: request.title,
        reason: request.reason,
        status: request.status,
        requesterId: request.requesterId,
        requesterName: request.requesterName,
        approverId: request.approverId,
        approverName: request.approverName,
        leaveTypeId: request.leaveTypeId,
        leaveTypeName: request.leaveTypeName,
        startDate: request.startDate,
        endDate: request.endDate,
        createdAt: request.createdAt
      });
    }

    // Commit batch
    await batch.commit();

    // Write approvals as subcollections
    for (const approval of data.approvals) {
      const approvalsRef = collection(
        db,
        'leaveRequests',
        approval.leaveRequestId || approval.requestId,
        'approvals'
      );
      const approvalRef = doc(approvalsRef, approval.id);
      await setDoc(approvalRef, {
        authorId: approval.authorId,
        authorName: approval.authorName,
        message: approval.message,
        createdAt: approval.createdAt
      });
    }

    seedBtnText.textContent = 'ทำเมล็ด Firestore';
    seedStatus.textContent = '✓ ทำเมล็ดสำเร็จแล้ว';
    seedStatus.style.color = '#10b981';
  } catch (err) {
    console.error('Seed error:', err);
    seedBtnText.textContent = 'ทำเมล็ด Firestore';
    seedStatus.textContent = `✗ เกิดข้อผิดพลาด: ${err.message}`;
    seedStatus.style.color = '#ef4444';
  } finally {
    seedBtn.disabled = false;
  }
});
