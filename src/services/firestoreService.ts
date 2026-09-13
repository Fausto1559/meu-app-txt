import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

export const saveUserRecord = async (uid: string, subcollection: string, data: any) => {
  const colRef = collection(db, 'users', uid, subcollection);
  return await addDoc(colRef, { ...data, createdAt: Timestamp.now() });
};

export const getUserRecords = async (uid: string, subcollection: string) => {
  const colRef = collection(db, 'users', uid, subcollection);
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};