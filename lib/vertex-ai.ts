import { GoogleGenAI } from '@google/genai';
import { connectDB } from '@/lib/mongodb';
import { TryonSession } from '@/models/TryonSession';
import { uploadImage } from '@/lib/cloudinary';
import fs from 'fs';
import path from 'path';

// Serverless Deployment Fix: Vercel does not allow uploading JSON files securely.
// If GOOGLE_CREDENTIALS (the raw JSON string) is provided in the environment variables,
// write it to a temporary file and point the SDK to it.
if (process.env.GOOGLE_CREDENTIALS) {
  const tmpKeyPath = path.join('/tmp', 'google-credentials.json');
  if (!fs.existsSync(tmpKeyPath)) {
    fs.writeFileSync(tmpKeyPath, process.env.GOOGLE_CREDENTIALS);
  }
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpKeyPath;
}

// Initialize the Google Gen AI SDK
// It automatically uses GOOGLE_APPLICATION_CREDENTIALS for authentication
const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

/**
 * Fetches an image from a URL and converts it to a Base64 string and MIME type.
 */
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  return {
    data: buffer.toString('base64'),
    mimeType,
  };
}

/**
 * Generates a virtual try-on image using Vertex AI's Gemini multimodal model.
 * 
 * @param sessionCode The unique session code for the try-on
 * @param personImageUrl URL of the person image
 * @param clothImageUrl URL of the clothing image
 */
export async function generateTryOnImage(
  sessionCode: string,
  personImageUrl: string,
  clothImageUrl: string
): Promise<void> {
  try {
    console.log(`[vertex-ai] Starting virtual try-on session ${sessionCode}`);
    
    // 1. Fetch images and convert to Base64
    const personImage = await fetchImageAsBase64(personImageUrl);
    const clothImage = await fetchImageAsBase64(clothImageUrl);

    // 2. Determine the model from environment (must be a virtual-try-on model)
    const modelName = process.env.VERTEX_AI_MODEL || 'virtual-try-on-001';

    // 3. Call the official Vertex AI Virtual Try-On endpoint
    console.log(`[vertex-ai] Calling ${modelName}...`);
    const response = await ai.models.recontextImage({
      model: modelName,
      source: {
        personImage: {
          imageBytes: personImage.data,
          mimeType: personImage.mimeType,
        },
        productImages: [
          {
            productImage: {
              imageBytes: clothImage.data,
              mimeType: clothImage.mimeType,
            },
          },
        ],
      },
      config: { 
        numberOfImages: 1,
        baseSteps: 75 // Higher sampling steps to strictly preserve the face, body figure, and fabric precision
      },
    });

    // 4. Extract the generated image Base64 bytes
    const base64Data = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64Data) {
      throw new Error('Vertex AI did not return generated image bytes in the response.');
    }

    // 5. Upload the generated Base64 image to Cloudinary
    console.log(`[vertex-ai] Image generated. Uploading to Cloudinary...`);
    const dataUri = `data:image/jpeg;base64,${base64Data}`;
    const date = new Date().toISOString().slice(0, 10);
    const { url: finalImageUrl } = await uploadImage(dataUri, `tryon-sessions/results/${date}`);

    // 6. Update the session in MongoDB
    console.log(`[vertex-ai] Updating MongoDB for session ${sessionCode}`);
    await connectDB();
    await TryonSession.findOneAndUpdate(
      { session_code: sessionCode },
      { status: 'done', result_image_url: finalImageUrl }
    );
    console.log(`[vertex-ai] Session ${sessionCode} completed successfully!`);

  } catch (err: any) {
    // 7. Comprehensive Error Logging
    console.error(`[vertex-ai] Failed to generate/update session ${sessionCode}:`);
    if (err.status) {
      console.error(`  -> Status Code: ${err.status}`);
      if (err.status === 400) console.error(`  -> Reason: INVALID_ARGUMENT. Check image formatting, size, or payload schema.`);
      if (err.status === 401) console.error(`  -> Reason: UNAUTHENTICATED. Service Account JSON is invalid or missing.`);
      if (err.status === 403) console.error(`  -> Reason: PERMISSION_DENIED. Missing IAM roles (Vertex AI User) or API not enabled.`);
      if (err.status === 404) console.error(`  -> Reason: NOT_FOUND. Model ${process.env.VERTEX_AI_MODEL} not found in this region or requires allowlisting.`);
      if (err.status === 429) console.error(`  -> Reason: QUOTA_EXCEEDED. You have hit your Vertex AI rate limits.`);
    }
    console.error(`  -> Details:`, err.message || err);
    
    // Fallback to a placeholder image if Vertex AI generation fails to prevent crashing the Kiosk
    try {
      await connectDB();
      const placeholder = `https://placehold.co/600x900/0A0A0A/3B82F6?text=Vertex+AI+Error`;
      await TryonSession.findOneAndUpdate(
        { session_code: sessionCode },
        { status: 'done', result_image_url: placeholder }
      );
      console.log(`[vertex-ai] Session ${sessionCode} saved with fallback error image.`);
    } catch (dbErr) {
      console.error(`[vertex-ai] Failed to update session ${sessionCode} to fallback status:`, dbErr);
    }
  }
}
