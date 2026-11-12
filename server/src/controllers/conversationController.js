import { AppError } from '../utils/errors.js';
import {
  createConversation,
  deleteConversation,
  findConversationByIdForUser,
  listConversations,
  listMessages,
  updateConversation,
} from '../db/queries.js';

function ownedConversation(req) {
  const conversation = findConversationByIdForUser(req.params.id, req.user.id);
  if (!conversation) throw new AppError(404, 'Conversation not found.', 'CONVERSATION_NOT_FOUND');
  return conversation;
}

export function getConversations(req, res) {
  res.json({ conversations: listConversations(req.user.id) });
}

export function postConversation(req, res) {
  const conversation = createConversation({
    userId: req.user.id,
    title: req.body.title || 'New conversation',
    systemPrompt: req.body.systemPrompt || '',
  });
  res.status(201).json({ conversation });
}

export function patchConversation(req, res) {
  ownedConversation(req);
  const conversation = updateConversation(req.params.id, req.user.id, req.body);
  res.json({ conversation });
}

export function removeConversation(req, res) {
  ownedConversation(req);
  deleteConversation(req.params.id, req.user.id);
  res.status(204).end();
}

export function getMessages(req, res) {
  ownedConversation(req);
  res.json({ messages: listMessages(req.params.id) });
}
