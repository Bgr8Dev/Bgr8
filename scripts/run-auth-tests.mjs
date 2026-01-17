import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const requiredVars = ['FIREBASE_API_KEY', 'FIREBASE_AUTH_EMAIL', 'FIREBASE_AUTH_PASSWORD'];
const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  process.stderr.write(`Missing env vars: ${missing.join(', ')}\n`);
  process.exit(1);
}

const runGetToken = () =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/get-id-token.mjs'], {
      env: { ...process.env, CALLED_FROM_SCRIPT: 'true' },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Token helper exited with code ${code}`));
        return;
      }
      // Clean the token - get the last line (token should be on its own line)
      // Split by newlines and filter out empty lines
      const lines = stdout.split(/\r?\n/).filter(line => line.trim().length > 0);
      // JWT tokens are typically very long (500+ chars) and contain only base64url characters
      // Find the line that looks like a JWT token (contains dots and is long)
      let token = lines.find(line => {
        const trimmed = line.trim();
        // JWT format: header.payload.signature (3 parts separated by dots)
        return trimmed.includes('.') && 
               trimmed.length > 100 && 
               /^[A-Za-z0-9_\-=.]+$/.test(trimmed);
      });
      
      // Fallback: if no token found, use the last non-empty line
      if (!token && lines.length > 0) {
        token = lines[lines.length - 1].trim();
      }
      
      // Final cleanup: trim whitespace only
      token = token?.trim();
      
      if (!token || token.length < 100) {
        reject(new Error(`Token helper returned an invalid token. Expected JWT, got: ${token?.substring(0, 50) || 'empty'}`));
        return;
      }
      resolve(token);
    });
  });

const getTestFiles = async () => {
  const testDir = join(process.cwd(), 'tests', 'server');
  const entries = await readdir(testDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.test.mjs'))
    .map((entry) => join(testDir, entry.name));
};

const runTests = (token, testFiles) =>
  new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      EMAIL_SERVER_AUTH_TOKEN: token,
      CALCOM_SERVER_AUTH_TOKEN: token,
      FIREBASE_SERVER_AUTH_TOKEN: token
    };

    const child = spawn(process.execPath, ['--test', ...testFiles], {
      env,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Tests exited with code ${code}`));
        return;
      }
      resolve();
    });
  });

const main = async () => {
  try {
    const token = await runGetToken();
    const testFiles = await getTestFiles();
    if (testFiles.length === 0) {
      throw new Error('No server test files found.');
    }
    await runTests(token, testFiles);
  } catch (error) {
    process.stderr.write(`Auth tests failed: ${error.message || error}\n`);
    process.exit(1);
  }
};

main();
