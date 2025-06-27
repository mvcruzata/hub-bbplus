// payphoneorder.ts
import { onRequest } from "firebase-functions/v2/https";
import fetch from "node-fetch";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

const API_TOKEN = "NocM8RJH6EP5udiGe6bnUY1-Z63_Dp-bYHhgr4y4mhPa--DmKan1eAsdKPtwU8d2PZvmsQQlUw6D4QF00EJbdY2pQarZo2t3REfxid0uG9EdrteOF4l1ZvRYvjMQWpIcr6ah-Bamuz60IFwNI3EfAVsb9cLSnszfOftj4BLzBg3KWjshTMv4gaVVtaKroHu4hR8tUNxsiHgTsLfZGGBheWgnQM_GHw4rtA6y_e7OjkVQ9VJWpqPbHAGGT5OqlY1x_z-UFlQaBeZB562SBi9-6CZBTKMXpIoX4t5CpOyD_J2zMf6H3b5xxPXHq93W_lVqEmtVyeS0rmVrGRduRBSix2HeHZg";

export const payphoneorder = onRequest(async (req, res) => {
  try {
    const { userId, productId, amount, reference } = req.method === "POST" ? req.body : req.query;
    if (!userId || !productId || !amount) {
      res.status(400).send("Missing parameters");
      return;
    }



const ppResp = await fetch("https://pay.payphonetodoesposible.com/api/button/Prepare", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_TOKEN}`,
  },
  body: JSON.stringify({
    amount: parseInt(amount),
    amountWithoutTax: parseInt(amount),
    tax: 0,
    clientTransactionId: reference || Date.now().toString(),
    countryCode: "593",
    reference: reference || "Pago Odontobb",
    responseUrl: "https://payphonehook-oqcenuaxya-uc.a.run.app/payphonehook",
    cancelUrl: "https://payphonehook-oqcenuaxya-uc.a.run.app/payphonecancel"
  }),
});

type PrepareResponse = {
  payWithPayPhone?: string;
  // agrega otros campos si necesitas
};

const ppData = await ppResp.json() as PrepareResponse;
const payPhoneUrl = ppData.payWithPayPhone;
if (!payPhoneUrl) {
  res.status(500).send("No se pudo generar link de pago");
  return;
}
res.redirect(payPhoneUrl);





    await db.collection("purchases").doc(reference || Date.now().toString()).set({
      userId,
      productId,
      amount,
      status: "pending",
      created: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.redirect(payPhoneUrl);
  } catch (e) {
    res.status(500).send("Error generando link de pago");
  }
});
