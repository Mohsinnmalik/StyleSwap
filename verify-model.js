const { GoogleGenAI } = require('@google/genai');

process.env.GOOGLE_APPLICATION_CREDENTIALS = "c:\\Users\\MOHSIN MALIK\\Desktop\\style swap\\astral-adapter-410023-b2be59d399b8.json";

const ai = new GoogleGenAI({
  vertexai: true,
  project: 'astral-adapter-410023',
  location: 'us-central1',
});

async function testModel(modelName) {
  try {
    console.log(`\nTesting ${modelName}...`);
    // Attempt standard multimodal generateContent with IMAGE output
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "A serene mountain lake at sunset with reflections",
      config: {
        responseModalities: ["IMAGE"],
      },
    });
    console.log(`✅ SUCCESS: ${modelName} returned successfully.`);
    if (response.candidates && response.candidates[0].content.parts[0].inlineData) {
      console.log(`   Returns image bytes? YES`);
    } else {
      console.log(`   Returns image bytes? NO (Text or other format returned)`);
    }
  } catch (error) {
    if (error.status === 404) {
      console.log(`❌ ERROR 404: ${modelName} NOT FOUND in this region/project.`);
    } else if (error.status === 403) {
      console.log(`❌ ERROR 403: Permission denied or model requires preview allowlisting for ${modelName}.`);
    } else {
      console.log(`❌ ERROR ${error.status || 'unknown'}: ${error.message}`);
    }
  }
}

async function testImagenGeneration(modelName) {
  try {
    console.log(`\nTesting Imagen Generate: ${modelName}...`);
    const response = await ai.models.generateImages({
      model: modelName,
      prompt: "A beautiful scenery",
      config: { numberOfImages: 1 }
    });
    console.log(`✅ SUCCESS: ${modelName} returned successfully using generateImages.`);
  } catch (error) {
     console.log(`❌ ERROR ${error.status || 'unknown'}: ${error.message}`);
  }
}

async function runTests() {
  await testModel('gemini-2.5-flash');
  await testModel('gemini-2.5-flash-image');
  await testModel('gemini-2.0-flash');
  await testModel('gemini-1.5-pro');
  
  await testImagenGeneration('imagen-3.0-generate-001');
  await testImagenGeneration('virtual-try-on');
  await testImagenGeneration('virtual-try-on-001');
}

runTests();
