import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Loader2,
  Brain,
  ChevronRight,
  Copy,
  Check,
  Pencil,
  RefreshCw,
  X,
} from "lucide-react";
import { cn, resolveAvatar } from "@/lib/utils";
import { MarkdownContent } from "@/components/chat/MarkdownContent";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message, Persona } from "@/types";

// ─── Thinking parser ──────────────────────────────────────────────────────────

function parseThinkingContent(raw: string): {
  thinking: string | null;
  content: string;
  isThinking: boolean;
} {
  // Completed blocks
  for (const [open, close] of [
    ["<thinking>", "</thinking>"],
    ["<reasoning>", "</reasoning>"],
    ["<think>", "</think>"],
  ] as const) {
    const re = new RegExp(`^${open.replace("<", "\\<").replace(">", "\\>")}([\\s\\S]*?)${close.replace("<", "\\<").replace(">", "\\>")}\\s*`);
    const m = raw.match(re);
    if (m) return { thinking: m[1].trim() || null, content: raw.slice(m[0].length), isThinking: false };
  }

  // Open (still streaming) block — no closing tag yet
  const openMatch = raw.match(/^<(?:thinking|reasoning|think)>([\s\S]*)$/);
  if (openMatch) return { thinking: openMatch[1], content: "", isThinking: true };

  return { thinking: null, content: raw, isThinking: false };
}

// ─── Edit form for user messages ─────────────────────────────────────────────

function EditForm({
  initialValue,
  onSave,
  onCancel,
}: {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSave(value);
    }
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[60px] resize-none text-sm bg-primary-foreground text-foreground"
      />
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-7 px-2 text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => value.trim() && onSave(value)}
          disabled={!value.trim()}
          className="h-7 px-2 text-xs"
        >
          <Check className="w-3 h-3 mr-1" />
          Save & send
        </Button>
      </div>
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
  persona: Persona | undefined;
  onGenerateImage: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRegenerate: () => void;
  isStreaming?: boolean;
  /** True only on the last assistant message — shows the Regenerate button */
  isLastAssistant?: boolean;
}

export function MessageBubble({
  message,
  persona,
  onGenerateImage,
  onEditMessage,
  onRegenerate,
  isStreaming,
  isLastAssistant,
}: MessageBubbleProps) {
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { thinking, content, isThinking } =
    message.role === "assistant"
      ? parseThinkingContent(message.content)
      : { thinking: null, content: message.content, isThinking: false };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content || message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const handleSaveEdit = (newContent: string) => {
    setIsEditing(false);
    onEditMessage(message.id, newContent);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 group/msg",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {message.role === "assistant" && persona && (
        <img
          src={resolveAvatar(persona.avatar, persona.name)}
          alt={persona.name}
          data-testid="assistant-avatar"
          className="w-8 h-8 rounded-full flex-shrink-0 mt-1"
        />
      )}

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border"
        )}
      >
        {/* Thinking block */}
        {(thinking || isThinking) && (
          <div className="mb-2">
            <button
              onClick={() => setThinkingOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none w-full text-left"
            >
              <motion.span animate={{ rotate: thinkingOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight className="w-3 h-3" />
              </motion.span>
              <Brain className={cn("w-3 h-3", isThinking && "animate-pulse")} />
              <span>{isThinking ? "Thinking…" : "Thought process"}</span>
            </button>
            <AnimatePresence initial={false}>
              {thinkingOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-1.5 pl-5 border-l-2 border-muted text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {thinking}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Message body */}
        {message.role === "user" ? (
          isEditing ? (
            <EditForm
              initialValue={message.content}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          )
        ) : (
          content && <MarkdownContent content={content} />
        )}

        {/* Generated image */}
        {message.imageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg overflow-hidden mt-3"
          >
            <img src={message.imageUrl} alt="Generated" className="w-full h-auto" />
          </motion.div>
        )}

        {/* ── User message actions ── */}
        {message.role === "user" && !isEditing && (
          <div className="mt-1.5 flex justify-end">
            <button
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover/msg:opacity-100 transition-opacity text-primary-foreground/60 hover:text-primary-foreground cursor-pointer"
              title="Edit message"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* ── Assistant message actions ── */}
        {message.role === "assistant" && !isThinking && (
          <div className="mt-2 flex items-center gap-3">
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
              title="Copy response"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>

            {/* Regenerate — only on the last assistant message, not while streaming */}
            {isLastAssistant && !isStreaming && (
              <button
                onClick={onRegenerate}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                title="Regenerate response"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}

            {/* Generate image */}
            {!message.imageUrl && !message.isGeneratingImage && (
              <button
                onClick={() => onGenerateImage(message.id)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer" title="Generate Image"
              >
                <ImageIcon className="w-3 h-3" />
              </button>
            )}

            {message.isGeneratingImage && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Generating…
              </div>
            )}
          </div>
        )}
      </div>

      {message.role === "user" && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs font-medium text-primary-foreground">You</span>
        </div>
      )}
    </motion.div>
  );
}