import { useState, useEffect, useCallback } from "react";
import { Theme } from "@/types";
import { themes as builtInThemes, applyTheme } from "@/data/themes";
import { storageGet, storageSet } from "@/lib/storage";

const THEME_KEY = "theme";
const CUSTOM_THEMES_KEY = "customThemes";

export function useTheme() {
  const [customThemes, setCustomThemes] = useState<Theme[]>(() => {
    const stored = storageGet<Theme[] | undefined>(CUSTOM_THEMES_KEY, undefined);
    return stored ?? [];
  });

  const allThemes = [...builtInThemes, ...customThemes];

  const [selectedTheme, setSelectedTheme] = useState<Theme>(() => {
    const savedName = storageGet<string | undefined>(THEME_KEY, undefined);
    if (savedName) {
      const found = allThemes.find((t) => t.name === savedName);
      if (found) return found;
    }
    return builtInThemes[1];
  });

  useEffect(() => {
    applyTheme(selectedTheme);
    storageSet(THEME_KEY, selectedTheme.name);
  }, [selectedTheme]);

  const addCustomTheme = useCallback((theme: Omit<Theme, "name"> & { name: string }) => {
    const newTheme: Theme = {
      ...theme,
      name: `${theme.name} [${Date.now()}]`,
    };
    const updated = [...customThemes, newTheme];
    setCustomThemes(updated);
    storageSet(CUSTOM_THEMES_KEY, updated);
    return newTheme;
  }, [customThemes]);

  const updateCustomTheme = useCallback((id: string, updates: Partial<Theme>) => {
    const updated = customThemes.map((t) =>
      t.name === id ? { ...t, ...updates } : t
    );
    setCustomThemes(updated);
    storageSet(CUSTOM_THEMES_KEY, updated);
  }, [customThemes]);

  const deleteCustomTheme = useCallback((id: string) => {
    const updated = customThemes.filter((t) => t.name !== id);
    setCustomThemes(updated);
    storageSet(CUSTOM_THEMES_KEY, updated);
  }, [customThemes]);

  return {
    selectedTheme,
    setSelectedTheme,
    themes: allThemes,
    customThemes,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    applyTheme,
  };
}
