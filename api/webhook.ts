import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Inicialização modular do Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || "CRIE_SEU_TOKEN_SECRETO_AQUI";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const authToken = req.headers['asaas-access-token'];
  if (authToken !== ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  const { event, payment } = req.body || {};

  if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
    const userUid = payment?.externalReference;

    if (!userUid) {
      return res.status(400).json({ error: 'externalReference ausente' });
    }

    try {
      await db.collection('users').doc(userUid).set({
        isPremium: true,
        subscriptionStatus: 'ACTIVE',
        asaasCustomerId: payment?.customer,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar Firestore' });
    }
  }

  return res.status(200).json({ received: true });
}