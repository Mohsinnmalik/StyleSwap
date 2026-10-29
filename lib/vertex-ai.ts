import { GoogleGenAI } from '@google/genai';
import { connectDB } from '@/lib/mongodb';
import { TryonSession, IAttireCloth } from '@/models/TryonSession';
import { uploadImage } from '@/lib/cloudinary';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Serverless Deployment Fix: Vercel credentials handling
if (process.env.GOOGLE_CREDENTIALS) {
  const tmpKeyPath = path.join(os.tmpdir(), 'google-credentials.json');
  fs.writeFileSync(tmpKeyPath, process.env.GOOGLE_CREDENTIALS);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpKeyPath;
}

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

// Virtual Try-On generation settings
// Higher diffusion baseSteps prioritize micro-texture and fabric detail at higher processing latency.
// Adjust this value (e.g., 32-120) if tuning the latency vs quality trade-off in the future.
const VTO_BASE_STEPS = 120;

function detectMimeType(buffer: Buffer, headerMime?: string | null): string {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  const cleanHeader = (headerMime || '').split(';')[0].trim().toLowerCase();
  if (cleanHeader === 'image/png' || cleanHeader === 'image/jpeg') {
    return cleanHeader;
  }
  return 'image/jpeg';
}

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  if (url.startsWith('/')) {
    const filePath = path.join(process.cwd(), 'public', url);
    const buffer = fs.readFileSync(filePath);
    const mimeType = detectMimeType(buffer);
    
    return {
      data: buffer.toString('base64'),
      mimeType,
    };
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url} (status: ${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = detectMimeType(buffer, response.headers.get('content-type'));
  return {
    data: buffer.toString('base64'),
    mimeType,
  };
}

/**
 * Generates a virtual try-on image using Vertex AI's virtual-try-on-001 model
 * with optimal diffusion steps, lossless PNG output, and faithful fabric rendering.
 */
export async function generateTryOnImage(
  sessionCode: string,
  personImageUrl: string,
  clothImageUrls: string[]
): Promise<void> {
  const startTime = Date.now();
  console.log(`[vertex-ai-vto] [DIAGNOSTIC LOG] Session: ${sessionCode} | Type: normal_vto | PersonURL: ${personImageUrl} | Items: ${clothImageUrls.length}`);
  
  try {
    const personImage = await fetchImageAsBase64(personImageUrl);
    const modelName = process.env.VERTEX_AI_MODEL || 'virtual-try-on-001';

    const finalImageUrls: string[] = [];

    // Execute sequentially to respect Vertex AI concurrency limits and avoid 500 INTERNAL collisions
    for (let idx = 0; idx < clothImageUrls.length; idx++) {
      const clothUrl = clothImageUrls[idx];
      console.log(`[vertex-ai-vto] Item ${idx + 1}/${clothImageUrls.length}: Fetching ${clothUrl}`);
      const clothImage = await fetchImageAsBase64(clothUrl);
      console.log(`[vertex-ai-vto] Calling ${modelName} for item ${idx + 1}...`);

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
          baseSteps: VTO_BASE_STEPS,
          outputMimeType: 'image/png',
        },
      });

      const base64Data = response.generatedImages?.[0]?.image?.imageBytes;
      if (!base64Data) throw new Error('Vertex AI did not return generated image bytes.');

      const outputMime = response.generatedImages?.[0]?.image?.mimeType || 'image/png';
      const dataUri = `data:${outputMime};base64,${base64Data}`;
      const date = new Date().toISOString().slice(0, 10);
      const { url: finalImageUrl } = await uploadImage(dataUri, `tryon-sessions/results/${date}`);
      finalImageUrls.push(finalImageUrl);
    }

    console.log(`[vertex-ai-vto] Session ${sessionCode} success in ${Date.now() - startTime}ms. Updating MongoDB.`);
    await connectDB();
    await TryonSession.findOneAndUpdate(
      { session_code: sessionCode },
      { status: 'done', result_image_url: finalImageUrls.join(',') }
    );

  } catch (err: any) {
    console.error(`[vertex-ai-vto] Session ${sessionCode} FAILED in ${Date.now() - startTime}ms:`, err.message || err);
    try {
      await connectDB();
      await TryonSession.findOneAndUpdate(
        { session_code: sessionCode },
        { status: 'error' }
      );
    } catch (dbErr) {
      console.error(`[vertex-ai-vto] Session ${sessionCode} failed DB status update:`, dbErr);
    }
  }
}

/**
 * Generates a full multi-cloth custom attire visualization in a SINGLE coherent pass.
 */
export async function generateAttireImage(
  sessionCode: string,
  personImageUrl: string,
  clothes: IAttireCloth[],
  inferredAttire?: string | null
): Promise<void> {
  const startTime = Date.now();
  console.log(`[vertex-ai-attire] [DIAGNOSTIC LOG] Session: ${sessionCode} | Type: attire_design | PersonURL: ${personImageUrl} | ClothesCount: ${clothes.length} | InferredAttire: ${inferredAttire || 'Custom Attire'}`);
  
  clothes.forEach((c, i) => {
    console.log(`[vertex-ai-attire]   Reference ${i + 1}: Role=${c.normalized_role} | UserText="${c.user_instruction}" | RawFabric=${c.is_raw_fabric} | ImageURL=${c.image_url}`);
  });

  try {
    const modelName = process.env.VERTEX_AI_ATTIRE_MODEL || 'gemini-2.5-flash-image';

    // 1. Fetch ORIGINAL uploaded customer person image as Base64 (IMMUTABLE IDENTITY SOURCE)
    const personImage = await fetchImageAsBase64(personImageUrl);

    // 2. Fetch all selected cloth/fabric reference images as Base64
    const clothBase64s = await Promise.all(
      clothes.map((c) => fetchImageAsBase64(c.image_url))
    );

    // 3. Formulate structured semantic prompt
    const attireTitle = inferredAttire || 'Custom Attire';
    let promptText = `STRICT FASHION EDITORIAL INSTRUCTIONS - IDENTITY PRESERVATION & ATTIRE SYNTHESIS\n\n`;
    promptText += `IMAGE 1 IS THE IMMUTABLE CUSTOMER IDENTITY REFERENCE.\n`;
    promptText += `- The person in Image 1 is the customer.\n`;
    promptText += `- MANDATE: Preserve the customer's identity as closely as technically possible. The customer's uploaded photograph is the highest-priority identity reference. The customer's face, facial structure, skin tone, hair, apparent age, and overall physical identity must remain as faithful as technically possible.\n`;
    promptText += `- DO NOT invent a new face. DO NOT replace the person in Image 1. NEVER use the face/identity of a catalogue model or mannequin. NEVER beautify or redesign the customer's face.\n\n`;
    promptText += `THE REMAINING IMAGES ARE CLOTHING/MATERIAL REFERENCES ONLY:\n`;

    clothes.forEach((c, idx) => {
      const refNum = idx + 2; // Image 1 is person
      const itemType = c.is_raw_fabric ? 'RAW FABRIC MATERIAL SWATCH' : 'FINISHED GARMENT REFERENCE';
      const userGoal = c.user_instruction || c.normalized_role;
      
      promptText += `\nIMAGE ${refNum} (${itemType}):`;
      if (c.name) promptText += ` Product: "${c.name}".`;
      promptText += ` Declared Garment Purpose: "${userGoal}" (Assigned Role: "${c.normalized_role}").`;
      if (c.is_raw_fabric) {
        promptText += `\n  - MATERIAL ONLY RULE: Image ${refNum} is a raw fabric swatch. Treat it purely as a material reference (color, texture, weave, pattern, embroidery, material characteristics).`;
        promptText += `\n  - CONSTRUCTION: Construct the garment requested by the customer. Use the fabric as the material reference and create a ${c.normalized_role} on the ORIGINAL CUSTOMER. Do NOT treat the raw fabric image as a finished garment.`;
      } else {
        promptText += `\n  - GARMENT REFERENCE RULE: Image ${refNum} is a finished garment. Apply this exact ${c.normalized_role} garment to the customer.`;
        promptText += `\n  - SOURCE OF TRUTH: Preserve as closely as technically possible the color, pattern, texture, material appearance, silhouette, cut, collar, sleeves, buttons, embroidery, lapels, length, and construction details. Do not silently substitute another garment.`;
        promptText += `\n  - MODEL IGNORANCE: If Image ${refNum} contains a model or mannequin, IGNORE THE MODEL/FACE ENTIRELY - extract only the clothing item.`;
      }
    });

    promptText += `\n\nCOMPOSITION & RENDER MANDATES:
1. CUSTOMER IDENTITY & FACE: The output photo MUST feature the SAME CUSTOMER as Image 1 with faithful facial features, skin tone, and hair.
2. BODY STRUCTURE & FIT: Retain the customer's natural body structure and produce garments that physically fit that body. Preserve realistic shoulder placement, neck position, torso length, waist, hips, arms, hands, legs, sleeve length, garment overlap, natural folds, fabric tension, and occlusion.
3. AVOID DISTORTION: Avoid distorted anatomy, extra/missing limbs, floating garments, garments clipping through the body, incorrect waist placement, impossible proportions, and generic fashion-model replacement. Do not unnecessarily change the customer's pose.
4. NO INVENTED GARMENTS OR COLOR DRIFT: Use ONLY the supplied garment/fabric references for their assigned roles. Do not change colors or add unrequested clothing items.
5. PHOTOREALISM: Target a believable photograph of the SAME CUSTOMER wearing the selected attire. Prioritize natural skin, realistic fabric folds, natural garment tension, correct lighting and shadows, and realistic depth. Avoid plastic skin, AI faces, CGI appearance, or excessive beautification.
6. FULL-BODY PORTRAIT: Output exactly ONE photorealistic, studio-grade full-body fashion portrait of the customer in Image 1 wearing the complete designed attire: "${attireTitle}".`;

    // 4. Formulate multimodal request parts
    const contentsParts: any[] = [
      {
        inlineData: {
          mimeType: personImage.mimeType,
          data: personImage.data,
        },
      },
    ];

    clothBase64s.forEach((cb) => {
      contentsParts.push({
        inlineData: {
          mimeType: cb.mimeType,
          data: cb.data,
        },
      });
    });

    contentsParts.push({ text: promptText });

    console.log(`[vertex-ai-attire] Calling ${modelName} with ${contentsParts.length} parts (1 person + ${clothBase64s.length} garments + 1 prompt text)...`);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contentsParts,
    });

    const candidate = response.candidates?.[0];
    let base64Data: string | undefined = undefined;

    let outputMime = 'image/png';

    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          base64Data = part.inlineData.data;
          outputMime = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }

    if (!base64Data) {
      console.error('[vertex-ai-attire] Model response did not contain image bytes:', JSON.stringify(response));
      throw new Error('Gemini model did not return image bytes for attire design.');
    }

    const dataUri = `data:${outputMime};base64,${base64Data}`;
    const date = new Date().toISOString().slice(0, 10);
    const { url: finalImageUrl } = await uploadImage(dataUri, `tryon-sessions/results/${date}`);

    console.log(`[vertex-ai-attire] Attire generation SUCCESS for session ${sessionCode} in ${Date.now() - startTime}ms. Result URL: ${finalImageUrl}`);

    await connectDB();
    await TryonSession.findOneAndUpdate(
      { session_code: sessionCode },
      { status: 'done', result_image_url: finalImageUrl }
    );

  } catch (err: any) {
    console.error(`[vertex-ai-attire] Attire generation FAILED for session ${sessionCode} in ${Date.now() - startTime}ms:`, err.message || err);
    try {
      await connectDB();
      await TryonSession.findOneAndUpdate(
        { session_code: sessionCode },
        { status: 'error' }
      );
    } catch (dbErr) {
      console.error(`[vertex-ai-attire] Failed to update session ${sessionCode} to error status:`, dbErr);
    }
  }
}
