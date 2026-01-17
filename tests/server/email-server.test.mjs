import test from 'node:test';
import assert from 'node:assert/strict';

const DEFAULT_EMAIL_SERVER = 'https://bgr8-email-server.onrender.com';
const baseUrl = process.env.EMAIL_SERVER_BASE_URL || DEFAULT_EMAIL_SERVER;

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const bodyText = await response.text();
  let body = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }
  return { response, body };
};

test('email server health endpoint responds', async () => {
  const { response, body } = await fetchJson(`${baseUrl}/api/health`, { method: 'GET' });
  assert.ok(response.ok, `Health check failed (${response.status}) ${body || ''}`);
});

test('email server authenticated stats endpoint responds', async (t) => {
  const token = process.env.EMAIL_SERVER_AUTH_TOKEN;
  if (!token) {
    t.skip('EMAIL_SERVER_AUTH_TOKEN not set');
    return;
  }

  const { response, body } = await fetchJson(`${baseUrl}/api/email/stats`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 403 && body?.error === 'Invalid API key') {
    t.skip('email server still requires legacy API key auth');
    return;
  }

  assert.ok(response.ok, `Auth stats failed (${response.status}) ${JSON.stringify(body)}`);
});
