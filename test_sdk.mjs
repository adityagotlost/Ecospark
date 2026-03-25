import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const apiKey = envFile.split('\n').find(l => l.startsWith('VITE_GEMINI_API_KEY')).split('=')[1].trim().replace(/['"]/g, '');
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Test");
    console.log("✅ SUCCESS:", modelName, "->", result.response.text().slice(0, 10));
  } catch(e) {
    if (e.message.includes('429')) {
       console.log("❌ QUOTA 429:", modelName);
    } else if (e.message.includes('404')) {
       console.log("❌ NOT FOUND 404:", modelName);
    } else {
       console.error("❌ ERROR:", modelName, e.message);
    }
  }
}

async function run() {
  await testModel("gemini-1.5-flash-8b");
  await testModel("gemini-1.5-pro");
  // The error said `limit: 0` for gemini-2.0-flash, let's test gemini-1.5-flash too just in case SDK handles it differently now
  await testModel("gemini-1.5-flash");
}
run();
