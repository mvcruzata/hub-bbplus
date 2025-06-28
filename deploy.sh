#!/bin/bash

# Deployment script for hub-bbplus with YOLO functions

set -e

echo "🚀 Deploying hub-bbplus with YOLO functions..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "firebase login"
    exit 1
fi

# Build Next.js app
echo "📦 Building Next.js application..."
npm run build

# Build Firebase Functions
echo "⚙️ Building Firebase Functions..."
cd functions
npm run build
cd ..

# Deploy everything
echo "🚀 Deploying to Firebase..."
firebase deploy

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure environment variables if not done already"
echo "2. Set up YOLO model URL in Firebase Functions config:"
echo "   firebase functions:config:set yolo.model_url=\"https://your-model-url\""
echo "3. Test the endpoints using the documentation in YOLO_MIGRATION_DOCS.md"
echo ""
echo "🌐 Your app should be available at:"
echo "   https://your-project-id.web.app"