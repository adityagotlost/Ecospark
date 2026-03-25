import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const apiKey = envFile.split('\n').find(l => l.startsWith('VITE_GEMINI_API_KEY')).split('=')[1].trim().replace(/['"]/g, '');

const modelsToTest = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-1.0-pro"
];

async function run() {
  for (const m of modelsToTest) {
    try {
      const url = \`https://generativelanguage.googleapis.com/v1beta/models/\${m}:generateContent?key=\${apiKey}\`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
      });
      const data = await res.json();
      if (res.ok) {
        console.log("✅ WORKED:", m);
      } else {
        console.log("❌ FAILED:", m, res.status, data.error ? data.error.message.substring(0, 50) : 'Unknown');
      }
    } catch(e) {
      console.log("❌ CRASHED:", m, e.message);
    }
  }
}

run();
