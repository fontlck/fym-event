// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 👉 Config จริงของคุณ (เอามาจาก Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyB-G1eSiwYJQgjALiWm4Qb2x1sNPqa191o",
  authDomain: "photobooth-booking.firebaseapp.com",
  projectId: "photobooth-booking",
  storageBucket: "photobooth-booking.appspot.com",
  messagingSenderId: "231205524281",
  appId: "1:231205524281:web:322d26f5ac15da75d64ee8",
  measurementId: "G-DBEXZD5CPK"
};

// ✅ Init Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Export Firestore ให้ api.js ใช้ได้
export const db = getFirestore(app);
