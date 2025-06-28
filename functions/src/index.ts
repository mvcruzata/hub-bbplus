/**
 * Index file that exports all Firebase Functions
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export Firestore instance for use in other files
export const db = admin.firestore();

// Re-export all functions from their respective files
export {diagnosis} from "./diagnosis";
export {payphonehook} from "./payphone";
export {payhook} from "./pay";
export {yoloInference, yoloModel} from "./yolo";
export {imageUpload, imageManagement, batchImageProcessing} from
  "./imageManagement";
