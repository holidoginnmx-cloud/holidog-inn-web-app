// Etiquetas de los servicios de estética incluidos en una reservación.
// Solo se renderiza algo si al menos una bandera está activa.
export function EsteticaBadges({
  incluyeBano,
  incluyeCorte,
  incluyeDeslanado,
  className,
}: {
  incluyeBano?: boolean;
  incluyeCorte?: boolean;
  incluyeDeslanado?: boolean;
  className?: string;
}) {
  const items = [
    incluyeBano && "Baño",
    incluyeDeslanado && "Deslanado",
    incluyeCorte && "Corte",
  ].filter(Boolean) as string[];

  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ""}`}>
      {items.map((label) => (
        <span
          key={label}
          className="rounded-full bg-brand-mustard/15 px-2 py-0.5 text-xs font-medium text-brand-mustard"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
