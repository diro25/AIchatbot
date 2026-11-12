import { db } from './index.js';

const publicUser = (row) => row && ({ id: row.id, email: row.email, createdAt: row.created_at });
const mapConversation = (row) => row && ({
  id: row.id,
  title: row.title,
  systemPrompt: row.system_prompt,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const mapMessage = (row) => row && ({
  id: row.id,
  conversationId: row.conversation_id,
  role: row.role,
  content: row.content,
  createdAt: row.created_at,
});

export function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function createUser({ email, passwordHash }) {
  const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, passwordHash);
  return findUserById(result.lastInsertRowid);
}

export function listConversations(userId) {
  return db.prepare(`
    SELECT c.*, (
      SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1
    ) AS last_message
    FROM conversations c
    WHERE c.user_id = ?
    ORDER BY c.updated_at DESC, c.id DESC
  `).all(userId).map((row) => ({ ...mapConversation(row), lastMessage: row.last_message || '' }));
}

export function findConversationByIdForUser(id, userId) {
  return mapConversation(db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(id, userId));
}

export function createConversation({ userId, title = 'New conversation', systemPrompt = '' }) {
  const result = db.prepare(
    'INSERT INTO conversations (user_id, title, system_prompt) VALUES (?, ?, ?)',
  ).run(userId, title, systemPrompt);
  return findConversationByIdForUser(result.lastInsertRowid, userId);
}

export function updateConversation(id, userId, { title, systemPrompt }) {
  const existing = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) return null;
  const nextTitle = title ?? existing.title;
  const nextPrompt = systemPrompt ?? existing.system_prompt;
  db.prepare(`
    UPDATE conversations
    SET title = ?, system_prompt = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(nextTitle, nextPrompt, id, userId);
  return findConversationByIdForUser(id, userId);
}

export function deleteConversation(id, userId) {
  return db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
}

export function listMessages(conversationId) {
  return db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC',
  ).all(conversationId).map(mapMessage);
}

export function insertMessage({ conversationId, role, content }) {
  const result = db.prepare(
    'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
  ).run(conversationId, role, content);
  db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);
  return mapMessage(db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid));
}

export function deleteMessage(messageId, conversationId) {
  db.prepare('DELETE FROM messages WHERE id = ? AND conversation_id = ?').run(messageId, conversationId);
}

export function getLastMessage(conversationId) {
  return mapMessage(db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC, id DESC LIMIT 1',
  ).get(conversationId));
}

export { publicUser, mapConversation, mapMessage };
