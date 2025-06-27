// payphonehook.ts
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const payphonehook = onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Método no permitido");
      return;
    }
    const body = req.body;
    const { reference, userId, productId, amount, status } = body;
    // PayPhone puede mandarte muchos campos, ajusta según recibas

    if (!reference) {
      res.status(400).send("Sin referencia");
      return;
    }

    await db.collection("purchases").doc(reference).set({
      userId,
      productId,
      amount,
      status: status || "paid",
      updated: admin.firestore.FieldValue.serverTimestamp(),
      payphone: body,
    }, { merge: true });




    res.send(`
      <html>
        <body>
          <script>
            // Para que Flutter pueda detectar el cierre
            window.location = "success://payphone";
          </script>
          <h1>Pago realizado correctamente</h1>
          <p>Puedes cerrar esta ventana.</p>
        </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send("Error actualizando compra");
  }
});



export const payphonecancel = onRequest(async (req, res) => {
  res.send(`
    <html>
      <body>
        <script>
          window.location = "cancel://payphone";
        </script>
        <h1>Pago cancelado o fallido</h1>
        <p>Puedes cerrar esta ventana.</p>
      </body>
    </html>
  `);
});
