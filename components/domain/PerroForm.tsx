"use client";

import { useState } from "react";
import { useForm, FormProvider, Controller, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, ImagePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ClienteForm } from "./ClienteForm";
import { TallaBadge } from "./TallaBadge";
import { calcularTalla, TALLA_RANGO, TALLA_LABEL, type Talla } from "@/lib/perro";
import { comprimirImagen } from "@/lib/image";
import { crearClienteYPerro, actualizarClienteYPerro } from "@/app/(dashboard)/perros/actions";

export type PerroFormValues = {
  cliente: { nombre: string; telefono: string; email: string; notas: string };
  perro: {
    nombre: string;
    raza: string;
    sexo: "" | "MACHO" | "HEMBRA";
    talla: "" | Talla;
    fecha_nacimiento: string;
    peso_kg: string;
    alergias: string;
    comportamiento: string;
    veterinario: string;
    esterilizado: "" | "SI" | "NO";
    notas: string;
    cartilla_vigente: boolean;
    cartilla_vence: string;
  };
};

export const VALORES_VACIOS: PerroFormValues = {
  cliente: { nombre: "", telefono: "", email: "", notas: "" },
  perro: {
    nombre: "",
    raza: "",
    sexo: "",
    talla: "",
    fecha_nacimiento: "",
    peso_kg: "",
    alergias: "",
    comportamiento: "",
    veterinario: "",
    esterilizado: "",
    notas: "",
    cartilla_vigente: false,
    cartilla_vence: "",
  },
};

type Props =
  | { mode: "crear" }
  | {
      mode: "editar";
      perroId: string;
      clienteId: string;
      initial: PerroFormValues;
      fotoActualUrl: string | null;
    };

const inputSelectClass =
  "flex h-11 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function PerroForm(props: Props) {
  const router = useRouter();
  const methods = useForm<PerroFormValues>({
    defaultValues: props.mode === "editar" ? props.initial : VALORES_VACIOS,
  });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = methods;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    props.mode === "editar" ? props.fotoActualUrl : null,
  );
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // useWatch (en vez de methods.watch) es compatible con React Compiler.
  const pesoStr = useWatch({ control, name: "perro.peso_kg" });
  const talla: Talla | null = calcularTalla(pesoStr ? Number(pesoStr) : null);

  function onPickFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setFile(f);
  }

  async function onValid(values: PerroFormValues) {
    setErrorMsg(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("cliente.nombre", values.cliente.nombre);
      fd.set("cliente.telefono", values.cliente.telefono);
      fd.set("cliente.email", values.cliente.email);
      fd.set("cliente.notas", values.cliente.notas);
      fd.set("perro.nombre", values.perro.nombre);
      fd.set("perro.raza", values.perro.raza);
      fd.set("perro.sexo", values.perro.sexo);
      fd.set("perro.talla", values.perro.talla);
      fd.set("perro.fecha_nacimiento", values.perro.fecha_nacimiento);
      fd.set("perro.peso_kg", values.perro.peso_kg);
      fd.set("perro.alergias", values.perro.alergias);
      fd.set("perro.comportamiento", values.perro.comportamiento);
      fd.set("perro.veterinario", values.perro.veterinario);
      fd.set("perro.esterilizado", values.perro.esterilizado);
      fd.set("perro.notas", values.perro.notas);
      fd.set("perro.cartilla_vigente", values.perro.cartilla_vigente ? "true" : "false");
      fd.set("perro.cartilla_vence", values.perro.cartilla_vence);

      if (file) {
        const comprimida = await comprimirImagen(file);
        fd.set("foto", comprimida);
      }

      const res =
        props.mode === "crear"
          ? await crearClienteYPerro(fd)
          : await actualizarClienteYPerro(props.perroId, props.clienteId, fd);

      if (res.ok) {
        // Mantenemos `pending` para evitar doble envío mientras navegamos.
        router.push(`/perros/${res.data.perroId}`);
        router.refresh();
        return;
      }
      setErrorMsg(res.error);
      setPending(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocurrió un error inesperado.");
      setPending(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onValid)} className="space-y-8 pb-4">
        {/* Foto */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative size-28 overflow-hidden rounded-full bg-neutral-sand">
            {preview ? (
              <Image
                src={preview}
                alt="Vista previa de la foto"
                fill
                sizes="112px"
                unoptimized
                className="object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-neutral-muted">
                <ImagePlus className="size-8" aria-hidden />
              </span>
            )}
          </div>
          <label className="cursor-pointer text-sm font-medium text-brand-teal">
            {preview ? "Cambiar foto" : "Agregar foto"}
            <input type="file" accept="image/*" className="hidden" onChange={onPickFoto} />
          </label>
        </div>

        <ClienteForm />

        {/* Perro */}
        <fieldset className="space-y-4">
          <legend className="mb-1 text-sm font-semibold text-brand-teal">Perro</legend>

          <div className="space-y-1.5">
            <Label htmlFor="perro-nombre">Nombre *</Label>
            <Input
              id="perro-nombre"
              className="bg-white"
              {...register("perro.nombre", { required: "El nombre del perro es obligatorio" })}
            />
            {errors.perro?.nombre && (
              <p className="text-destructive text-xs">{errors.perro.nombre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="perro-raza">Raza</Label>
              <Input id="perro-raza" className="bg-white" {...register("perro.raza")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="perro-sexo">Sexo</Label>
              <select id="perro-sexo" className={inputSelectClass} {...register("perro.sexo")}>
                <option value="">—</option>
                <option value="MACHO">Macho</option>
                <option value="HEMBRA">Hembra</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="perro-fnac">Fecha de nacimiento</Label>
              <Input
                id="perro-fnac"
                type="date"
                className="bg-white"
                {...register("perro.fecha_nacimiento")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="perro-peso">Peso (kg)</Label>
              <Input
                id="perro-peso"
                type="number"
                step="0.1"
                min="0"
                inputMode="decimal"
                className="bg-white"
                {...register("perro.peso_kg")}
              />
            </div>
          </div>

          {/* Talla: si hay peso, la calcula la BD (peso manda). Si no, se elige a mano. */}
          {talla ? (
            <div className="flex items-center gap-2 rounded-md bg-neutral-sand/50 px-3 py-2 text-sm">
              <span className="text-neutral-muted">Talla (calculada del peso):</span>
              <TallaBadge talla={talla} />
              <span className="text-neutral-muted">{TALLA_RANGO[talla]}</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="perro-talla">Talla</Label>
              <select id="perro-talla" className={inputSelectClass} {...register("perro.talla")}>
                <option value="">—</option>
                <option value="EXTRA_CHICO">
                  {TALLA_LABEL.EXTRA_CHICO} ({TALLA_RANGO.EXTRA_CHICO})
                </option>
                <option value="CHICO">{TALLA_LABEL.CHICO} ({TALLA_RANGO.CHICO})</option>
                <option value="MEDIANO">{TALLA_LABEL.MEDIANO} ({TALLA_RANGO.MEDIANO})</option>
                <option value="GRANDE">{TALLA_LABEL.GRANDE} ({TALLA_RANGO.GRANDE})</option>
              </select>
              <p className="text-neutral-muted text-xs">
                Si capturas el peso, la talla se calcula sola.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="perro-veterinario">Veterinario</Label>
              <Input
                id="perro-veterinario"
                className="bg-white"
                {...register("perro.veterinario")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="perro-esterilizado">Esterilizado</Label>
              <select
                id="perro-esterilizado"
                className={inputSelectClass}
                {...register("perro.esterilizado")}
              >
                <option value="">—</option>
                <option value="SI">Sí</option>
                <option value="NO">No</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="perro-alergias">Alergias</Label>
            <Textarea
              id="perro-alergias"
              rows={2}
              className="bg-white"
              {...register("perro.alergias")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="perro-comportamiento">Comportamiento</Label>
            <Textarea
              id="perro-comportamiento"
              rows={2}
              className="bg-white"
              {...register("perro.comportamiento")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="perro-notas">Notas</Label>
            <Textarea id="perro-notas" rows={2} className="bg-white" {...register("perro.notas")} />
          </div>

          {/* Cartilla */}
          <div className="space-y-3 rounded-md border border-neutral-border p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="perro-cartilla" className="cursor-pointer">
                Cartilla vigente
              </Label>
              <Controller
                control={control}
                name="perro.cartilla_vigente"
                render={({ field }) => (
                  <Switch
                    id="perro-cartilla"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="perro-cartilla-vence">Vence (opcional)</Label>
              <Input
                id="perro-cartilla-vence"
                type="date"
                className="bg-white"
                {...register("perro.cartilla_vence")}
              />
            </div>
          </div>
        </fieldset>

        {errorMsg && (
          <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
            {errorMsg}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {props.mode === "crear" ? "Guardar perro" : "Guardar cambios"}
        </Button>
      </form>
    </FormProvider>
  );
}
