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
      env: process.env,
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
      const token = stdout.trim();
      if (!token) {
        reject(new Error('Token helper returned an empty token.'));
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
      CALCOM_SERVER_AUTH_TOKEN: token
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
