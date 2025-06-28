import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {storage} from "firebase-admin";
import {db} from "./index";

// Import types from yolo.ts
interface YoloDetection {
  class: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ImageUploadResponse {
  success: boolean;
  imageId?: string;
  downloadUrl?: string;
  metadata?: ImageMetadata;
  error?: string;
}

interface ImageMetadata {
  originalName: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  userId?: string;
  processed: boolean;
  yoloResults?: YoloDetection[];
}

/**
 * Image Upload and Management Function
 * Handles image uploads for YOLO processing
 */
export const imageUpload = onRequest(
  {cors: true, maxInstances: 10},
  async (request, response) => {
    try {
      if (request.method !== "POST") {
        response.status(405).json({
          success: false,
          error: "Método no permitido. Use POST.",
        });
        return;
      }

      // Validate content type
      if (!request.headers["content-type"]?.includes("application/json")) {
        response.status(400).json({
          success: false,
          error: "Content-Type debe ser application/json",
        });
        return;
      }

      const body = request.body;
      const {imageBase64, fileName, contentType, userId} = body;

      if (!imageBase64) {
        response.status(400).json({
          success: false,
          error: "Se requiere imageBase64",
        });
        return;
      }

      // Decode base64 image
      const imageBuffer = Buffer.from(imageBase64, "base64");

      // Validate image format
      if (!isValidImageFormat(imageBuffer)) {
        response.status(400).json({
          success: false,
          error: "Formato de imagen no válido. Use JPEG, PNG o WebP",
        });
        return;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const imageId = `img_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      const extension = getFileExtension(contentType || "image/jpeg");
      const storagePath = `images/${imageId}.${extension}`;

      // Upload to Firebase Storage
      const bucket = storage().bucket();
      const file = bucket.file(storagePath);

      await file.save(imageBuffer, {
        metadata: {
          contentType: contentType || "image/jpeg",
          metadata: {
            imageId,
            originalName: fileName || "uploaded_image",
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Make file publicly readable
      await file.makePublic();

      const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      // Save metadata to Firestore
      const metadata: ImageMetadata = {
        originalName: fileName || "uploaded_image",
        size: imageBuffer.length,
        contentType: contentType || "image/jpeg",
        uploadedAt: new Date().toISOString(),
        userId,
        processed: false,
      };

      await db.collection("images").doc(imageId).set({
        ...metadata,
        storagePath,
        downloadUrl,
      });

      logger.info("Image uploaded successfully", {
        imageId,
        size: imageBuffer.length,
        userId,
      });

      const responseData: ImageUploadResponse = {
        success: true,
        imageId,
        downloadUrl,
        metadata,
      };

      response.status(200).json(responseData);
    } catch (error) {
      logger.error("Error en image upload", error);
      response.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }
);

/**
 * Image Management Function
 * Provides endpoints for listing, retrieving, and deleting images
 */
export const imageManagement = onRequest(
  {cors: true},
  async (request, response) => {
    try {
      const {method} = request;
      const {imageId} = request.query;

      if (method === "GET") {
        if (imageId) {
          // Get specific image metadata
          const imageDoc = await db.collection("images").doc(imageId as string).get();

          if (!imageDoc.exists) {
            response.status(404).json({
              success: false,
              error: "Imagen no encontrada",
            });
            return;
          }

          response.status(200).json({
            success: true,
            image: {
              id: imageDoc.id,
              ...imageDoc.data(),
            },
          });
        } else {
          // List images (with pagination)
          const {userId, limit = "10", offset = "0"} = request.query;
          let query = db.collection("images")
            .orderBy("uploadedAt", "desc")
            .limit(parseInt(limit as string));

          if (userId) {
            query = query.where("userId", "==", userId);
          }

          if (offset !== "0") {
            const offsetDoc = await db.collection("images").doc(offset as string).get();
            if (offsetDoc.exists) {
              query = query.startAfter(offsetDoc);
            }
          }

          const snapshot = await query.get();
          const images = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          response.status(200).json({
            success: true,
            images,
            count: images.length,
            hasMore: images.length === parseInt(limit as string),
          });
        }
      } else if (method === "DELETE") {
        if (!imageId) {
          response.status(400).json({
            success: false,
            error: "Se requiere imageId",
          });
          return;
        }

        // Get image metadata
        const imageDoc = await db.collection("images").doc(imageId as string).get();

        if (!imageDoc.exists) {
          response.status(404).json({
            success: false,
            error: "Imagen no encontrada",
          });
          return;
        }

        const imageData = imageDoc.data();

        // Delete from Storage
        const bucket = storage().bucket();
        const file = bucket.file(imageData?.storagePath);

        try {
          await file.delete();
        } catch (storageError) {
          logger.warn("Error deleting file from storage", {
            imageId,
            storagePath: imageData?.storagePath,
            error: storageError,
          });
        }

        // Delete from Firestore
        await db.collection("images").doc(imageId as string).delete();

        logger.info("Image deleted successfully", {imageId});

        response.status(200).json({
          success: true,
          message: "Imagen eliminada exitosamente",
        });
      } else {
        response.status(405).json({
          success: false,
          error: "Método no permitido",
        });
      }
    } catch (error) {
      logger.error("Error en image management", error);
      response.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }
);

/**
 * Batch Image Processing Function
 * Processes multiple images with YOLO inference
 */
export const batchImageProcessing = onRequest(
  {cors: true, timeoutSeconds: 540}, // 9 minutes max
  async (request, response) => {
    try {
      if (request.method !== "POST") {
        response.status(405).json({
          success: false,
          error: "Método no permitido. Use POST.",
        });
        return;
      }

      const {imageIds, userId} = request.body;

      if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
        response.status(400).json({
          success: false,
          error: "Se requiere un array de imageIds",
        });
        return;
      }

      if (imageIds.length > 50) {
        response.status(400).json({
          success: false,
          error: "Máximo 50 imágenes por lote",
        });
        return;
      }

      const results = [];
      let processedCount = 0;
      let errorCount = 0;

      logger.info("Starting batch processing", {
        imageCount: imageIds.length,
        userId,
      });

      for (const imageId of imageIds) {
        try {
          // Get image metadata
          const imageDoc = await db.collection("images").doc(imageId).get();

          if (!imageDoc.exists) {
            results.push({
              imageId,
              success: false,
              error: "Imagen no encontrada",
            });
            errorCount++;
            continue;
          }

          const imageData = imageDoc.data();

          // Download image from storage
          const bucket = storage().bucket();
          const file = bucket.file(imageData?.storagePath);
          const [fileBuffer] = await file.download();

          // Use fileBuffer for processing (placeholder)
          const imageSize = fileBuffer.length;

          // Call YOLO inference (this would typically be done via HTTP call)
          // For now, we'll simulate the processing
          await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate processing

          const mockDetections = [
            {
              class: "object",
              confidence: 0.8,
              bbox: {x: 0, y: 0, width: 100, height: 100},
            },
          ];

          logger.info("Processing image", {imageId, imageSize});

          // Update image with YOLO results
          await db.collection("images").doc(imageId).update({
            processed: true,
            yoloResults: mockDetections,
            processedAt: new Date().toISOString(),
          });

          results.push({
            imageId,
            success: true,
            detections: mockDetections,
          });

          processedCount++;
        } catch (error) {
          logger.error("Error processing image in batch", {imageId, error});
          results.push({
            imageId,
            success: false,
            error: "Error procesando imagen",
          });
          errorCount++;
        }
      }

      logger.info("Batch processing completed", {
        total: imageIds.length,
        processed: processedCount,
        errors: errorCount,
      });

      response.status(200).json({
        success: true,
        results,
        summary: {
          total: imageIds.length,
          processed: processedCount,
          errors: errorCount,
        },
      });
    } catch (error) {
      logger.error("Error en batch image processing", error);
      response.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }
);

// Helper functions
function isValidImageFormat(buffer: Buffer): boolean {
  const jpegHeader = buffer.subarray(0, 3).toString("hex") === "ffd8ff";
  const pngHeader = buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  const webpHeader = buffer.subarray(8, 12).toString() === "WEBP";

  return jpegHeader || pngHeader || webpHeader;
}

function getFileExtension(contentType: string): string {
  switch (contentType) {
  case "image/jpeg":
  case "image/jpg":
    return "jpg";
  case "image/png":
    return "png";
  case "image/webp":
    return "webp";
  default:
    return "jpg";
  }
}
