import type { LucideIcon } from "lucide-react";

// Estado vacío con una "ilustración" simple: ícono en un círculo de marca.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-neutral-sand">
        <Icon className="size-8 text-brand-teal" aria-hidden />
      </div>
      <div>
        <p className="font-medium text-neutral-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-neutral-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
