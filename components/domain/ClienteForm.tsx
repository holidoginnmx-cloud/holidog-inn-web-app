"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PerroFormValues } from "./PerroForm";

// Sub-componente del PerroForm: captura los datos del cliente (dueño).
// Lee el form del contexto de react-hook-form (FormProvider en PerroForm).
export function ClienteForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext<PerroFormValues>();
  const e = errors.cliente;

  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-sm font-semibold text-brand-teal">Cliente (dueño)</legend>

      <div className="space-y-1.5">
        <Label htmlFor="cliente-nombre">Nombre *</Label>
        <Input
          id="cliente-nombre"
          autoComplete="name"
          className="bg-white"
          {...register("cliente.nombre", { required: "El nombre del cliente es obligatorio" })}
        />
        {e?.nombre && <p className="text-destructive text-xs">{e.nombre.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cliente-telefono">Teléfono</Label>
          <Input
            id="cliente-telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="bg-white"
            {...register("cliente.telefono")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cliente-email">Correo</Label>
          <Input
            id="cliente-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="bg-white"
            {...register("cliente.email")}
          />
          {e?.email && <p className="text-destructive text-xs">{e.email.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cliente-notas">Notas del cliente</Label>
        <Textarea id="cliente-notas" rows={2} className="bg-white" {...register("cliente.notas")} />
      </div>
    </fieldset>
  );
}
