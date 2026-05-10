import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageSquare, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ConversationList,
  PersonaSelector,
} from "@/components/sidebar";
import {
  ProviderSettingsModal,
  ThemeModal,
} from "@/components/modals";
import type {
  Conversation,
  Persona,
  Provider,
  Theme,
} from "@/types";

interface SidebarProps {
  open: boolean;
  onNewConversation: () => void;
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  personas: Persona[];
  activePersonaId: string | undefined;
  onStartChatWithPersona: (personaId: string) => void;
  onOpenConfig: (persona: Persona) => void;
  onCreatePersona: () => void;
  providers: Provider[];
  activeProviderId: string;
  onSetActiveProvider: (id: string) => void;
  onAddProvider: (data: Omit<Provider, "id" | "isInitial">) => void;
  onUpdateProvider: (id: string, updates: Partial<Omit<Provider, "id" | "isInitial">>) => void;
  onDeleteProvider: (id: string) => void;
  themes: Theme[];
  customThemes: Theme[];
  selectedTheme: Theme;
  onSelectTheme: (theme: Theme) => void;
  onAddCustomTheme: (theme: Omit<Theme, "name"> & { name: string }) => void;
  onUpdateCustomTheme: (id: string, theme: Partial<Theme>) => void;
  onDeleteCustomTheme: (id: string) => void;
}

export function Sidebar({
  open,
  onNewConversation,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  personas,
  activePersonaId,
  onStartChatWithPersona,
  onOpenConfig,
  onCreatePersona,
  providers,
  activeProviderId,
  onSetActiveProvider,
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider,
  themes,
  customThemes,
  selectedTheme,
  onSelectTheme,
  onAddCustomTheme,
  onUpdateCustomTheme,
  onDeleteCustomTheme,
}: SidebarProps) {
  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.aside
          initial={{ x: -288, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -288, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="w-72 border-r border-border bg-card flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Link to="/" className="font-semibold text-lg hover:opacity-80 transition-opacity">
              LLMPlayground
            </Link>
            <Button size="sm" variant="ghost" onClick={onNewConversation}>
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>

          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={onSelectConversation}
            onDelete={onDeleteConversation}
          />

          <PersonaSelector
            personas={personas}
            activePersonaId={activePersonaId}
            onOpenConfig={onOpenConfig}
            onStartChat={onStartChatWithPersona}
            onCreatePersona={onCreatePersona}
          />

          <div className="p-4 border-t border-border mt-auto">
            <div className="flex gap-2">
              <ProviderSettingsModal
                providers={providers}
                activeProviderId={activeProviderId}
                onSetActive={onSetActiveProvider}
                onAddProvider={onAddProvider}
                onUpdateProvider={onUpdateProvider}
                onDeleteProvider={onDeleteProvider}
                trigger={
                  <Button variant="outline" size="sm" data-testid="provider-button" className="flex-1">
                    <Settings className="w-4 h-4 mr-2" />
                    Provider
                  </Button>
                }
              />
              <ThemeModal
                themes={themes}
                customThemes={customThemes}
                selectedTheme={selectedTheme}
                onSelect={onSelectTheme}
                onAddCustomTheme={onAddCustomTheme}
                onUpdateCustomTheme={onUpdateCustomTheme}
                onDeleteCustomTheme={onDeleteCustomTheme}
                trigger={
                  <Button variant="outline" size="sm" data-testid="theme-button" className="flex-1">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Theme
                  </Button>
                }
              />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
