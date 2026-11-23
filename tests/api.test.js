import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import supertest from 'supertest';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'signal-room-test-'));
process.env.NODE_ENV = 'development';
process.env.DB_PATH = path.join(dataDir, 'chatbot.db');
process.env.JWT_SECRET = 'integration-test-secret-at-least-32-characters';
process.env.COOKIE_SECURE = 'false';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.ANTHROPIC_API_KEY = '';
process.env.ANTHROPIC_MODEL = '';

const [{ default: app }, { closeDatabase }] = await Promise.all([
  import('../server/src/app.js'),
  import('../server/src/db/index.js'),
]);

const api = supertest(app);
let agent;

before(async () => {
  agent = supertest.agent(app);
  await agent
    .post('/api/auth/register')
    .send({ email: 'integration@example.com', password: 'test-password-123' })
    .expect(201);
});
after(() => {
  closeDatabase();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

test('health endpoint is available', async () => {
  const response = await api.get('/healthz').expect(200);
  assert.equal(response.body.status, 'ok');
});

test('register and me expose the authenticated user', async () => {
  const session = supertest.agent(app);
  const registered = await session
    .post('/api/auth/register')
    .send({ email: 'owner@example.com', password: 'another-password-123' })
    .expect(201);

  assert.equal(registered.body.user.email, 'owner@example.com');

  const me = await session.get('/api/auth/me').expect(200);
  assert.equal(me.body.user.email, 'owner@example.com');
});

test('login rejects invalid credentials', async () => {
  await api
    .post('/api/auth/login')
    .send({ email: 'integration@example.com', password: 'wrong-password' })
    .expect(401)
    .expect(({ body }) => {
      assert.equal(body.error.code, 'INVALID_CREDENTIALS');
    });
});
test('protected routes reject unauthenticated requests', async () => {
  await api.get('/api/conversations').expect(401);
});

test('conversation CRUD validates ownership and persists updates', async () => {
  const created = await agent
    .post('/api/conversations')
    .send({ title: 'Integration thread', systemPrompt: 'Answer concisely.' })
    .expect(201);

  const conversationId = created.body.conversation.id;
  assert.equal(created.body.conversation.title, 'Integration thread');

  const updated = await agent
    .patch(`/api/conversations/${conversationId}`)
    .send({ title: 'Updated thread', systemPrompt: 'Use examples.' })
    .expect(200);

  assert.equal(updated.body.conversation.title, 'Updated thread');
  assert.equal(updated.body.conversation.systemPrompt, 'Use examples.');

  const messages = await agent
    .get(`/api/conversations/${conversationId}/messages`)
    .expect(200);
  assert.deepEqual(messages.body.messages, []);

  await agent.delete(`/api/conversations/${conversationId}`).expect(204);

  const conversations = await agent.get('/api/conversations').expect(200);
  assert.equal(conversations.body.conversations.some((item) => item.id === conversationId), false);
});

test('chat endpoint frames an SSE provider configuration error', async () => {
  const created = await agent
    .post('/api/conversations')
    .send({ title: 'SSE thread' })
    .expect(201);

  const response = await agent
    .post(`/api/conversations/${created.body.conversation.id}/chat`)
    .set('Accept', 'text/event-stream')
    .send({ message: 'Hello' })
    .expect(200);

  assert.match(response.headers['content-type'], /text\/event-stream/);
  assert.match(response.text, /event: start/);
  assert.match(response.text, /event: error/);
  assert.match(response.text, /AI_NOT_CONFIGURED/);
});

test('regenerate rejects a conversation without a complete exchange', async () => {
  const created = await agent
    .post('/api/conversations')
    .send({ title: 'Regenerate thread' })
    .expect(201);

  await agent
    .post(`/api/conversations/${created.body.conversation.id}/chat`)
    .send({ regenerate: true })
    .expect(400)
    .expect(({ body }) => {
      assert.equal(body.error.code, 'NOTHING_TO_REGENERATE');
    });
});
