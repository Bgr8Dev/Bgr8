import test from 'node:test';
import assert from 'node:assert/strict';

const DEFAULT_CALCOM_SERVER = 'https://bgr8-cal-server.onrender.com';
const baseUrl = process.env.CALCOM_SERVER_BASE_URL || DEFAULT_CALCOM_SERVER;

test('cal.com proxy health endpoint responds', async () => {
  const response = await fetch(`${baseUrl}/`, { method: 'GET' });
  const bodyText = await response.text();
  assert.ok(response.ok, `Health check failed (${response.status}) ${bodyText || ''}`);
});

test('cal.com proxy authenticated token status responds', async (t) => {
  const token = process.env.CALCOM_SERVER_AUTH_TOKEN;
  if (!token) {
    t.skip('CALCOM_SERVER_AUTH_TOKEN not set');
    return;
  }

  const response = await fetch(`${baseUrl}/tokens/status`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const bodyText = await response.text();
  if (response.status === 404) {
    t.skip('tokens/status not available on deployed Cal.com server');
    return;
  }
  assert.ok(response.ok, `Auth status failed (${response.status}) ${bodyText || ''}`);
});
