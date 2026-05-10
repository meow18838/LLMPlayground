import * as React from "react";
import { Plus, Trash2, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Theme } from "@/types";
import { themeGroups as builtInThemeGroups } from "@/data/themes";

// ─── Compact swatch ────────────────────────────────────────────────────────────

function ThemeSwatch({
  theme,
  isSelected,
  onClick,
  children,
}: {
  theme: Theme;
  isSelected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full h-10 rounded-lg overflow-hidden cursor-pointer transition-shadow",
        isSelected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-sm"
          : "ring-1 ring-border hover:ring-muted-foreground"
      )}
      title={theme.name}
    >
      <div className="absolute inset-0" style={{ backgroundColor: theme.colors.background }} />
      <div
        className="absolute bottom-0 inset-x-0 h-[40%]"
        style={{ backgroundColor: theme.colors.primary }}
      />
      <div
        className="absolute top-1 right-1 w-2 h-2 rounded-full"
        style={{ backgroundColor: theme.colors.accent }}
      />
      {children}
    </button>
  );
}

// ─── Custom theme form ─────────────────────────────────────────────────────────

interface CustomThemeFormData {
  name: string;
  primary: string;
  accent: string;
  background: string;
  foreground: string;
}

function CustomThemeForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Theme;
  onSubmit: (theme: Omit<Theme, "name"> & { name: string }) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = React.useState<CustomThemeFormData>(() => {
    if (initialData) {
      return {
        name: initialData.name.replace(/\s*\[\d+\]$/, ""),
        primary: initialData.colors.primary,
        accent: initialData.colors.accent,
        background: initialData.colors.background,
        foreground: initialData.colors.foreground,
      };
    }
    return {
      name: "",
      primary: "#7c3aed",
      accent: "#8b5cf6",
      background: "#ffffff",
      foreground: "#0a0a0a",
    };
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    const bg = formData.background;
    const fg = formData.foreground;
    const isDark = isColorDark(bg);
    onSubmit({
      name: formData.name,
      isDark,
      colors: {
        background: bg,
        foreground: fg,
        card: isDark ? darken(bg, 10) : "#ffffff",
        cardForeground: fg,
        primary: formData.primary,
        primaryForeground: isDark ? "#ffffff" : "#ffffff",
        secondary: isDark ? lighten(bg, 15) : darken(bg, 5),
        secondaryForeground: fg,
        muted: isDark ? lighten(bg, 10) : darken(bg, 3),
        mutedForeground: isDark ? lighten(fg, 30) : darken(fg, 40),
        accent: formData.accent,
        accentForeground: fg,
        border: isDark ? lighten(bg, 15) : darken(bg, 10),
        input: isDark ? lighten(bg, 15) : darken(bg, 10),
        ring: formData.primary,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="theme-name">Name</Label>
        <Input
          id="theme-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="My Theme"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["primary", "accent", "background", "foreground"] as const).map((field) => (
          <div key={field}>
            <Label htmlFor={`theme-${field}`} className="text-xs capitalize">{field}</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id={`theme-${field}`}
                type="color"
                value={formData[field]}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                className="w-10 h-8 p-1"
              />
              <Input
                value={formData[field]}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                className="flex-1 text-xs"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm">{initialData ? "Save" : "Create"}</Button>
      </div>
    </form>
  );
}

// ─── Color helpers ──────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function isColorDark(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return luminance(r, g, b) < 0.5;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function adjustBrightness(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 + percent / 100;
  return `#${[r, g, b].map((c) => clamp(c * factor).toString(16).padStart(2, "0")).join("")}`;
}

function lighten(hex: string, percent: number): string { return adjustBrightness(hex, percent); }
function darken(hex: string, percent: number): string { return adjustBrightness(hex, -percent); }

// ─── ThemeModal ─────────────────────────────────────────────────────────────────

interface ThemeModalProps {
  themes: Theme[];
  customThemes: Theme[];
  selectedTheme: Theme;
  onSelect: (theme: Theme) => void;
  onAddCustomTheme: (theme: Omit<Theme, "name"> & { name: string }) => void;
  onUpdateCustomTheme: (id: string, theme: Partial<Theme>) => void;
  onDeleteCustomTheme: (id: string) => void;
  trigger: React.ReactNode;
}

export function ThemeModal({
  themes,
  customThemes,
  selectedTheme,
  onSelect,
  onAddCustomTheme,
  onUpdateCustomTheme,
  onDeleteCustomTheme,
  trigger,
}: ThemeModalProps) {
  const [isCustomFormOpen, setIsCustomFormOpen] = React.useState(false);
  const [editingThemeId, setEditingThemeId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const allBuiltIn = React.useMemo(() => {
    const groupedNames = new Set(builtInThemeGroups.flatMap((g) => [g.light.name, g.dark.name]));
    const defaults = themes.filter((t) => !groupedNames.has(t.name));
    return [...defaults, ...builtInThemeGroups.flatMap((g) => [g.light, g.dark])];
  }, [themes]);

  const handleAddCustomTheme = (data: Omit<Theme, "name"> & { name: string }) => {
    onAddCustomTheme(data);
    setIsCustomFormOpen(false);
  };

  const handleUpdateCustomTheme = (data: Omit<Theme, "name"> & { name: string }) => {
    if (editingThemeId) {
      onUpdateCustomTheme(editingThemeId, data);
      setEditingThemeId(null);
    }
  };

  const showForm = isCustomFormOpen || editingThemeId !== null;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm p-0">
        <DialogHeader className="px-4 pt-4">
          <div className="flex items-center justify-between">
            <DialogTitle>Themes</DialogTitle>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>
        <div className="px-4 pb-4 space-y-3 max-h-[60vh] overflow-y-auto overflow-x-hidden">
          {/* Custom form — appears at top when active */}
          {showForm ? (
            <div className="border border-border rounded-lg p-3">
              <CustomThemeForm
                initialData={
                  editingThemeId
                    ? customThemes.find((t) => t.name === editingThemeId)
                    : undefined
                }
                onSubmit={editingThemeId ? handleUpdateCustomTheme : handleAddCustomTheme}
                onCancel={() => { setIsCustomFormOpen(false); setEditingThemeId(null); }}
              />
            </div>
          ) : (
            <button
              onClick={() => setIsCustomFormOpen(true)}
              className="w-full py-2 rounded-lg border-2 border-dashed border-primary/40 hover:bg-primary/5 hover:border-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">Create Custom Theme</span>
            </button>
          )}

          {/* 2-column swatch grid — light/dark pairs */}
          <div className="grid grid-cols-2 gap-2">
            {allBuiltIn.map((theme) => (
              <ThemeSwatch
                key={theme.name}
                theme={theme}
                isSelected={selectedTheme.name === theme.name}
                onClick={() => onSelect(theme)}
              />
            ))}

            {/* Custom themes inline */}
            {customThemes.map((theme) => (
              <div key={theme.name} className="relative group/ct">
                <ThemeSwatch
                  theme={theme}
                  isSelected={selectedTheme.name === theme.name}
                  onClick={() => onSelect(theme)}
                >
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 group-hover/ct:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setEditingThemeId(theme.name); }}
                      title="Edit"
                    >
                      <Pencil className="w-2.5 h-2.5 text-white" />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); onDeleteCustomTheme(theme.name); }}
                      title="Delete"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                </ThemeSwatch>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
