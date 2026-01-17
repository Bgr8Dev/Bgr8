import test from 'node:test';
import assert from 'node:assert/strict';

const DEFAULT_EMAIL_SERVER = 'https://bgr8-email-server.onrender.com';
const baseUrl = process.env.EMAIL_SERVER_BASE_URL || DEFAULT_EMAIL_SERVER;
const authToken = process.env.EMAIL_SERVER_AUTH_TOKEN;

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

const requireAuthToken = (t) => {
  if (!authToken) {
    t.skip('EMAIL_SERVER_AUTH_TOKEN not set');
    return false;
  }
  return true;
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${authToken}`
});

test('email server health endpoint responds', async () => {
  const { response, body } = await fetchJson(`${baseUrl}/api/health`, { method: 'GET' });
  assert.ok(response.ok, `Health check failed (${response.status}) ${body || ''}`);
});

test('email server config-test endpoint responds', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/api/config-test`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  assert.ok(response.ok, `Config test failed (${response.status}) ${JSON.stringify(body)}`);
});

test('email server zoho-test endpoint responds', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/api/zoho-test`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  assert.ok(response.ok, `Zoho test failed (${response.status}) ${JSON.stringify(body)}`);
});

test('email server test endpoint responds', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/api/email/test`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  assert.ok(response.ok, `Email test failed (${response.status}) ${JSON.stringify(body)}`);
});

test('email server send endpoint validates payload', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/api/email/send`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ subject: '', content: '' })
  });
  assert.equal(response.status, 400, `Expected 400 for invalid payload, got ${response.status} ${JSON.stringify(body)}`);
});

test('email server send-bulk endpoint validates payload', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/api/email/send-bulk`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages: [] })
  });
  assert.equal(response.status, 400, `Expected 400 for invalid payload, got ${response.status} ${JSON.stringify(body)}`);
});

test('email server webhook endpoint accepts non-booking event', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/api/webhooks/calcom`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: 'ping' })
  });
  assert.ok(response.ok, `Webhook ping failed (${response.status}) ${JSON.stringify(body)}`);
});

test('email server delete user rejects invalid uid', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/api/users/delete/invalid uid`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  assert.equal(response.status, 400, `Expected 400 for invalid uid, got ${response.status} ${JSON.stringify(body)}`);
});

test('email server authenticated stats endpoint responds', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/api/email/stats`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (response.status === 403 && body?.error === 'Admin access required.') {
    t.skip('email stats requires admin user');
    return;
  }

  assert.ok(response.ok, `Auth stats failed (${response.status}) ${JSON.stringify(body)}`);
});
