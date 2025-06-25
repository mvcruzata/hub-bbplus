import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: 'odontobbapp',
      clientEmail: 'firebase-adminsdk-y7mmo@odontobbapp.iam.gserviceaccount.com',
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export const payphonehook = onRequest(async (request, response) => {
  try {
    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Método no permitido' });
      return;
    }

    const body = request.body;
    const { userId, productId, status, amount, reference, ...rest } = body;

    if (!userId || !productId || !amount) {
      response.status(400).json({ error: 'Datos incompletos' });
      return;
    }

    const purchaseRef = db.collection('purchases').doc(reference ?? undefined);
    await purchaseRef.set(
      {
        userId,
        productId,
        amount,
        status: status ?? 'paid',
        updated: admin.firestore.FieldValue.serverTimestamp(),
        ...rest,
      },
      { merge: true }
    );

    response.status(200).json({ success: true });
  } catch (error) {
    logger.error("Error en payphonehook", error);
    response.status(500).json({ error: 'Error actualizando compra' });
  }
});
