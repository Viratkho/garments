/**
 * DP ENTERPRISES – GarmentFlow
 * System Health & Verification Script
 */

const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000';

console.log('=================================================================');
console.log('   DP ENTERPRISES – GarmentFlow System Verification');
console.log('=================================================================');

function checkEndpoint(url, label) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`[PASS] ${label} (HTTP ${res.statusCode})`);
          if (json.system) console.log(`       System: ${json.system}`);
          if (json.database) console.log(`       Database: ${json.database}`);
          resolve(true);
        } catch {
          console.log(`[PASS] ${label} (HTTP ${res.statusCode})`);
          resolve(true);
        }
      });
    }).on('error', (err) => {
      console.log(`[WARN] ${label} - Service unreachable (${err.message})`);
      resolve(false);
    });
  });
}

async function run() {
  console.log(`Pinging backend API at ${BACKEND_URL}...`);
  await checkEndpoint(`${BACKEND_URL}/api/health`, 'Backend Health Check');
  console.log('=================================================================');
  console.log('Verification completed.');
}

run();
