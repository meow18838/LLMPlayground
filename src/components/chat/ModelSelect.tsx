import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ModelSelectProps {
  value: string;
  onChange: (value: string) => void;
  models: string[];
  placeholder?: string;
}

export function ModelSelect({
  value,
  onChange,
  models,
  placeholder = "Select model...",
}: ModelSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(
    () =>
      models.filter((m) =>
        m.toLowerCase().includes(search.toLowerCase())
      ),
    [models, search]
  );

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (model: string) => {
    onChange(model);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 text-sm bg-background border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px] justify-between"
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-card border border-border rounded-md shadow-lg z-50 flex flex-col">
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 bg-transparent"
              autoFocus
            />
          </div>
          <ScrollArea className="h-60">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No models found.
              </div>
            ) : (
              <div className="p-1 space-y-0.5">
                {filtered.map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => handleSelect(model)}
                    className={cn(
                      "w-full text-left text-sm px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                      model === value && "bg-accent text-accent-foreground"
                    )}
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
