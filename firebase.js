// firebase.js — config (photobooth-booking)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCNVv93FykHDyNbpCldFt6DcdR2uHrx0Yo",
  authDomain: "photobooth-booking.firebaseapp.com",
  projectId: "photobooth-booking",
  storageBucket: "photobooth-booking.appspot.com",
  messagingSenderId: "231205524281",
  appId: "1:231205524281:web:322d26f5ac15da75d64ee8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
