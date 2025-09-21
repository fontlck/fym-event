// api.js — Firestore CRUD + realtime
import { db } from './firebase.js';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function list(entity) {
  const q = query(collection(db, entity));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function watch(entity, cb, orderField) {
  const q = orderField ? query(collection(db, entity), orderBy(orderField, 'asc')) : query(collection(db, entity));
  return onSnapshot(q, (snap)=> {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(data);
  });
}

export async function upsert(entity, data) {
  const toSave = { ...data };
  // Normalise checkbox -> boolean
  if (typeof toSave.paidDeposit !== "undefined") toSave.paidDeposit = !!toSave.paidDeposit && toSave.paidDeposit !== "false";
  if (typeof toSave.paidFull !== "undefined") toSave.paidFull = !!toSave.paidFull && toSave.paidFull !== "false";

  if (toSave.id) {
    const ref = doc(db, entity, toSave.id);
    await updateDoc(ref, toSave);
    return { id: toSave.id, ...toSave };
  } else {
    const ref = await addDoc(collection(db, entity), toSave);
    return { id: ref.id, ...toSave };
  }
}

export async function remove(entity, id) {
  const ref = doc(db, entity, id);
  await deleteDoc(ref);
  return { ok: true };
}
