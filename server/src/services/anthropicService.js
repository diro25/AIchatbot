import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config.js';
import { AppError } from '../utils/errors.js';

let client;

function getClient() {
  if (!env.anthropicApiKey || !env.anthropicModel) {
    throw new AppError(503, 'AI service is not configured yet. Add ANTHROPIC_API_KEY and ANTHROPIC_MODEL on the server.', 'AI_NOT_CONFIGURED');
  }
  client ||= new Anthropic({ apiKey: env.anthropicApiKey });
  return client;
}

export async function streamAssistantReply({ systemPrompt, messages, signal, onToken }) {
  const stream = getClient().messages.stream({
    model: env.anthropicModel,
    max_tokens: 2048,
    system: systemPrompt || undefined,
    messages: messages.map(({ role, content }) => ({ role, content })),
    signal,
  });

  let content = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      content += event.delta.text;
      onToken(event.delta.text);
    }
  }
  return content;
}
