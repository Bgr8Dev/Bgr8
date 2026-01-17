import test from 'node:test';
import assert from 'node:assert/strict';

const DEFAULT_CALCOM_SERVER = 'https://bgr8-cal-server.onrender.com';
const baseUrl = process.env.CALCOM_SERVER_BASE_URL || DEFAULT_CALCOM_SERVER;
const authToken = process.env.CALCOM_SERVER_AUTH_TOKEN;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${authToken}`
});

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
    t.skip('CALCOM_SERVER_AUTH_TOKEN not set');
    return false;
  }
  return true;
};

test('cal.com proxy health endpoint responds', async () => {
  const response = await fetch(`${baseUrl}/`, { method: 'GET' });
  const bodyText = await response.text();
  assert.ok(response.ok, `Health check failed (${response.status}) ${bodyText || ''}`);
});

test('cal.com proxy authenticated token status responds', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/tokens/status`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (response.status === 404) {
    t.skip('tokens/status not available on deployed Cal.com server');
    return;
  }
  assert.ok(response.ok, `Auth status failed (${response.status}) ${JSON.stringify(body)}`);
});

test('cal.com proxy token store validates payload', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/tokens`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ apiKey: '' })
  });
  assert.equal(response.status, 400, `Expected 400 for invalid payload, got ${response.status} ${JSON.stringify(body)}`);
});

test('cal.com proxy bookings cancel validates payload', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/calcom/bookings/cancel`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  assert.equal(response.status, 400, `Expected 400 for missing bookingId, got ${response.status} ${JSON.stringify(body)}`);
});

test('cal.com proxy availability validates payload', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/calcom/availability`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  assert.equal(response.status, 400, `Expected 400 for missing dates, got ${response.status} ${JSON.stringify(body)}`);
});

test('cal.com proxy booking create validates payload', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/calcom/bookings`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  assert.equal(response.status, 400, `Expected 400 for missing bookingRequest, got ${response.status} ${JSON.stringify(body)}`);
});

test('cal.com proxy event-types responds when token configured', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/calcom/event-types`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (response.status === 500 && body?.error === 'Cal.com token not configured') {
    t.skip('Cal.com token not configured for test user');
    return;
  }
  assert.ok(response.ok, `Event-types failed (${response.status}) ${JSON.stringify(body)}`);
});

test('cal.com proxy schedules responds when token configured', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/calcom/schedules`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (response.status === 500 && body?.error === 'Cal.com token not configured') {
    t.skip('Cal.com token not configured for test user');
    return;
  }
  assert.ok(response.ok, `Schedules failed (${response.status}) ${JSON.stringify(body)}`);
});

test('cal.com proxy bookings list responds when token configured', async (t) => {
  if (!requireAuthToken(t)) return;
  const { response, body } = await fetchJson(`${baseUrl}/calcom/bookings/list`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({})
  });
  if (response.status === 500 && body?.error === 'Cal.com token not configured') {
    t.skip('Cal.com token not configured for test user');
    return;
  }
  assert.ok(response.ok, `Bookings list failed (${response.status}) ${JSON.stringify(body)}`);
});
