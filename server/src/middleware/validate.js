import { z } from 'zod';
import { AppError } from '../utils/errors.js';

const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254);
const password = z.string().min(8, 'Use at least 8 characters.').max(72, 'Use 72 characters or fewer.');

export const registerSchema = z.object({ email, password });
export const loginSchema = z.object({ email, password });
export const conversationIdSchema = z.object({ id: z.coerce.number().int().positive() });
export const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  systemPrompt: z.string().max(4000).optional(),
});
export const updateConversationSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  systemPrompt: z.string().max(4000).optional(),
}).refine((value) => value.title !== undefined || value.systemPrompt !== undefined, {
  message: 'Provide a title or system prompt to update.',
});
export const chatSchema = z.object({
  message: z.string().trim().max(12000).optional(),
  regenerate: z.boolean().optional().default(false),
});

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues[0]?.message || 'Check the submitted fields.';
      return next(new AppError(400, message, 'VALIDATION_ERROR'));
    }
    req[source] = result.data;
    next();
  };
}
