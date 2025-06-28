import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_FUNCTION_BASE_URL = process.env.FIREBASE_FUNCTION_BASE_URL || 
  'http://localhost:5001/your-project-id/us-central1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${FIREBASE_FUNCTION_BASE_URL}/imageUpload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}