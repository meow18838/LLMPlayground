import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, ChevronDown, ChevronUp, MessageSquarePlus } from "lucide-react";
import { cn, resolveAvatar } from "@/lib/utils";
import { storageGet, storageSet } from "@/lib/storage";
import type { Persona } from "@/types";

const COLLAPSED_KEY = "personaSelectorCollapsed";

interface PersonaSelectorProps {
  personas: Persona[];
  activePersonaId: string | undefined;
  onOpenConfig: (persona: Persona) => void;
  onStartChat: (id: string) => void;
  onCreatePersona: () => void;
}

export function PersonaSelector({
  personas,
  activePersonaId,
  onOpenConfig,
  onStartChat,
  onCreatePersona,
}: PersonaSelectorProps) {
  const [collapsed, setCollapsed] = useState(() => storageGet<boolean>(COLLAPSED_KEY, false));

  useEffect(() => {
    storageSet(COLLAPSED_KEY, collapsed);
  }, [collapsed]);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);

  return (
    <div className="border-t border-border">
      <div className="flex items-center justify-between mt-3 mb-2 px-4">
        <button
          onClick={toggleCollapsed}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
          data-testid="toggle-persona-list"
        >
          AI Assistants
          {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
        <AnimatePresence>
          {!collapsed && (
            <motion.button
              onClick={onCreatePersona}
              data-testid="create-persona-button"
              className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Plus className="w-3 h-3" />
              Create
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            className="py-1 max-h-[224px] overflow-y-auto overflow-x-hidden px-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            data-testid="persona-list"
          >
            <div className="space-y-1">
              {personas.map((persona) => (
                <motion.button
                  key={persona.id}
                  onClick={() => onOpenConfig(persona)}
                  data-testid={`persona-button-${persona.id}`}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors group",
                    activePersonaId === persona.id
                      ? "bg-accent text-accent-foreground ring-2 ring-primary"
                      : "hover:bg-muted"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img src={resolveAvatar(persona.avatar, persona.name)} alt={persona.name} className="w-8 h-8 rounded-full" />
                  <span data-testid="persona-name" className="text-sm font-medium flex-1 text-left truncate">
                    {persona.name}
                  </span>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageSquarePlus
                      className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); onStartChat(persona.id); }}
                      data-testid={`start-chat-persona-${persona.id}`}
                    />
                    <Pencil
                      className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); onOpenConfig(persona); }}
                      data-testid={`edit-persona-${persona.id}`}
                    />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
