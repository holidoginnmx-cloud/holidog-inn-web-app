import Link from "next/link";
import { formatMoneda } from "@/lib/utils";

type Dato = { perroId: string | null; nombre: string; total: number };

export function TopPerrosTable({ perros }: { perros: Dato[] }) {
  return (
    <div className="rounded-xl border border-neutral-border bg-white p-4">
      <p className="text-sm font-medium text-neutral-ink">Top perros del mes</p>
      <p className="mb-2 text-xs text-neutral-muted">Por facturación</p>
      {perros.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-muted">Sin facturación este mes.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-border text-left text-xs text-neutral-muted">
              <th className="w-7 py-1.5 font-medium">#</th>
              <th className="py-1.5 font-medium">Perro</th>
              <th className="py-1.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {perros.map((p, i) => (
              <tr
                key={`${p.perroId ?? p.nombre}-${i}`}
                className="border-b border-neutral-border/60 last:border-0"
              >
                <td className="py-1.5 font-semibold text-neutral-muted">{i + 1}</td>
                <td className="max-w-0 truncate py-1.5 text-neutral-ink">
                  {p.perroId ? (
                    <Link href={`/perros/${p.perroId}`} className="hover:underline">
                      {p.nombre}
                    </Link>
                  ) : (
                    p.nombre
                  )}
                </td>
                <td className="py-1.5 text-right font-medium tabular-nums text-neutral-ink">
                  {formatMoneda(p.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
