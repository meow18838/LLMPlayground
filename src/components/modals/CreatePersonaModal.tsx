import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Download, Upload, X, MessageSquarePlus, Trash2 } from "lucide-react";
import type { Persona } from "@/types";

const PERSONA_CODEC_VERSION = 1;

function encodePersona(data: Omit<Persona, "id">): string {
  const obj = { v: PERSONA_CODEC_VERSION, n: data.name, p: data.systemPrompt, a: data.avatar };
  return btoa(JSON.stringify(obj));
}

function decodePersona(raw: string): Omit<Persona, "id"> | { error: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: "Invalid token: empty input" };
  }

  let obj: unknown;
  try {
    obj = JSON.parse(atob(trimmed));
  } catch {
    return { error: "Invalid token: bad format" };
  }

  if (typeof obj !== "object" || obj === null) {
    return { error: "Invalid token: bad format" };
  }

  const record = obj as Record<string, unknown>;
  if (record.v !== PERSONA_CODEC_VERSION) {
    return { error: "Invalid token: unsupported version" };
  }

  if (typeof record.n !== "string" || !record.n.trim()) {
    return { error: "Invalid token: name is required" };
  }

  if (typeof record.p !== "string") {
    return { error: "Invalid token: system prompt must be a string" };
  }

  if (typeof record.a !== "string" && record.a !== undefined) {
    return { error: "Invalid token: avatar must be a string" };
  }

  const name = record.n.trim();
  const systemPrompt = record.p;
  const avatar = typeof record.a === "string" ? record.a : "";

  if (name.length > 100) {
    return { error: "Name too long (max 100 characters)" };
  }

  if (systemPrompt.length > 50000) {
    return { error: "System prompt too long (max 50000 characters)" };
  }

  return { name, systemPrompt, avatar };
}

interface CreatePersonaModalProps {
  persona?: Persona | null;
  onCreate: (persona: Omit<Persona, "id">) => void;
  onUpdate?: (id: string, updates: Partial<Omit<Persona, "id">>) => void;
  onDelete?: (id: string) => void;
  onStartChat?: (personaId: string) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreatePersonaModal({
  persona,
  onCreate,
  onUpdate,
  onDelete,
  onStartChat,
  trigger,
  open: openProp,
  onOpenChange,
}: CreatePersonaModalProps) {
  const isEdit = !!persona;
  const [name, setName] = React.useState(persona?.name ?? "");
  const [systemPrompt, setSystemPrompt] = React.useState(persona?.systemPrompt ?? "");
  const [avatar, setAvatar] = React.useState(persona?.avatar ?? "");
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const [codecMode, setCodecMode] = React.useState<"idle" | "import" | "export">("idle");
  const [codecRaw, setCodecRaw] = React.useState("");

  React.useEffect(() => {
    if (persona) {
      setName(persona.name);
      setSystemPrompt(persona.systemPrompt);
      setAvatar(persona.avatar);
    }
  }, [persona]);

  const open = openProp ?? internalOpen;
  const setOpen = (val: boolean) => {
    onOpenChange?.(val);
    setInternalOpen(val);
    setCodecMode("idle");
    setCodecRaw("");
  };

  const resetForm = () => {
    setName("");
    setSystemPrompt("");
    setAvatar("");
    setError("");
  };

  const saveAndReturnId = (): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required");
      return null;
    }
    if (trimmedName.length > 100) {
      setError("Name too long (max 100 characters)");
      return null;
    }
    if (systemPrompt.trim().length > 50000) {
      setError("System prompt too long (max 50000 characters)");
      return null;
    }
    setError("");

    const payload = {
      name: trimmedName,
      systemPrompt: systemPrompt.trim(),
      avatar: avatar.trim(),
    };

    if (isEdit && onUpdate) {
      onUpdate(persona.id, payload);
      return persona.id;
    }
    onCreate(payload);
    return Date.now().toString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAndReturnId();
    resetForm();
    setOpen(false);
  };

  const handleStartChat = () => {
    const id = saveAndReturnId();
    if (!id || !onStartChat) return;
    resetForm();
    setOpen(false);
    onStartChat(id);
  };

  const handleExport = () => {
    const token = encodePersona({ name, systemPrompt, avatar });
    setCodecRaw(token);
    setCodecMode("export");
  };

  const handleImport = () => {
    const decoded = decodePersona(codecRaw);
    if (!decoded) {
      setError("Invalid persona token");
      return;
    }
    if ("error" in decoded) {
      setError(decoded.error);
      return;
    }
    setName(decoded.name);
    setSystemPrompt(decoded.systemPrompt);
    setAvatar(decoded.avatar);
    setCodecMode("idle");
    setCodecRaw("");
    setError("");
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(codecRaw);
    } catch {
      // clipboard unavailable — user can select text manually
    }
  };

  const handleDelete = () => {
    if (!persona || !onDelete) return;
    onDelete(persona.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{isEdit ? persona.name : "Create New Persona"}</DialogTitle>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {codecMode === "import" ? (
            <div className="space-y-3">
              <Label>Paste persona token</Label>
              <Textarea
                value={codecRaw}
                onChange={(e) => { setCodecRaw(e.target.value); setError(""); }}
                placeholder="base64 persona token..."
                className="min-h-[100px] font-mono text-xs"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setCodecMode("idle"); setCodecRaw(""); setError(""); }}>
                  Cancel
                </Button>
                <Button type="button" className="flex-1" onClick={handleImport} disabled={!codecRaw.trim()}>
                  <Upload className="w-3 h-3 mr-1" /> Import
                </Button>
              </div>
            </div>
          ) : codecMode === "export" ? (
            <div className="space-y-3">
              <Label>Persona token</Label>
              <Textarea
                value={codecRaw}
                readOnly
                className="min-h-[100px] font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setCodecMode("idle")}>
                  Back
                </Button>
                <Button type="button" className="flex-1" onClick={handleCopyToken}>
                  <Download className="w-3 h-3 mr-1" /> Copy
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="persona-name">Name *</Label>
                <Input
                  id="persona-name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="e.g. Luna"
                  data-testid="persona-name-input"
                />
                {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="persona-prompt">System Prompt</Label>
                <Textarea
                  id="persona-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Describe how this persona should behave..."
                  className="min-h-[120px]"
                  data-testid="persona-prompt-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="persona-avatar">Avatar URL</Label>
                <Input
                  id="persona-avatar"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1 gap-1" onClick={() => setCodecMode("import")}>
                  <Upload className="w-3 h-3" /> Import
                </Button>
                <Button type="button" variant="outline" size="sm" className="flex-1 gap-1" onClick={handleExport} disabled={!name.trim()}>
                  <Download className="w-3 h-3" /> Export
                </Button>
              </div>

              <div className="flex gap-2">
                {onStartChat && (
                  <Button type="button" className="flex-1 gap-1" onClick={handleStartChat}>
                    <MessageSquarePlus className="w-4 h-4" /> Start Chat
                  </Button>
                )}
                <Button type="submit" variant={onStartChat ? "outline" : "default"} className="flex-1" data-testid="save-persona-button">
                  {isEdit ? "Save" : "Create"}
                </Button>
              </div>

              {isEdit && onDelete && (
                <>
                  <div className="border-t border-border" />
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    data-testid="delete-persona-button"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    Delete this persona
                  </button>
                </>
              )}
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
