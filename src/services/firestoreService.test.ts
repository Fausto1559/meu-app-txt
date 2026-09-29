import { describe, it, expect, vi } from 'vitest';
import { saveUserRecord, getUserRecords } from './firestoreService';
import { addDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  addDoc: vi.fn().mockResolvedValue({ id: 'doc123' }),
  query: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      { id: '1', data: () => ({ valor: 50 }) },
      { id: '2', data: () => ({ valor: 150 }) },
    ],
  }),
  Timestamp: { now: vi.fn(() => 'timestamp-mock') },
}));

vi.mock('./firebaseConfig', () => ({
  db: {},
}));

describe('firestoreService - Operações CRUD', () => {
  it('saveUserRecord grava em users/{uid}/{subcolecao} com createdAt', async () => {
    await saveUserRecord('user1', 'fechamentos', { valor: 100 });

    expect(collection).toHaveBeenCalledWith({}, 'users', 'user1', 'fechamentos');
    expect(addDoc).toHaveBeenCalledWith(expect.anything(), {
      valor: 100,
      createdAt: 'timestamp-mock',
    });
  });

  it('getUserRecords retorna os documentos da subcoleção ordenados', async () => {
    const docs = await getUserRecords('user1', 'fechamentos');

    expect(query).toHaveBeenCalled();
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(getDocs).toHaveBeenCalled();
    expect(docs).toEqual([
      { id: '1', valor: 50 },
      { id: '2', valor: 150 },
    ]);
  });
});
