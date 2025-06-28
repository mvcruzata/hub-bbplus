#!/bin/bash

# Test script for YOLO functions

set -e

FIREBASE_URL=${1:-"http://localhost:5001/your-project-id/us-central1"}

echo "🧪 Testing YOLO Functions..."
echo "Using Firebase URL: $FIREBASE_URL"
echo ""

# Test 1: YOLO Model Info
echo "1️⃣ Testing YOLO Model Info..."
curl -s -X GET "$FIREBASE_URL/yoloModel" \
  -H "Content-Type: application/json" | jq '.' || echo "❌ Failed to get model info"
echo ""

# Test 2: YOLO Inference with sample data
echo "2️⃣ Testing YOLO Inference..."
curl -s -X POST "$FIREBASE_URL/yoloInference" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://via.placeholder.com/640x480/FF0000/FFFFFF?text=Test+Image",
    "saveResult": false
  }' | jq '.' || echo "❌ Failed YOLO inference test"
echo ""

# Test 3: Image Upload
echo "3️⃣ Testing Image Upload..."
# Create a small base64 test image (1x1 pixel red image)
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

curl -s -X POST "$FIREBASE_URL/imageUpload" \
  -H "Content-Type: application/json" \
  -d "{
    \"imageBase64\": \"$TEST_IMAGE\",
    \"fileName\": \"test.png\",
    \"contentType\": \"image/png\",
    \"userId\": \"test-user\"
  }" | jq '.' || echo "❌ Failed image upload test"
echo ""

# Test 4: Image Management
echo "4️⃣ Testing Image Management..."
curl -s -X GET "$FIREBASE_URL/imageManagement?limit=5" \
  -H "Content-Type: application/json" | jq '.' || echo "❌ Failed image management test"
echo ""

echo "✅ All tests completed!"
echo ""
echo "📝 Notes:"
echo "- These are basic connectivity tests"
echo "- For full functionality, configure a real YOLO model"
echo "- Check Firebase Console for detailed logs"