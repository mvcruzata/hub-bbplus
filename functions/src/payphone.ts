import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { db } from "./index"; // O usa admin.firestore() directamente si prefieres

export const payphonehook = onRequest(async (request, response) => {
  try {
    if (request.method !== "POST") {
      response.status(405).json({ error: "Método no permitido" });
      return;
    }

    const body = request.body;

    const clientTransactionId =
      body.clientTransactionId || body.transactionId || body.transaction?.clientTransactionId;
    const transactionStatus =
      body.transactionStatus || body.transaction?.transactionStatus || body.status;

    if (!clientTransactionId) {
      response.status(400).json({ error: "clientTransactionId faltante" });
      return;
    }


    
    
    
    const purchasesSnap = await db
      .collection("purchases")
      .where("clientTransactionId", "==", clientTransactionId)
      .limit(1)
      .get();

    if (purchasesSnap.empty) {
      logger.warn(`No se encontró compra con clientTransactionId: ${clientTransactionId}`);
      response.status(404).json({ error: "Registro no encontrado" });
      return;
    }

    const docRef = purchasesSnap.docs[0].ref;
    await docRef.update({
      status: transactionStatus || "pending",
      payphoneRaw: body,
      updated: admin.firestore.FieldValue.serverTimestamp(),
    });

    response.status(200).json({ success: true });
  } catch (error) {
    logger.error("Error en payphonehook", error);
    response.status(500).json({ error: "Error actualizando compra" });
  }
});
