import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ai = new GoogleGenAI({
    vertexai: true,
    project: 'astral-adapter-410023',
    location: 'us-central1',
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
      results.push({ model: modelName, status: `ERROR: ${error.status || 'unknown'}`, message: error.message });
    }
  };

  const testImagen = async (modelName: string) => {
    try {
      const response = await ai.models.generateImages({
        model: modelName,
        prompt: "A beautiful scenery",
        config: { numberOfImages: 1 }
      });
      results.push({ model: modelName, status: 'SUCCESS (generateImages)', hasImageBytes: true });
    } catch (error: any) {
      results.push({ model: modelName, status: `ERROR: ${error.status || 'unknown'}`, message: error.message });
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
