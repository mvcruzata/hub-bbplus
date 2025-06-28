import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {defineString} from "firebase-functions/params";
import {storage} from "firebase-admin";

// Environment variables
const yoloModelUrl = defineString("YOLO_MODEL_URL");

// Types for YOLO inference
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

interface YoloResponse {
  success: boolean;
  detections: YoloDetection[];
  processingTime: number;
  imageUrl?: string;
  error?: string;
}

// Model cache to avoid reloading
let modelCache: any = null;
let modelLoadTime = 0;

/**
 * YOLO Object Detection Function
 * Accepts image uploads and returns object detection results
 */
export const yoloInference = onRequest(
  {cors: true, maxInstances: 10},
  async (request, response) => {
    const startTime = Date.now();

    try {
      if (request.method !== "POST") {
        response.status(405).json({
          success: false,
          error: "Método no permitido. Use POST.",
        });
        return;
      }

      // Validate request content type
      if (!request.headers["content-type"]?.includes("multipart/form-data") &&
          !request.headers["content-type"]?.includes("application/json")) {
        response.status(400).json({
          success: false,
          error: "Content-Type debe ser multipart/form-data o application/json",
        });
        return;
      }

      let imageData: Buffer | null = null;
      let imageUrl: string | null = null;

      // Handle different input methods
      if (request.headers["content-type"]?.includes("application/json")) {
        const body = request.body;
        if (body.imageUrl) {
          // Download image from URL
          imageUrl = body.imageUrl;
          if (typeof imageUrl === "string") {
            imageData = await downloadImageFromUrl(imageUrl);
          }
        } else if (body.imageBase64) {
          // Decode base64 image
          imageData = Buffer.from(body.imageBase64, "base64");
        } else {
          response.status(400).json({
            success: false,
            error: "Se requiere imageUrl o imageBase64",
          });
          return;
        }
      } else {
        // Handle multipart form data (file upload)
        // For now, return error as we need additional libraries for multipart
        response.status(400).json({
          success: false,
          error: "Multipart upload no implementado aún. Use JSON con imageUrl o imageBase64",
        });
        return;
      }

      if (!imageData) {
        response.status(400).json({
          success: false,
          error: "No se pudo procesar la imagen",
        });
        return;
      }

      // Validate image format
      if (!isValidImageFormat(imageData)) {
        response.status(400).json({
          success: false,
          error: "Formato de imagen no válido. Use JPEG, PNG o WebP",
        });
        return;
      }

      // Load model if not cached
      if (!modelCache || (Date.now() - modelLoadTime) > 3600000) { // Reload every hour
        logger.info("Loading YOLO model...");
        modelCache = await loadYoloModel();
        modelLoadTime = Date.now();
      }

      // Perform inference
      const detections = await performYoloInference(imageData, modelCache);

      // Save processed image to Firebase Storage (optional)
      let processedImageUrl: string | undefined;
      if (request.body.saveResult) {
        processedImageUrl = await saveProcessedImage(imageData, detections);
      }

      const processingTime = Date.now() - startTime;

      const responseData: YoloResponse = {
        success: true,
        detections,
        processingTime,
        imageUrl: processedImageUrl,
      };

      logger.info("YOLO inference completed", {
        detectionCount: detections.length,
        processingTime,
      });

      response.status(200).json(responseData);
    } catch (error) {
      logger.error("Error en YOLO inference", error);
      const processingTime = Date.now() - startTime;

      response.status(500).json({
        success: false,
        error: "Error interno del servidor",
        processingTime,
      });
    }
  }
);

/**
 * Download image from URL
 */
async function downloadImageFromUrl(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    logger.error("Error downloading image", {url, error});
    throw new Error("Error descargando imagen desde URL");
  }
}

/**
 * Validate image format
 */
function isValidImageFormat(buffer: Buffer): boolean {
  // Check for common image headers
  const jpegHeader = buffer.subarray(0, 3).toString("hex") === "ffd8ff";
  const pngHeader = buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  const webpHeader = buffer.subarray(8, 12).toString() === "WEBP";

  return jpegHeader || pngHeader || webpHeader;
}

/**
 * Load YOLO model (placeholder implementation)
 * In a real implementation, this would load the actual YOLO model
 */
async function loadYoloModel(): Promise<any> {
  // Placeholder for model loading
  // In reality, you would load a TensorFlow.js model or call an external service
  logger.info("Loading YOLO model from", yoloModelUrl.value());

  // Simulate model loading
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    loaded: true,
    version: "YOLOv8n",
    classes: [
      "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
      "truck", "boat", "traffic light", "fire hydrant", "stop sign",
      "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep", "cow",
      "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella",
      "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard",
      "sports ball", "kite", "baseball bat", "baseball glove", "skateboard",
      "surfboard", "tennis racket", "bottle", "wine glass", "cup", "fork",
      "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
      "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
      "couch", "potted plant", "bed", "dining table", "toilet", "tv",
      "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave",
      "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase",
      "scissors", "teddy bear", "hair drier", "toothbrush",
    ],
  };
}

/**
 * Perform YOLO inference (placeholder implementation)
 */
async function performYoloInference(
  imageData: Buffer,
  model: any
): Promise<YoloDetection[]> {
  // Placeholder for actual YOLO inference
  // In reality, this would process the image through the YOLO model

  logger.info("Performing YOLO inference", {
    imageSize: imageData.length,
    modelVersion: model.version,
  });

  // Simulate inference processing time
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return mock detections for demonstration
  const mockDetections: YoloDetection[] = [
    {
      class: "person",
      confidence: 0.95,
      bbox: {x: 100, y: 50, width: 200, height: 400},
    },
    {
      class: "car",
      confidence: 0.87,
      bbox: {x: 350, y: 200, width: 300, height: 150},
    },
  ];

  return mockDetections;
}

/**
 * Save processed image with detection overlays to Firebase Storage
 */
async function saveProcessedImage(
  imageData: Buffer,
  detections: YoloDetection[]
): Promise<string> {
  try {
    const bucket = storage().bucket();
    const fileName = `yolo-results/${Date.now()}-processed.jpg`;
    const file = bucket.file(fileName);

    // In a real implementation, you would draw bounding boxes on the image
    // For now, we'll just save the original image
    await file.save(imageData, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          detections: JSON.stringify(detections),
          processedAt: new Date().toISOString(),
        },
      },
    });

    // Make file publicly readable
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    logger.info("Processed image saved", {url: publicUrl});

    return publicUrl;
  } catch (error) {
    logger.error("Error saving processed image", error);
    throw new Error("Error guardando imagen procesada");
  }
}

/**
 * YOLO Model Management Function
 * Provides endpoints for model information and management
 */
export const yoloModel = onRequest(
  {cors: true},
  async (request, response) => {
    try {
      if (request.method === "GET") {
        // Return model information
        response.status(200).json({
          success: true,
          model: {
            loaded: modelCache !== null,
            version: modelCache?.version || "Not loaded",
            loadTime: modelLoadTime ? new Date(modelLoadTime).toISOString() : null,
            classes: modelCache?.classes?.length || 0,
          },
        });
      } else if (request.method === "POST" && request.body.action === "reload") {
        // Force model reload
        logger.info("Force reloading YOLO model");
        modelCache = await loadYoloModel();
        modelLoadTime = Date.now();

        response.status(200).json({
          success: true,
          message: "Modelo recargado exitosamente",
          model: {
            version: modelCache.version,
            loadTime: new Date(modelLoadTime).toISOString(),
          },
        });
      } else {
        response.status(405).json({
          success: false,
          error: "Método no permitido",
        });
      }
    } catch (error) {
      logger.error("Error en yolo model management", error);
      response.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }
);
