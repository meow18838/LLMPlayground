import * as React from "react";
import { Plus, Pencil, Trash2, Check, Zap, Thermometer, Waves } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Provider } from "@/types";

interface ProviderSettingsModalProps {
  providers: Provider[];
  activeProviderId: string;
  onSetActive: (id: string) => void;
  onAddProvider: (data: Omit<Provider, "id" | "isInitial">) => void;
  onUpdateProvider: (id: string, updates: Partial<Omit<Provider, "id" | "isInitial">>) => void;
  onDeleteProvider: (id: string) => void;
  trigger: React.ReactNode;
}

const DEFAULT_NEW_PROVIDER = {
  name: "",
  url: "",
  apiKey: "",
  temperature: 0.7,
  maxTokens: 2048,
  stream: true,
  model: "",
};

const MAX_TOKENS_LIMIT = 4096;

function temperatureLabel(value: number): string {
  if (value <= 0.3) return "Precise";
  if (value <= 0.8) return "Balanced";
  if (value <= 1.4) return "Creative";
  return "Wild";
}

function tokensLabel(value: number): string {
  if (value <= 256) return "Short";
  if (value <= 1024) return "Medium";
  if (value <= 2048) return "Long";
  if (value <= 3072) return "Extended";
  return "Maximum";
}

export function ProviderSettingsModal({
  providers,
  activeProviderId,
  onSetActive,
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider,
  trigger,
}: ProviderSettingsModalProps) {
  const [selectedId, setSelectedId] = React.useState(activeProviderId);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newProvider, setNewProvider] = React.useState(DEFAULT_NEW_PROVIDER);
  const [open, setOpen] = React.useState(false);

  const selected = providers.find((p) => p.id === selectedId) ?? providers[0];

  React.useEffect(() => {
    setSelectedId(activeProviderId);
  }, [activeProviderId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSetActive(id);
  };

  const handleAdd = () => {
    if (!newProvider.name.trim() || !newProvider.url.trim()) return;
    onAddProvider(newProvider);
    setNewProvider(DEFAULT_NEW_PROVIDER);
    setShowAddForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Provider Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Provider list */}
          <div className="space-y-1">
            {providers.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                  p.id === selectedId
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => handleSelect(p.id)}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                  p.id === activeProviderId ? "border-primary" : "border-muted-foreground/40"
                )}>
                  {p.id === activeProviderId && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>

                <span className="flex-1 text-sm font-medium truncate">{p.name}</span>

                {!p.isInitial && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => { e.stopPropagation(); setSelectedId(p.id); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); onDeleteProvider(p.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add provider button / form */}
          {!showAddForm ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          ) : (
            <div className="space-y-3 p-3 border border-border rounded-md bg-muted/30">
              <div className="space-y-1">
                <Label htmlFor="new-name" className="text-xs">Name</Label>
                <Input
                  id="new-name"
                  placeholder="My Provider"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-url" className="text-xs">API URL</Label>
                <Input
                  id="new-url"
                  placeholder="https://api.example.com/v1"
                  value={newProvider.url}
                  onChange={(e) => setNewProvider({ ...newProvider, url: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-apiKey" className="text-xs">API Key</Label>
                <Input
                  id="new-apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={newProvider.apiKey}
                  onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} disabled={!newProvider.name.trim() || !newProvider.url.trim()}>
                  <Check className="w-4 h-4 mr-1" />
                  Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setNewProvider(DEFAULT_NEW_PROVIDER); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Selected provider detail */}
          {selected && (
            <div className="space-y-4 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {selected.isInitial ? "Default Provider" : "Provider Details"}
              </p>

              <div className="space-y-1">
                <Label htmlFor="detail-name" className="text-xs">Name</Label>
                <Input
                  id="detail-name"
                  value={selected.name}
                  disabled={selected.isInitial}
                  onChange={(e) => onUpdateProvider(selected.id, { name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="detail-url" className="text-xs">API URL</Label>
                <Input
                  id="detail-url"
                  value={selected.url}
                  disabled={selected.isInitial}
                  onChange={(e) => onUpdateProvider(selected.id, { url: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="detail-apiKey" className="text-xs">API Key</Label>
                <Input
                  id="detail-apiKey"
                  type="password"
                  value={selected.apiKey}
                  onChange={(e) => onUpdateProvider(selected.id, { apiKey: e.target.value })}
                />
              </div>

              {/* ─── Model Parameters ─────────────────────────────────────── */}
              <div className="space-y-4 pt-1">
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
                  Model Parameters
                </p>

                {/* Temperature */}
                <div className="space-y-2.5 rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />
                      <Label className="text-xs font-medium">Temperature</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded",
                        selected.temperature <= 0.3 && "bg-blue-500/15 text-blue-500",
                        selected.temperature > 0.3 && selected.temperature <= 0.8 && "bg-emerald-500/15 text-emerald-500",
                        selected.temperature > 0.8 && selected.temperature <= 1.4 && "bg-amber-500/15 text-amber-500",
                        selected.temperature > 1.4 && "bg-rose-500/15 text-rose-500",
                      )}>
                        {temperatureLabel(selected.temperature)}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-muted-foreground w-7 text-right">
                        {selected.temperature.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={[selected.temperature]}
                    onValueChange={(value) => onUpdateProvider(selected.id, { temperature: value[0] })}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/60">
                    <span>Precise</span>
                    <span>Creative</span>
                    <span>Wild</span>
                  </div>
                </div>

                {/* Max Tokens */}
                <div className="space-y-2.5 rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Waves className="w-3.5 h-3.5 text-muted-foreground" />
                      <Label className="text-xs font-medium">Max Tokens</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded",
                        "bg-primary/10 text-primary",
                      )}>
                        {tokensLabel(selected.maxTokens)}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-muted-foreground w-12 text-right">
                        {selected.maxTokens}
                      </span>
                    </div>
                  </div>
                  <Slider
                    min={0}
                    max={MAX_TOKENS_LIMIT}
                    step={64}
                    value={[selected.maxTokens]}
                    onValueChange={(value) => onUpdateProvider(selected.id, { maxTokens: value[0] })}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/60">
                    <span>0</span>
                    <span>1024</span>
                    <span>2048</span>
                    <span>3072</span>
                    <span>4096</span>
                  </div>
                </div>

                {/* Stream */}
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                    <div>
                      <Label className="text-xs font-medium">Streaming</Label>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                        {selected.stream
                          ? "Tokens stream in real-time as they generate"
                          : "Full response delivered at once when complete"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={selected.stream}
                    onCheckedChange={(checked) => onUpdateProvider(selected.id, { stream: checked })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
