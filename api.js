import { db } from './firebase.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function list(entity) {
  const q = query(collection(db, entity));
  const snap = await getDocs(q);
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}
export function watch(entity, cb) {
  try {
    const q = query(collection(db, entity), orderBy('startDate','asc'));
    return onSnapshot(q,snap=>{cb(snap.docs.map(d=>({id:d.id,...d.data()})))});
  } catch(e) {
    return onSnapshot(collection(db, entity), snap=>{cb(snap.docs.map(d=>({id:d.id,...d.data()})))});
  }
}
export async function upsert(entity,data){
  if(data.id){const ref=doc(db,entity,data.id);await updateDoc(ref,data);return {id:data.id,...data};}
  else{const ref=await addDoc(collection(db,entity),data);return {id:ref.id,...data};}
}
export async function remove(entity,id){const ref=doc(db,entity,id);await deleteDoc(ref);return {ok:true};}
