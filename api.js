// api.js — Firestore CRUD + Realtime
import { db } from './firebase.js';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function list(entity) {
  const col = collection(db, entity);
  const snap = await getDocs(col);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function watch(entity, cb) {
  let qRef = collection(db, entity);
  if (entity === 'events') {
    // เรียงตามวันที่เฉพาะ events
    qRef = query(qRef, orderBy('startDate','asc'));
  }
  return onSnapshot(qRef, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(data);
  });
}

export async function upsert(entity, data) {
  if (data.id) {
    const ref = doc(db, entity, data.id);
    await updateDoc(ref, data);
    return { id: data.id, ...data };
  } else {
    const ref = await addDoc(collection(db, entity), data);
    return { id: ref.id, ...data };
  }
}

export async function remove(entity, id) {
  const ref = doc(db, entity, id);
  await deleteDoc(ref);
  return { ok: true };
}
