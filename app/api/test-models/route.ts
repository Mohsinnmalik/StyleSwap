import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// Diagnostic route: fires billable Vertex AI calls, so it is restricted to
// logged-in shop owners.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    return NextResponse.json({ error: 'GOOGLE_CLOUD_PROJECT is not configured.' }, { status: 500 });
  }

  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  });

  const results: any[] = [];

  const testModel = async (modelName: string) => {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: "A serene mountain lake",
        config: { responseModalities: ["IMAGE"] },
      });
      const hasImage = !!(response.candidates?.[0]?.content?.parts?.[0]?.inlineData);
      results.push({ model: modelName, status: 'SUCCESS', hasImageBytes: hasImage });
    } catch (error: any) {
      results.push({ model: modelName, status: `ERROR: ${error.status || 'unknown'}` });
    }
  };

  const testImagen = async (modelName: string) => {
    try {
      await ai.models.generateImages({
        model: modelName,
        prompt: "A beautiful scenery",
        config: { numberOfImages: 1 }
      });
      results.push({ model: modelName, status: 'SUCCESS (generateImages)', hasImageBytes: true });
    } catch (error: any) {
      results.push({ model: modelName, status: `ERROR: ${error.status || 'unknown'}` });
    }
  };

  await testModel('gemini-2.5-flash');
  await testModel('gemini-2.5-flash-image');
  await testModel('gemini-2.0-flash');
  await testModel('gemini-1.5-pro');

  await testImagen('imagen-3.0-generate-001');
  await testImagen('virtual-try-on');
  await testImagen('virtual-try-on-001');

  return NextResponse.json({ results });
}
