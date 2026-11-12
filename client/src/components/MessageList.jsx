import { useEffect, useRef } from 'react';
import { Bot, UserRound } from 'lucide-react';
import { MarkdownMessage } from './MarkdownMessage';

export function MessageList({ messages, streamingText, isStreaming }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.length, streamingText]);

  if (messages.length === 0 && !isStreaming) {
    return <div className="empty-chat"><div className="empty-orbit"><span /></div><p className="eyebrow text-emerald-700 dark:text-mint">Ready when you are</p><h2>Your next useful answer starts here.</h2><p>Ask for a plan, a draft, a second opinion, or a clean explanation.</p></div>;
  }

  return <div className="message-list">
    {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
    {isStreaming && <MessageBubble message={{ role: 'assistant', content: streamingText }} streaming />}
    <div ref={endRef} className="h-2" />
  </div>;
}

function MessageBubble({ message, streaming = false }) {
  const isUser = message.role === 'user';
  return <article className={`message-row ${isUser ? 'is-user' : 'is-assistant'}`}>
    <div className="message-avatar">{isUser ? <UserRound size={15} /> : <Bot size={15} />}</div>
    <div className="min-w-0 flex-1"><div className="mb-2 flex items-center gap-2"><span className="eyebrow">{isUser ? 'You' : 'Signal Room'}</span>{streaming && <span className="live-label"><span className="status-dot" /> Live</span>}</div><div className={`message-content ${isUser ? 'user-content' : 'assistant-content'}`}>{isUser ? <p className="whitespace-pre-wrap leading-7">{message.content}</p> : message.content ? <MarkdownMessage content={message.content} /> : <span className="typing-caret" />}</div></div>
  </article>;
}
