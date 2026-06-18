"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, Check, Trash2, BadgeCheck } from "lucide-react";
import { aprobarResena, eliminarResena } from "@/app/(dashboard)/tienda/actions";

export type ResenaItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  isApproved: boolean;
  orderId: string | null;
  createdAt: string;
  productName: string;
};

const fmtFecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

export function ResenasManager({ resenas }: { resenas: ResenaItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function onAprobar(id: string) {
    setPendingId(id);
    const res = await aprobarResena(id);
    if (res.ok) {
      toast.success("Reseña publicada.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setPendingId(null);
  }

  async function onEliminar(id: string) {
    setPendingId(id);
    const res = await eliminarResena(id);
    if (res.ok) {
      toast.success("Reseña eliminada.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setPendingId(null);
  }

  if (resenas.length === 0) {
    return (
      <div className="border-neutral-border rounded-lg border bg-white p-8 text-center">
        <p className="text-neutral-muted text-sm">No hay reseñas todavía.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {resenas.map((r) => (
        <li
          key={r.id}
          className={`rounded-lg border bg-white p-4 ${r.isApproved ? "border-neutral-border" : "border-brand-mustard/60 bg-brand-mustard/5"}`}
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`size-4 ${r.rating >= i ? "fill-brand-mustard text-brand-mustard" : "text-neutral-border fill-transparent"}`}
                  />
                ))}
              </span>
              {r.orderId && (
                <span className="text-brand-teal inline-flex items-center gap-1 text-xs">
                  <BadgeCheck className="size-3.5" /> Verificada
                </span>
              )}
            </div>
            {!r.isApproved && (
              <span className="bg-brand-mustard/20 text-brand-mustard rounded-full px-2 py-0.5 text-xs font-medium">
                Pendiente
              </span>
            )}
          </div>

          <p className="text-neutral-muted text-xs">{r.productName}</p>
          {r.title && <p className="text-neutral-ink text-sm font-semibold">{r.title}</p>}
          <p className="text-neutral-ink mt-1 text-sm">{r.body}</p>
          <p className="text-neutral-muted mt-1 text-xs">
            {r.authorName} · {fmtFecha.format(new Date(r.createdAt))}
          </p>

          <div className="mt-3 flex gap-2">
            {!r.isApproved && (
              <button
                onClick={() => onAprobar(r.id)}
                disabled={pendingId === r.id}
                className="bg-brand-teal hover:bg-brand-teal/90 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                <Check className="size-3.5" /> Aprobar
              </button>
            )}
            <button
              onClick={() => onEliminar(r.id)}
              disabled={pendingId === r.id}
              className="border-neutral-border text-destructive hover:bg-destructive/5 inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              <Trash2 className="size-3.5" /> Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
