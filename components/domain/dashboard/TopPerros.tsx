import Link from "next/link";
import { formatMoneda } from "@/lib/utils";

type Dato = { perroId: string | null; nombre: string; total: number };

export function TopPerros({ perros }: { perros: Dato[] }) {
  if (perros.length === 0) {
    return <p className="py-2 text-center text-sm text-neutral-muted">Sin facturación este mes.</p>;
  }
  return (
    <ol className="space-y-1.5">
      {perros.map((p, i) => {
        const contenido = (
          <>
            <span className="w-5 shrink-0 text-sm font-semibold text-neutral-muted">{i + 1}</span>
            <span className="flex-1 truncate text-sm text-neutral-ink">{p.nombre}</span>
            <span className="text-sm font-medium text-neutral-ink">{formatMoneda(p.total)}</span>
          </>
        );
        return (
          <li key={`${p.perroId ?? p.nombre}-${i}`}>
            {p.perroId ? (
              <Link
                href={`/perros/${p.perroId}`}
                className="flex items-center gap-2 rounded-md px-1 py-1 active:bg-neutral-sand"
              >
                {contenido}
              </Link>
            ) : (
              <div className="flex items-center gap-2 px-1 py-1">{contenido}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
