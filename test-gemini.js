import dotenv from 'dotenv';
dotenv.config();

const key = process.env.AI_API_KEY;
if (!key) {
  console.log('No key');
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`;

async function run() {
  console.log(`Fetching from: ${url.replace(/key=[^&]+/, 'key=***')}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }]
      })
    });
    console.log(`Status: ${res.status}`);
    const json = await res.json();
    console.log(json.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error(err);
  }
}
run();
