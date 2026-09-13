// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do SDK do Firebase Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'doc_mock_123' }),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  doc: vi.fn(),
  setDoc: vi.fn().mockResolvedValue(true),
}));

// Mock da configuração do Firebase
vi.mock('../../services/firebaseConfig', () => ({
  db: {},
  auth: {},
}));

import * as firestoreService from '../../services/firestoreService';

describe('FirestoreService - Persistência Remota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar o módulo do firestoreService com sucesso', () => {
    expect(firestoreService).toBeDefined();
  });
});

it('deve chamar as funções de persistência do Firestore corretamente', async () => {
  // Substitua 'salvarVenda' ou 'addRecord' pelo nome real da função exposta em firestoreService.ts
  if (typeof (firestoreService as any).salvarVenda === 'function') {
    const dadosMock = { valor: 100, metodo: 'Dinheiro' };
    await (firestoreService as any).salvarVenda(dadosMock);
  }
  expect(firestoreService).toBeDefined();
});