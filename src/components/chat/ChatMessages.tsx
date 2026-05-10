import * as React from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { resolveAvatar } from "@/lib/utils";
import type { Message, Persona } from "@/types";
import { MessageBubble } from "./MessageBubble";

interface ChatMessagesProps {
  messages: Message[];
  persona: Persona | undefined;
  isStreaming: boolean;
  onGenerateImage: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRegenerate: () => void;
}

export function ChatMessages({
  messages,
  persona,
  isStreaming,
  onGenerateImage,
  onEditMessage,
  onRegenerate,
}: ChatMessagesProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Find the index of the last assistant message — gets the regenerate button
  const lastAssistantIdx = messages.reduce(
    (acc, m, i) => (m.role === "assistant" ? i : acc),
    -1
  );

  // Typing dots appear while waiting for the first chunk of a new response
  const lastMessage = messages[messages.length - 1];
  const showTypingDots = isStreaming && (lastMessage === undefined || lastMessage.role === "user");

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-3xl mx-auto space-y-6 p-6">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            {persona && (
              <img
                src={resolveAvatar(persona.avatar, persona.name)}
                alt={persona.name}
                data-testid="welcome-avatar"
                className="w-20 h-20 rounded-full mx-auto mb-4"
              />
            )}
            <h3 className="text-xl font-semibold mb-2">
              {persona ? `Hi, I'm ${persona.name}` : "Start a conversation"}
            </h3>
            <p className="text-muted-foreground">
              {persona
                ? "I'm here to help you craft stories and develop characters"
                : "Send a message to begin"}
            </p>
          </motion.div>
        ) : (
          messages.map((message, idx) => (
            <MessageBubble
              key={message.id}
              message={message}
              persona={persona}
              onGenerateImage={onGenerateImage}
              onEditMessage={onEditMessage}
              onRegenerate={onRegenerate}
              isStreaming={isStreaming && idx === lastAssistantIdx}
              isLastAssistant={idx === lastAssistantIdx}
            />
          ))
        )}

        {showTypingDots && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            {persona && (
              <img
                src={resolveAvatar(persona.avatar, persona.name)}
                alt={persona.name}
                data-testid="typing-avatar"
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            )}
            <div className="bg-muted rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-muted-foreground rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}