This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## YOLO AI Integration

This project includes YOLO (You Only Look Once) object detection capabilities implemented as Firebase Functions. The integration provides:

- Real-time object detection on uploaded images
- Image management and storage
- Batch processing capabilities
- RESTful API endpoints for integration

### YOLO Features

- **Object Detection**: Detect and classify objects in images
- **Image Upload**: Handle image uploads with automatic storage
- **Batch Processing**: Process multiple images simultaneously
- **Model Management**: Load and manage YOLO models efficiently
- **Results Storage**: Save detection results and processed images

See [YOLO_MIGRATION_DOCS.md](./YOLO_MIGRATION_DOCS.md) for detailed API documentation.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Firebase Functions Deployment

### Build and Deploy Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### Deploy Specific Function

```bash
firebase deploy --only functions:yoloInference
firebase deploy --only functions:imageUpload
```

### Local Development

```bash
# Start Firebase emulators
firebase emulators:start --only functions

# In another terminal, start Next.js dev server
npm run dev
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
FIREBASE_FUNCTION_BASE_URL=http://localhost:5001/your-project-id/us-central1
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

