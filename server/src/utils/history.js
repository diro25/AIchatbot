import { env } from '../config.js';

export function trimHistory(messages) {
  const byCount = messages.slice(-env.maxHistoryMessages);
  let total = 0;
  const selected = [];
  for (let index = byCount.length - 1; index >= 0; index -= 1) {
    const message = byCount[index];
    if (total + message.content.length > env.maxHistoryCharacters && selected.length > 0) break;
    selected.unshift({ role: message.role, content: message.content });
    total += message.content.length;
  }
  return selected;
}
