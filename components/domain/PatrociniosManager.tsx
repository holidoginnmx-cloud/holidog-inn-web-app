"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  crearPatrocinio,
  actualizarPatrocinio,
  eliminarPatrocinio,
} from "@/app/(dashboard)/config/patrocinios/actions";

export type PatrocinioRow = {
  id: string;
  nombre: string;
  patrocina_bano: boolean;
  patrocina_corral: boolean;
};

export function PatrociniosManager({ inicial }: { inicial: PatrocinioRow[] }) {
  const [rows, setRows] = useState<PatrocinioRow[]>(inicial);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [creando, setCreando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);

  // Persiste la fila completa; revierte el estado local si falla.
  async function guardar(row: PatrocinioRow, previo: PatrocinioRow) {
    const res = await actualizarPatrocinio(row.id, {
      nombre: row.nombre,
      patrocina_bano: row.patrocina_bano,
      patrocina_corral: row.patrocina_corral,
    });
    if (!res.ok) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? previo : r)));
      toast.error(res.error);
    }
  }

  function toggle(id: string, campo: "patrocina_bano" | "patrocina_corral", valor: boolean) {
    let previo: PatrocinioRow | undefined;
    let actualizada: PatrocinioRow | undefined;
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        previo = r;
        actualizada = { ...r, [campo]: valor };
        return actualizada;
      }),
    );
    if (actualizada && previo) void guardar(actualizada, previo);
  }

  function editarNombre(id: string, nombre: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, nombre } : r)));
  }

  async function guardarNombre(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    const nombre = row.nombre.trim();
    if (!nombre) {
      toast.error("El nombre no puede quedar vacío.");
      return;
    }
    const res = await actualizarPatrocinio(id, {
      nombre,
      patrocina_bano: row.patrocina_bano,
      patrocina_corral: row.patrocina_corral,
    });
    if (!res.ok) toast.error(res.error);
  }

  async function agregar() {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    setCreando(true);
    const res = await crearPatrocinio({
      nombre,
      patrocina_bano: false,
      patrocina_corral: false,
    });
    setCreando(false);
    if (res.ok) {
      setRows((rs) => [
        ...rs,
        { id: res.data.id, nombre, patrocina_bano: false, patrocina_corral: false },
      ]);
      setNuevoNombre("");
    } else {
      toast.error(res.error);
    }
  }

  async function borrar(id: string) {
    setBorrando(id);
    const res = await eliminarPatrocinio(id);
    setBorrando(null);
    if (res.ok) {
      setRows((rs) => rs.filter((r) => r.id !== id));
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-neutral-border bg-white">
        {/* Encabezado de columnas */}
        <div className="flex items-center gap-2 border-b border-neutral-border px-3 py-2 text-xs font-semibold text-neutral-muted">
          <span className="flex-1">Patrocinador</span>
          <span className="w-12 text-center">Baño</span>
          <span className="w-12 text-center">Corral</span>
          <span className="w-8" />
        </div>

        {rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-neutral-muted">
            Sin patrocinadores todavía.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-border">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-2 px-3 py-2">
                <Input
                  value={r.nombre}
                  onChange={(e) => editarNombre(r.id, e.target.value)}
                  onBlur={() => guardarNombre(r.id)}
                  className="h-9 flex-1 border-transparent bg-transparent px-1 focus-visible:border-neutral-border focus-visible:bg-white"
                  aria-label="Nombre del patrocinador"
                />
                <span className="flex w-12 justify-center">
                  <Switch
                    checked={r.patrocina_bano}
                    onCheckedChange={(v) => toggle(r.id, "patrocina_bano", v)}
                    aria-label={`${r.nombre} patrocina baño`}
                  />
                </span>
                <span className="flex w-12 justify-center">
                  <Switch
                    checked={r.patrocina_corral}
                    onCheckedChange={(v) => toggle(r.id, "patrocina_corral", v)}
                    aria-label={`${r.nombre} patrocina corral`}
                  />
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0 text-neutral-muted"
                  disabled={borrando === r.id}
                  onClick={() => borrar(r.id)}
                  aria-label={`Eliminar ${r.nombre}`}
                >
                  {borrando === r.id ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="size-4" aria-hidden />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Alta de nuevo patrocinador */}
      <div className="flex items-center gap-2">
        <Input
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void agregar();
            }
          }}
          placeholder="Nuevo patrocinador…"
          className="flex-1 bg-white"
        />
        <Button onClick={() => void agregar()} disabled={creando || !nuevoNombre.trim()}>
          {creando ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
          Agregar
        </Button>
      </div>
    </div>
  );
}
