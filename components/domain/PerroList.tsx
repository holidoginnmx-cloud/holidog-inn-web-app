"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, Dog, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useHotkey } from "@/lib/useHotkey";
import { SIZE_ORDEN, type PetSize } from "@/lib/perro";
import { TALLA_LABEL, SERVICIO_OPTIONS, SERVICIO_LABEL, type Servicio } from "@/lib/labels";
import { EmptyState } from "./EmptyState";
import { Pills } from "./Pills";
import { PerroDialog } from "./PerroDialog";
import { type PerroListItem } from "./PerroCard";

const TODAS = "todas";
const TODOS = "todos";
const ORDEN_TALLA: PetSize[] = SIZE_ORDEN;

// Lista de perros con búsqueda instantánea por nombre (de perro o de cliente).
// El fetch ocurre en el Server Component padre; aquí solo filtramos en memoria.
export function PerroList({ perros }: { perros: PerroListItem[] }) {
  const [query, setQuery] = useState("");
  const [talla, setTalla] = useState<string>(TODAS);
  const [servicio, setServicio] = useState<string>(TODOS);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atajo: "/" enfoca la búsqueda (desktop).
  useHotkey("/", () => inputRef.current?.focus());

  // Mostramos siempre las 4 tallas, aunque aún no haya perros en alguna.
  const tallaPills = useMemo(
    () => [
      { value: TODAS, label: "Todas" },
      ...ORDEN_TALLA.map((t) => ({ value: t, label: TALLA_LABEL[t] })),
    ],
    [],
  );

  // Filtro por servicio: el perro aparece en cada servicio que tenga en su
  // historial, así que puede coincidir en más de un filtro.
  const servicioPills = useMemo(
    () => [
      { value: TODOS, label: "Todos" },
      ...SERVICIO_OPTIONS.map((s) => ({ value: s, label: SERVICIO_LABEL[s] })),
    ],
    [],
  );

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return perros.filter((p) => {
      if (talla !== TODAS && p.talla !== talla) return false;
      if (servicio !== TODOS && !p.servicios.includes(servicio as Servicio)) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.cliente?.nombre.toLowerCase().includes(q) ?? false)
      );
    });
  }, [perros, query, talla, servicio]);

  if (perros.length === 0) {
    return (
      <EmptyState
        icon={Dog}
        title="Aún no hay perros"
        description="Registra el primer perro para empezar."
        action={
          <Button asChild>
            <Link href="/perros/nuevo">
              <Plus className="size-4" aria-hidden />
              Agregar perro
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-muted"
          aria-hidden
        />
        <Input
          ref={inputRef}
          type="search"
          inputMode="search"
          placeholder="Buscar por perro o cliente…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-white pl-9"
          aria-label="Buscar perros"
        />
      </div>

      <Pills
        options={servicioPills}
        value={servicio}
        onChange={setServicio}
        ariaLabel="Filtrar por servicio"
      />

      {tallaPills.length > 2 && (
        <Pills options={tallaPills} value={talla} onChange={setTalla} ariaLabel="Filtrar por talla" />
      )}

      {filtrados.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-muted">
          Ningún perro coincide con los filtros.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {filtrados.map((perro) => (
            <li key={perro.id}>
              <PerroDialog perro={perro} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
