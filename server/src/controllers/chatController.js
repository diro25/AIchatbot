import {
  deleteMessage,
  findConversationByIdForUser,
  getLastMessage,
  insertMessage,
  listMessages,
} from '../db/queries.js';
import { streamAssistantReply } from '../services/anthropicService.js';
import { trimHistory } from '../utils/history.js';
import { AppError } from '../utils/errors.js';

const activeConversations = new Set();

function sendEvent(res, event, data) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function chat(req, res, next) {
  const conversation = findConversationByIdForUser(req.params.id, req.user.id);
  if (!conversation) return next(new AppError(404, 'Conversation not found.', 'CONVERSATION_NOT_FOUND'));
  if (activeConversations.has(conversation.id)) {
    return next(new AppError(409, 'This conversation is already generating a response.', 'GENERATION_IN_PROGRESS'));
  }

  activeConversations.add(conversation.id);
  let responseFinished = false;
  let clientClosed = false;
  const abortController = new AbortController();
  const handleClose = () => {
    if (!responseFinished) {
      clientClosed = true;
      abortController.abort();
    }
  };

  try {
    let history = listMessages(conversation.id);
    const { message, regenerate } = req.body;
    let prompt = message?.trim() || '';

    if (regenerate) {
      const last = getLastMessage(conversation.id);
      const previous = history.at(-2);
      if (!last || last.role !== 'assistant' || !previous || previous.role !== 'user') {
        throw new AppError(400, 'There is no complete assistant response to regenerate yet.', 'NOTHING_TO_REGENERATE');
      }
      deleteMessage(last.id, conversation.id);
      history = listMessages(conversation.id);
      prompt = previous.content;
    }

    if (!prompt) throw new AppError(400, 'Write a message before sending.', 'EMPTY_MESSAGE');
    if (!regenerate) insertMessage({ conversationId: conversation.id, role: 'user', content: prompt });

    history = listMessages(conversation.id);
    const providerMessages = trimHistory(history);
    req.on('aborted', handleClose);
    res.on('close', handleClose);
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    sendEvent(res, 'start', { conversationId: conversation.id });

    const content = await streamAssistantReply({
      systemPrompt: conversation.systemPrompt,
      messages: providerMessages,
      signal: abortController.signal,
      onToken: (text) => sendEvent(res, 'delta', { text }),
    });

    if (!clientClosed && content.trim()) {
      const saved = insertMessage({ conversationId: conversation.id, role: 'assistant', content });
      sendEvent(res, 'done', { message: saved });
    }
    responseFinished = true;
    if (!res.writableEnded) res.end();
  } catch (error) {
    responseFinished = true;
    if (res.headersSent) {
      if (!clientClosed && !res.writableEnded) {
        sendEvent(res, 'error', {
          code: error.code || 'AI_ERROR',
          message: error instanceof AppError ? error.message : 'The AI could not finish this response.',
        });
        res.end();
      }
    } else {
      next(error);
    }
  } finally {
    req.off('aborted', handleClose);
    res.off('close', handleClose);
    activeConversations.delete(conversation.id);
  }
}
