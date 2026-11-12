import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

function CodeBlock({ className, children, inline, ...props }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');
  if (inline) return <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/10" {...props}>{children}</code>;
  const copy = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="code-frame group relative my-4 overflow-hidden rounded-xl border border-black/10 bg-[#121917] dark:border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
        <span>{className?.replace('language-', '') || 'code'}</span>
        <button type="button" onClick={copy} className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Copy code">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] leading-6 text-slate-100"><code className={className} {...props}>{code}</code></pre>
    </div>
  );
}

export function MarkdownMessage({ content }) {
  return (
    <div className="prose prose-sm max-w-none text-inherit prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-7 prose-a:text-emerald-700 prose-strong:text-inherit dark:prose-invert dark:prose-a:text-mint">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ code: CodeBlock }}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
