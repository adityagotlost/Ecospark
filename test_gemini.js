import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const apiKey = envFile.split('\n').find(l => l.startsWith('VITE_GEMINI_API_KEY')).split('=')[1].trim().replace(/['"]/g, '');

const listModels = async () => {
  const url = \`https://generativelanguage.googleapis.com/v1beta/models?key=\${apiKey}\`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.models) {
    console.log(data.models.map(m => m.name).filter(n => n.includes('gemini')));
  } else {
    console.log(data);
  }
};
listModels();
