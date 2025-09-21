// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 👉 นำ config ของคุณจาก Firebase Console มาใส่ตรงนี้
const firebaseConfig = {
  apiKey: "AIzaSyB-G1eSiwYJQgjALiWm4Qb2x1sNPqa191o",
  authDomain: "photobooth-booking.firebaseapp.com",
  projectId: "photobooth-booking",
  storageBucket: "photobooth-booking.appspot.com",
  messagingSenderId: "231205524281",
  appId: "1:231205524281:web:322d26f5ac15da75d64ee8",
  measurementId: "G-DBEXZD5CPK"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export Firestore instance
export const db = getFirestore(app);
