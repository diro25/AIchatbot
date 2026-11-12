import { Router } from 'express';
import {
  getConversations,
  getMessages,
  patchConversation,
  postConversation,
  removeConversation,
} from '../controllers/conversationController.js';
import { chat } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/auth.js';
import { chatRateLimit } from '../middleware/rateLimit.js';
import { chatSchema, conversationIdSchema, createConversationSchema, updateConversationSchema, validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);
router.get('/', getConversations);
router.post('/', validate(createConversationSchema), postConversation);
router.patch('/:id', validate(conversationIdSchema, 'params'), validate(updateConversationSchema), patchConversation);
router.delete('/:id', validate(conversationIdSchema, 'params'), removeConversation);
router.get('/:id/messages', validate(conversationIdSchema, 'params'), getMessages);
router.post('/:id/chat', chatRateLimit, validate(conversationIdSchema, 'params'), validate(chatSchema), chat);

export default router;
