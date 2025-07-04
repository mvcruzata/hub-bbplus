// functions/src/index.ts

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

/**
 * HTTP Cloud Function
 * Triggered via HTTP request: https://<region>-<project>.cloudfunctions.net/ia
 */

export const ia = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase diagnosis!");
});
