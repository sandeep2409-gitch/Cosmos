/**
 * COSMOS Segment 7 — AI Endpoint Test Script
 * Run: node test-ai.js
 */

const BASE = 'http://localhost:5001/api/v1';

async function post(body) {
  const res = await fetch(`${BASE}/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function runTests() {
  console.log('\n[AI] COSMOS AI Endpoint Test Suite\n' + '='.repeat(48));

  const tests = [
    // Valid objects
    { objectId: 'earth',         mode: 'beginner',  desc: 'Earth — Beginner' },
    { objectId: 'moon',          mode: 'student',   desc: 'Moon — Student' },
    { objectId: 'europa',        mode: 'deepdive',  desc: 'Europa — Deep Dive' },
    { objectId: 'aryabhata',     mode: 'beginner',  desc: 'Aryabhata — Beginner' },
    { objectId: 'aditya-l1',     mode: 'student',   desc: 'Aditya-L1 — Student' },
    { objectId: 'james-webb',    mode: 'deepdive',  desc: 'JWST — Deep Dive' },
    { objectId: 'chandrayaan-1', mode: 'student',   desc: 'Chandrayaan-1 — Student' },
    // Custom question
    { objectId: 'europa', mode: 'beginner', question: 'Why does Europa interest scientists?', desc: 'Europa — Custom Question' },
    // Error cases
    { objectId: '',              mode: 'beginner',  desc: 'ERROR: Empty objectId' },
    { objectId: 'invalid-xyz',   mode: 'beginner',  desc: 'ERROR: Non-existent object' },
    { objectId: 'earth',         mode: 'invalid',   desc: 'Fallback mode: invalid → beginner' },
  ];

  for (const t of tests) {
    process.stdout.write(`\n> ${t.desc}... `);
    try {
      const start = Date.now();
      const result = await post(t);
      const ms = Date.now() - start;

      if (result.success) {
        const preview = result.explanation.substring(0, 80).replace(/\n/g, ' ');
        console.log(`[OK] [${ms}ms] [cached:${result.cached}]\n  "${preview}..."`);
      } else {
        console.log(`[WARN] SOFT FAIL [${ms}ms] code:${result.errorCode}\n  ${result.error}`);
      }
    } catch (err) {
      console.log(`[ERROR] NETWORK ERROR: ${err.message}`);
    }
  }

  // Security check — verify no API key in response
  console.log('\n\n[SECURITY] Security Check');
  const r = await post({ objectId: 'earth', mode: 'beginner' });
  const json = JSON.stringify(r);
  const hasKey = json.includes('AI_API_KEY') || json.includes('Bearer') || json.includes('AQ.');
  console.log(hasKey ? '[FAIL] FAIL: API key found in response!' : '[PASS] PASS: No API key in response');

  console.log('\n' + '='.repeat(48) + '\n[COMPLETE] Test suite complete.\n');
}

runTests().catch(console.error);
