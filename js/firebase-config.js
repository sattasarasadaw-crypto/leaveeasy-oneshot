// Firebase v10 modular SDK configuration
// apiKey below is a Firebase client config value — safe to be public (not a secret);
// real access control comes from firestore.rules, not from hiding this value.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyD4rMAlHrNxKc7jm1CuBPtcFn1vTXhurrA",
  authDomain: "leaveeasy-oneshot-sat.firebaseapp.com",
  projectId: "leaveeasy-oneshot-sat",
  storageBucket: "leaveeasy-oneshot-sat.firebasestorage.app",
  messagingSenderId: "466616850215",
  appId: "1:466616850215:web:0228e5e79b31ec489c3b02"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
