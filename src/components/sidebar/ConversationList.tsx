import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Conversation } from "@/types";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
}: ConversationListProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {conversations.map((conv) => (
          <motion.div
            key={conv.id}
            className={cn(
              "group flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer",
              activeConversationId === conv.id
                ? "bg-accent text-accent-foreground"
                : "hover:bg-muted"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            data-testid={`conversation-${conv.id}`}
          >
            <button
              type="button"
              className="flex-1 text-left min-w-0"
              onClick={() => onSelect(conv.id)}
            >
              <div className="font-medium text-sm truncate">{conv.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {conv.messages.length} messages
              </div>
            </button>
            <button
              type="button"
              className="ml-2 p-1 rounded-md opacity-0 group-hover:opacity-60 group-focus-within:opacity-60 active:opacity-100 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              data-testid={`delete-conversation-${conv.id}`}
              aria-label="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
}
