import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const testDir = path.join(rootDir, 'test');

const files = fs.readdirSync(testDir).filter(f => f.endsWith('.mjs') && !f.includes('cdp') && !f.includes('headless') && f !== 'run_all_tests.mjs');

let total = 0;
let passed = 0;
let failed = 0;

const agyNode = 'C:\\Users\\cinth\\AppData\\Roaming\\Antigravity\\bin\\agy-node.cmd';

console.log('===============================================================');
console.log('🧪 RUNNING ALL NON-CDP SUITES IN REPOSITORY');
console.log('===============================================================\n');

for (const f of files) {
  process.stdout.write(`• Testing ${f.padEnd(45)} ... `);
  try {
    const out = execSync(`"${agyNode}" "${path.join(testDir, f)}"`, { stdio: 'pipe', encoding: 'utf8' });
    console.log('✓ PASS');
    passed++;
  } catch (err) {
    console.log('❌ FAIL');
    console.error(err.stdout || err.stderr || err.message);
    failed++;
  }
  total++;
}

console.log('\n===============================================================');
console.log(`📊 MASTER TEST RESULTS: ${passed}/${total} Suites Passed (${failed} Failed)`);
console.log('===============================================================');
if (failed > 0) process.exit(1);
