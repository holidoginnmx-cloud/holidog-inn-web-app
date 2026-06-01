"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type ComboOption = { value: string; label: string; sublabel?: string };

// Combobox con búsqueda. Dropdown inline (no portal) para funcionar dentro del
// Sheet sin conflictos de focus-trap. Si `allowCustom`, permite usar texto nuevo
// que no esté en las opciones (para "Nueva categoría").
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecciona…",
  searchPlaceholder = "Buscar…",
  emptyText = "Sin resultados",
  allowCustom = false,
}: {
  options: ComboOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowCustom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = options.find((o) => o.value === value);
  const display = selected?.label ?? (value && allowCustom ? value : null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = !s
      ? options
      : options.filter(
          (o) =>
            o.label.toLowerCase().includes(s) || (o.sublabel?.toLowerCase().includes(s) ?? false),
        );
    return base.slice(0, 50);
  }, [options, q]);

  const exact = options.some((o) => o.label.toLowerCase() === q.trim().toLowerCase());
  const showCustom = allowCustom && q.trim() !== "" && !exact;

  function pick(v: string) {
    onChange(v);
    setOpen(false);
    setQ("");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border-input flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 text-left text-sm"
      >
        <span className={cn("truncate", !display && "text-neutral-muted")}>
          {display ?? placeholder}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-neutral-muted" aria-hidden />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-neutral-border bg-white shadow-lg">
            <div className="relative border-b border-neutral-border p-2">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-neutral-muted"
                aria-hidden
              />
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 pl-8"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {showCustom && (
                <li>
                  <button
                    type="button"
                    onClick={() => pick(q.trim())}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-brand-teal active:bg-neutral-sand"
                  >
                    + Usar “{q.trim()}”
                  </button>
                </li>
              )}
              {filtered.length === 0 && !showCustom ? (
                <li className="px-3 py-6 text-center text-sm text-neutral-muted">{emptyText}</li>
              ) : (
                filtered.map((o) => (
                  <li key={o.value}>
                    <button
                      type="button"
                      onClick={() => pick(o.value)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm active:bg-neutral-sand"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-neutral-ink">{o.label}</span>
                        {o.sublabel && (
                          <span className="block truncate text-xs text-neutral-muted">
                            {o.sublabel}
                          </span>
                        )}
                      </span>
                      {o.value === value && (
                        <Check className="size-4 shrink-0 text-brand-teal" aria-hidden />
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
