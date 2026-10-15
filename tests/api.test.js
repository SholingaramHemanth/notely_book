const test = require('node:test');
const assert = require('node:assert/strict');

const base = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function request(path, options) {
  const response = await fetch(`${base}${path}`, options);
  const body = await response.json();
  return { response, body };
}

test('health endpoint responds with service status', async () => {
  const { response, body } = await request('/api/health');
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, 'notely');
});

test('registration validates required fields before touching note routes', async () => {
  const { response, body } = await request('/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
  });
  assert.ok([422, 503].includes(response.status));
  assert.equal(body.ok, false);
});

test('notes endpoint is protected', async () => {
  const { response, body } = await request('/api/notes');
  assert.ok([401, 503].includes(response.status));
  assert.equal(body.ok, false);
});
