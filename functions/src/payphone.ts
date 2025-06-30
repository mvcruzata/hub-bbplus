import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { db } from "./index";

export const payphonehook = onRequest(async (request, response) => {
  try {
    if (request.method !== "POST") {
      response.status(405).json({ error: "Método no permitido" });
      return;
    }

    const body = request.body;

    const clientTransactionId = body.ClientTransactionId || body.clientTransactionId;
    const transactionStatus = body.TransactionStatus || body.transactionStatus;

    if (!clientTransactionId) {
      response.status(400).json({ error: "ClientTransactionId faltante" });
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

    const purchaseDoc = purchasesSnap.docs[0];
    const purchaseData = purchaseDoc.data();
    const docRef = purchaseDoc.ref;

    await docRef.update({
      status: transactionStatus || "pending",
      payphoneRaw: body,
      updated: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (transactionStatus == "Approved") {
      const childId = purchaseData.childId;
      const amount = purchaseData.amount;

      if (!childId || typeof amount !== "number") {
        logger.error("No se encontró childId o amount en el registro de compra.");
        response.status(400).json({ error: "Datos incompletos para actualizar saldo" });
        return;
      }

      const bbcashSnap = await db
        .collection("bbcash")
        .where("personId", "==", childId)
        .limit(1)
        .get();

      if (bbcashSnap.empty) {
        logger.error(`No se encontró bbcash para personId: ${childId}`);
        response.status(404).json({ error: "No se encontró bbcash para la persona" });
        return;
      }

      const bbcashDoc = bbcashSnap.docs[0];
      const bbcashRef = bbcashDoc.ref;
      const bbcashData = bbcashDoc.data();


      const previousBalance = bbcashData.depositedBalance || 0;
      const newBalance = previousBalance + amount;

      await bbcashRef.update({
        depositedBalance: newBalance,
        updated: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(
        `Saldo actualizado en bbcash para personId ${childId}: ${previousBalance} + ${amount} = ${newBalance}`
      );
    }

    response.status(200).json({ success: true });
  } catch (error) {
    logger.error("Error en payphonehook", error);
    response.status(500).json({ error: "Error actualizando compra" });
  }
});
