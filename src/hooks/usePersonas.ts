import { useState, useMemo } from "react";
import { Persona } from "@/types";
import { samplePersonas } from "@/data/personas";
import { storageGet, storageSet } from "@/lib/storage";

const CUSTOM_PERSONAS_KEY = "customPersonas";
const ACTIVE_PERSONA_KEY = "activePersonaId";

function loadCustomPersonas(): Persona[] {
  return storageGet<Persona[]>(CUSTOM_PERSONAS_KEY, []);
}

export function usePersonas() {
  const [customPersonas, setCustomPersonas] = useState<Persona[]>(loadCustomPersonas);
  const [activePersonaId, setActivePersonaId] = useState<string | undefined>(
    () => storageGet<string | undefined>(ACTIVE_PERSONA_KEY, "1")
  );

  const personas = useMemo(() => {
    const overriddenIds = new Set(customPersonas.map((p) => p.id));
    return [...samplePersonas.filter((p) => !overriddenIds.has(p.id)), ...customPersonas];
  }, [customPersonas]);
  const activePersona = personas.find((p) => p.id === activePersonaId);

  const persistCustom = (next: Persona[] | ((prev: Persona[]) => Persona[])) => {
    setCustomPersonas((prev) => {
      const updated = typeof next === "function" ? next(prev) : next;
      storageSet(CUSTOM_PERSONAS_KEY, updated);
      return updated;
    });
  };

  const persistActiveId = (id: string | undefined) => {
    setActivePersonaId(id);
    storageSet(ACTIVE_PERSONA_KEY, id);
  };

  const addPersona = (persona: Omit<Persona, "id">) => {
    const newPersona: Persona = { ...persona, id: Date.now().toString() };
    persistCustom((prev) => [...prev, newPersona]);
  };

  const updatePersona = (id: string, updates: Partial<Omit<Persona, "id">>) => {
    setCustomPersonas((prev) => {
      const existing = prev.find((p) => p.id === id);
      if (existing) {
        const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
        storageSet(CUSTOM_PERSONAS_KEY, updated);
        return updated;
      }
      const source = samplePersonas.find((p) => p.id === id);
      if (!source) {
        return prev;
      }
      const newCustom: Persona = { ...source, ...updates, id };
      const result = [...prev, newCustom];
      storageSet(CUSTOM_PERSONAS_KEY, result);
      return result;
    });
  };

  const deletePersona = (id: string) => {
    persistCustom((prev) => prev.filter((p) => p.id !== id));
    if (activePersonaId === id) {
      const remaining = personas.filter((p) => p.id !== id);
      persistActiveId(remaining.length > 0 ? remaining[0].id : undefined);
    }
  };

  return {
    personas,
    activePersona,
    activePersonaId,
    setActivePersonaId: persistActiveId,
    addPersona,
    updatePersona,
    deletePersona,
  };
}
