# YOLO API Migration Documentation

## Overview

This document describes the migration of fastapi-yolo-api functionalities to Firebase Functions in the hub-bbplus project.

## Architecture

### Functions Overview

1. **yoloInference** - Main YOLO object detection function
2. **yoloModel** - Model management and information
3. **imageUpload** - Image upload and storage management
4. **imageManagement** - CRUD operations for images
5. **batchImageProcessing** - Batch processing of multiple images

### Technology Stack

- **Firebase Functions v2** - Serverless function platform
- **Firebase Storage** - Image file storage
- **Firestore** - Metadata and results storage
- **TypeScript** - Type-safe development

## API Endpoints

### 1. YOLO Inference - `/yoloInference`

Performs object detection on uploaded images.

**Method:** POST
**Content-Type:** application/json

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "saveResult": true
}
```

**Alternative Request (Base64):**
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "saveResult": false
}
```

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "class": "person",
      "confidence": 0.95,
      "bbox": {
        "x": 100,
        "y": 50,
        "width": 200,
        "height": 400
      }
    }
  ],
  "processingTime": 1250,
  "imageUrl": "https://storage.googleapis.com/bucket/processed-image.jpg"
}
```

### 2. Model Management - `/yoloModel`

Manages YOLO model loading and information.

**Get Model Info:**
```bash
GET /yoloModel
```

**Response:**
```json
{
  "success": true,
  "model": {
    "loaded": true,
    "version": "YOLOv8n",
    "loadTime": "2024-01-15T10:30:00.000Z",
    "classes": 80
  }
}
```

**Reload Model:**
```bash
POST /yoloModel
Content-Type: application/json

{
  "action": "reload"
}
```

### 3. Image Upload - `/imageUpload`

Handles image uploads for processing.

**Method:** POST
**Content-Type:** application/json

**Request:**
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "fileName": "test-image.jpg",
  "contentType": "image/jpeg",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "imageId": "img_1642234567890_abc123",
  "downloadUrl": "https://storage.googleapis.com/bucket/images/img_1642234567890_abc123.jpg",
  "metadata": {
    "originalName": "test-image.jpg",
    "size": 156789,
    "contentType": "image/jpeg",
    "uploadedAt": "2024-01-15T10:30:00.000Z",
    "userId": "user123",
    "processed": false
  }
}
```

### 4. Image Management - `/imageManagement`

CRUD operations for image metadata.

**List Images:**
```bash
GET /imageManagement?userId=user123&limit=10&offset=0
```

**Get Specific Image:**
```bash
GET /imageManagement?imageId=img_1642234567890_abc123
```

**Delete Image:**
```bash
DELETE /imageManagement?imageId=img_1642234567890_abc123
```

### 5. Batch Processing - `/batchImageProcessing`

Process multiple images in a single request.

**Method:** POST
**Content-Type:** application/json

**Request:**
```json
{
  "imageIds": [
    "img_1642234567890_abc123",
    "img_1642234567891_def456"
  ],
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "imageId": "img_1642234567890_abc123",
      "success": true,
      "detections": [...]
    }
  ],
  "summary": {
    "total": 2,
    "processed": 2,
    "errors": 0
  }
}
```

## Environment Variables

The following environment variables need to be configured:

- `YOLO_MODEL_URL` - URL to the YOLO model file

## Deployment

### Prerequisites

1. Firebase CLI installed
2. Project configured with Firebase
3. Storage bucket created

### Deploy Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

### Deploy Specific Function

```bash
firebase deploy --only functions:yoloInference
```

## Integration Examples

### JavaScript/TypeScript Client

```typescript
// Upload and process image
async function processImage(imageFile: File) {
  // Convert to base64
  const base64 = await fileToBase64(imageFile);
  
  // Upload image
  const uploadResponse = await fetch('/imageUpload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: base64,
      fileName: imageFile.name,
      contentType: imageFile.type,
      userId: 'current-user-id'
    })
  });
  
  const uploadResult = await uploadResponse.json();
  
  if (uploadResult.success) {
    // Process with YOLO
    const inferenceResponse = await fetch('/yoloInference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: uploadResult.downloadUrl,
        saveResult: true
      })
    });
    
    const detections = await inferenceResponse.json();
    return detections;
  }
}
```

### cURL Examples

```bash
# Upload image
curl -X POST \
  https://region-project.cloudfunctions.net/imageUpload \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "'$(base64 -i image.jpg)'",
    "fileName": "image.jpg",
    "contentType": "image/jpeg"
  }'

# Process image
curl -X POST \
  https://region-project.cloudfunctions.net/yoloInference \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg"
  }'
```

## Error Handling

All functions return standardized error responses:

```json
{
  "success": false,
  "error": "Error description",
  "processingTime": 150
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Internal Server Error

## Monitoring and Logging

Functions use Firebase's built-in logging:

```typescript
import * as logger from "firebase-functions/logger";

logger.info("Processing started", { imageId, userId });
logger.error("Processing failed", error);
```

Logs can be viewed in:
- Firebase Console > Functions > Logs
- Google Cloud Console > Logging

## Security Considerations

1. **CORS Configuration** - Configured for cross-origin requests
2. **Input Validation** - All inputs are validated
3. **File Type Validation** - Only JPEG, PNG, WebP allowed
4. **Size Limits** - Enforce reasonable file size limits
5. **Rate Limiting** - Use Firebase's built-in limits

## Performance Optimization

1. **Model Caching** - Models are cached in memory
2. **Connection Pooling** - Reuse connections where possible
3. **Concurrent Processing** - Limited concurrent instances
4. **Timeout Configuration** - Appropriate timeouts set

## Future Enhancements

1. **Real YOLO Models** - Replace mock implementation
2. **Image Preprocessing** - Add resize, normalize functions
3. **WebSocket Support** - Real-time processing updates
4. **Metrics Dashboard** - Processing analytics
5. **A/B Testing** - Multiple model versions