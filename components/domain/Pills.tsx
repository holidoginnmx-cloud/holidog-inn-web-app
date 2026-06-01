"use client";

import { cn, focusRing } from "@/lib/utils";

type PillOption = { value: string; label: string };

// Grupo de "pills" seleccionables (un solo valor). Botones grandes para móvil.
export function Pills({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly PillOption[];
  value: string | null;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              focusRing,
              active
                ? "border-brand-teal bg-brand-teal text-white"
                : "border-neutral-border bg-white text-neutral-ink active:bg-neutral-sand",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
