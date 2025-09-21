// firebase.js — config + Firestore

// Import SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Config (จาก Firebase Console ของคุณ)
const firebaseConfig = {
  apiKey: "AIzaSyB-G1eSiwJYQgjALiwMqOb2x1sNPqa19i0",
  authDomain: "photobooth-booking.firebaseapp.com",
  projectId: "photobooth-booking",
  storageBucket: "photobooth-booking.appspot.com", // ✅ แก้เป็น .appspot.com
  messagingSenderId: "231205524281",
  appId: "1:231205524281:web:322d26f5ac15da75d64ee8",
  measurementId: "G-DEBXZD5CPK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
