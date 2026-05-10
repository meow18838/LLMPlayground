import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Code block with language label + copy button
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="my-2 rounded-lg overflow-hidden border border-border text-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-zinc-800 px-3 py-1.5 border-b border-zinc-700">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {copied ? (
            <><Check className="w-3 h-3" /> Copied</>
          ) : (
            <><Copy className="w-3 h-3" /> Copy</>
          )}
        </button>
      </div>

      <SyntaxHighlighter
        language={language || "text"}
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "0.78em",
          lineHeight: "1.6",
          background: "#1e1e1e",
          padding: "0.85rem 1rem",
        }}
        codeTagProps={{ style: { fontFamily: "ui-monospace, monospace" } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn("text-sm leading-relaxed max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          // Handles both inline code and fenced code blocks
          code({ inline, className: cls, children }: {
            inline?: boolean;
            className?: string;
            children?: React.ReactNode;
          }) {
            const language = /language-(\w+)/.exec(cls ?? "")?.[1] ?? "";
            const code = String(children).replace(/\n$/, "");

            if (inline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-[0.82em] font-mono">
                  {code}
                </code>
              );
            }

            return <CodeBlock language={language} code={code} />;
          },
          // Prevent double wrapping — react-markdown puts code inside pre
          pre: ({ children }) => <>{children}</>,
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => (
            <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold mb-1.5 mt-3 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-muted-foreground/40 pl-3 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="w-full text-xs border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted px-2 py-1 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-2 py-1">{children}</td>
          ),
          hr: () => <hr className="border-border my-3" />,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => (
            <em className="not-italic rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground italic">
              <span className="mr-1 text-[0.65em] opacity-50">✦</span>
              {children}
            </em>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}