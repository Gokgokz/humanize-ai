import test from 'node:test';
import assert from 'node:assert/strict';

import handler from '../api/humanize.js';

function createResponse() {
  const state = {
    headers: {},
    statusCode: null,
    body: undefined,
    ended: false
  };

  return {
    state,
    response: {
      setHeader(name, value) {
        state.headers[name] = value;
      },
      status(code) {
        state.statusCode = code;
        return this;
      },
      json(body) {
        state.body = body;
        return this;
      },
      end() {
        state.ended = true;
        return this;
      }
    }
  };
}

function setEnvironment(t, name, value) {
  const original = process.env[name];

  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }

  t.after(() => {
    if (original === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = original;
    }
  });
}

function mockSuccessfulFetch(t, expectedToken) {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, `Bearer ${expectedToken}`);

    const requestBody = JSON.parse(options.body);
    assert.equal(requestBody.messages[1].content, 'ข้อความทดสอบ');

    return {
      ok: true,
      async json() {
        return {
          choices: [{
            message: {
              content: JSON.stringify({
                humanized_text: 'ข้อความที่เรียบเรียงแล้ว',
                remaining_ai_score: 4
              })
            }
          }]
        };
      }
    };
  });
}

test('OPTIONS returns CORS headers without calling the provider', async () => {
  const { response, state } = createResponse();

  await handler({ method: 'OPTIONS' }, response);

  assert.equal(state.statusCode, 200);
  assert.equal(state.ended, true);
  assert.equal(state.headers['Access-Control-Allow-Methods'], 'POST, OPTIONS');
});

test('non-POST requests are rejected with an Allow header', async () => {
  const { response, state } = createResponse();

  await handler({ method: 'GET' }, response);

  assert.equal(state.statusCode, 405);
  assert.equal(state.headers.Allow, 'POST, OPTIONS');
  assert.equal(state.body.success, false);
});

test('missing request body is handled as a validation error', async () => {
  const { response, state } = createResponse();

  await handler({ method: 'POST' }, response);

  assert.equal(state.statusCode, 200);
  assert.equal(state.body.success, false);
  assert.match(state.body.error, /ไม่ได้รับข้อความต้นฉบับ/);
});

test('missing API keys returns a controlled error', async (t) => {
  setEnvironment(t, 'OPENROUTER_API_KEY', undefined);
  setEnvironment(t, 'GEMINI_API_KEY', undefined);
  const { response, state } = createResponse();

  await handler({
    method: 'POST',
    body: { text: 'ข้อความทดสอบ', tone: 'formal' }
  }, response);

  assert.equal(state.statusCode, 200);
  assert.equal(state.body.success, false);
  assert.match(state.body.error, /OPENROUTER_API_KEY/);
});

test('OPENROUTER_API_KEY is preferred for provider requests', async (t) => {
  setEnvironment(t, 'OPENROUTER_API_KEY', 'openrouter-test-key');
  setEnvironment(t, 'GEMINI_API_KEY', 'legacy-test-key');
  mockSuccessfulFetch(t, 'openrouter-test-key');
  const { response, state } = createResponse();

  await handler({
    method: 'POST',
    body: { text: 'ข้อความทดสอบ', tone: 'formal' }
  }, response);

  assert.equal(state.statusCode, 200);
  assert.equal(state.body.success, true);
  assert.equal(state.body.output, 'ข้อความที่เรียบเรียงแล้ว');
  assert.ok(state.body.aiScoreAfter >= 2 && state.body.aiScoreAfter <= 7);
});

test('GEMINI_API_KEY remains supported as a legacy fallback', async (t) => {
  setEnvironment(t, 'OPENROUTER_API_KEY', undefined);
  setEnvironment(t, 'GEMINI_API_KEY', 'legacy-test-key');
  mockSuccessfulFetch(t, 'legacy-test-key');
  const { response, state } = createResponse();

  await handler({
    method: 'POST',
    body: { text: 'ข้อความทดสอบ', tone: 'formal' }
  }, response);

  assert.equal(state.statusCode, 200);
  assert.equal(state.body.success, true);
});
