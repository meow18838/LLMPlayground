import { useState, useEffect, useRef } from "react";
import { Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ModelSelect } from "./ModelSelect";
import { cn, resolveAvatar } from "@/lib/utils";
import type { Persona } from "@/types";

interface ChatHeaderProps {
  persona: Persona | undefined;
  personas: Persona[];
  onPersonaChange: (personaId: string) => void;
  activeModel: string;
  onModelChange: (model: string) => void;
  onToggleSidebar: () => void;
  models?: string[];
}

export function ChatHeader({
  persona,
  personas,
  onPersonaChange,
  activeModel,
  onModelChange,
  onToggleSidebar,
  models,
}: ChatHeaderProps) {
  const modelList = models ?? [];
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const personaMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (personaMenuRef.current && !personaMenuRef.current.contains(e.target as Node)) {
        setPersonaMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b border-border bg-card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
          <Menu className="w-5 h-5" />
        </Button>
        {persona && (
          <div ref={personaMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setPersonaMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted transition-colors cursor-pointer"
            >
              <img
                src={resolveAvatar(persona.avatar, persona.name)}
                alt={persona.name}
                data-testid="header-avatar"
                className="w-8 h-8 rounded-full"
              />
              <span className="font-medium">{persona.name}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            {personaMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-card border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                <div className="p-1 space-y-0.5">
                  {personas.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onPersonaChange(p.id);
                        setPersonaMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 text-left text-sm px-2 py-2 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                        p.id === persona.id && "bg-accent text-accent-foreground"
                      )}
                    >
                      <img src={resolveAvatar(p.avatar, p.name)} alt={p.name} className="w-6 h-6 rounded-full" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">Model:</Label>
        <ModelSelect
          value={activeModel}
          onChange={onModelChange}
          models={modelList}
        />
      </div>
    </header>
  );
}
