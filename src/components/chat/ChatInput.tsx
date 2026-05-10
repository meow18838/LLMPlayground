import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  isStreaming: boolean;
}

export function ChatInput({ value, onChange, onSend, isStreaming }: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            data-testid="chat-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[60px] pr-12 resize-none"
            disabled={isStreaming}
          />
          <Button
            size="icon"
            data-testid="send-button"
            onClick={onSend}
            disabled={!value.trim() || isStreaming}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
