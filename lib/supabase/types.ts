// Tipos de la base de datos Holidog Inn.
//
// Escritos a mano a partir de schema.sql siguiendo el formato de
// `supabase gen types typescript`. Cuando haya una BD remota conectada,
// `npm run db:types` regenerará este archivo de forma idéntica.
//
// Columnas generadas (perros.talla, pagos/egresos.mes_num/anio) aparecen en
// `Row` pero NO en `Insert`/`Update`: Postgres las calcula.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string;
          nombre: string;
          telefono: string | null;
          email: string | null;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          telefono?: string | null;
          email?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          telefono?: string | null;
          email?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patrocinios: {
        Row: {
          id: string;
          nombre: string;
          patrocina_bano: boolean;
          patrocina_corral: boolean;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          patrocina_bano?: boolean;
          patrocina_corral?: boolean;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          patrocina_bano?: boolean;
          patrocina_corral?: boolean;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      perros: {
        Row: {
          id: string;
          cliente_id: string;
          nombre: string;
          raza: string | null;
          sexo: Database["public"]["Enums"]["sexo_perro"] | null;
          fecha_nacimiento: string | null;
          peso_kg: number | null;
          talla: Database["public"]["Enums"]["talla_perro"] | null;
          foto_url: string | null;
          alergias: string | null;
          comportamiento: string | null;
          veterinario: string | null;
          esterilizado: boolean | null;
          notas: string | null;
          domicilio: string | null;
          cartilla_vigente: boolean;
          cartilla_vence: string | null;
          cartilla_foto_url: string | null;
          desparasitacion_vigente: boolean;
          desparasitacion_vence: string | null;
          origen_legacy: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          nombre: string;
          raza?: string | null;
          sexo?: Database["public"]["Enums"]["sexo_perro"] | null;
          fecha_nacimiento?: string | null;
          peso_kg?: number | null;
          talla?: Database["public"]["Enums"]["talla_perro"] | null;
          foto_url?: string | null;
          alergias?: string | null;
          comportamiento?: string | null;
          veterinario?: string | null;
          esterilizado?: boolean | null;
          notas?: string | null;
          domicilio?: string | null;
          cartilla_vigente?: boolean;
          cartilla_vence?: string | null;
          cartilla_foto_url?: string | null;
          desparasitacion_vigente?: boolean;
          desparasitacion_vence?: string | null;
          origen_legacy?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string;
          nombre?: string;
          raza?: string | null;
          sexo?: Database["public"]["Enums"]["sexo_perro"] | null;
          fecha_nacimiento?: string | null;
          peso_kg?: number | null;
          talla?: Database["public"]["Enums"]["talla_perro"] | null;
          foto_url?: string | null;
          alergias?: string | null;
          comportamiento?: string | null;
          veterinario?: string | null;
          esterilizado?: boolean | null;
          notas?: string | null;
          domicilio?: string | null;
          cartilla_vigente?: boolean;
          cartilla_vence?: string | null;
          cartilla_foto_url?: string | null;
          desparasitacion_vigente?: boolean;
          desparasitacion_vence?: string | null;
          origen_legacy?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "perros_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      reservaciones: {
        Row: {
          id: string;
          perro_id: string;
          servicio: Database["public"]["Enums"]["servicio_tipo"];
          fecha_inicio: string;
          fecha_fin: string | null;
          hora_check_in: string | null;
          hora_check_out: string | null;
          precio_acordado: number;
          anticipo_acordado: number | null;
          estado: Database["public"]["Enums"]["reservacion_estado"];
          notas: string | null;
          origen_legacy: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          perro_id: string;
          servicio: Database["public"]["Enums"]["servicio_tipo"];
          fecha_inicio: string;
          fecha_fin?: string | null;
          hora_check_in?: string | null;
          hora_check_out?: string | null;
          precio_acordado?: number;
          anticipo_acordado?: number | null;
          estado?: Database["public"]["Enums"]["reservacion_estado"];
          notas?: string | null;
          origen_legacy?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          perro_id?: string;
          servicio?: Database["public"]["Enums"]["servicio_tipo"];
          fecha_inicio?: string;
          fecha_fin?: string | null;
          hora_check_in?: string | null;
          hora_check_out?: string | null;
          precio_acordado?: number;
          anticipo_acordado?: number | null;
          estado?: Database["public"]["Enums"]["reservacion_estado"];
          notas?: string | null;
          origen_legacy?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservaciones_perro_id_fkey";
            columns: ["perro_id"];
            isOneToOne: false;
            referencedRelation: "perros";
            referencedColumns: ["id"];
          },
        ];
      };
      pagos: {
        Row: {
          id: string;
          reservacion_id: string | null;
          monto: number;
          tipo: Database["public"]["Enums"]["pago_tipo"];
          fecha: string;
          metodo_pago: string | null;
          descripcion: string | null;
          mes_num: number;
          anio: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          reservacion_id?: string | null;
          monto: number;
          tipo?: Database["public"]["Enums"]["pago_tipo"];
          fecha: string;
          metodo_pago?: string | null;
          descripcion?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reservacion_id?: string | null;
          monto?: number;
          tipo?: Database["public"]["Enums"]["pago_tipo"];
          fecha?: string;
          metodo_pago?: string | null;
          descripcion?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pagos_reservacion_id_fkey";
            columns: ["reservacion_id"];
            isOneToOne: false;
            referencedRelation: "reservaciones";
            referencedColumns: ["id"];
          },
        ];
      };
      egresos: {
        Row: {
          id: string;
          fecha: string;
          descripcion: string;
          monto: number;
          categoria: string;
          tipo_costo: Database["public"]["Enums"]["tipo_costo"];
          notas: string | null;
          mes_num: number;
          anio: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          fecha: string;
          descripcion: string;
          monto: number;
          categoria: string;
          tipo_costo: Database["public"]["Enums"]["tipo_costo"];
          notas?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          fecha?: string;
          descripcion?: string;
          monto?: number;
          categoria?: string;
          tipo_costo?: Database["public"]["Enums"]["tipo_costo"];
          notas?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      config: {
        Row: {
          id: number;
          cupo_maximo: number;
          nombre_hotel: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          cupo_maximo?: number;
          nombre_hotel?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          cupo_maximo?: number;
          nombre_hotel?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tarifas: {
        Row: {
          codigo: string;
          servicio: Database["public"]["Enums"]["servicio_tipo"];
          etiqueta: string;
          precio: number;
          orden: number;
          updated_at: string;
        };
        Insert: {
          codigo: string;
          servicio: Database["public"]["Enums"]["servicio_tipo"];
          etiqueta: string;
          precio?: number;
          orden?: number;
          updated_at?: string;
        };
        Update: {
          codigo?: string;
          servicio?: Database["public"]["Enums"]["servicio_tipo"];
          etiqueta?: string;
          precio?: number;
          orden?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      vw_ocupacion_hoy: {
        Row: {
          id: string | null;
          perro: string | null;
          cliente: string | null;
          fecha_inicio: string | null;
          fecha_fin: string | null;
          servicio: Database["public"]["Enums"]["servicio_tipo"] | null;
          estado: Database["public"]["Enums"]["reservacion_estado"] | null;
        };
        Relationships: [];
      };
      vw_ingresos_mensuales: {
        Row: {
          anio: number | null;
          mes_num: number | null;
          mes_nombre: string | null;
          total_ingresos: number | null;
          cantidad_pagos: number | null;
        };
        Relationships: [];
      };
      vw_egresos_mensuales: {
        Row: {
          anio: number | null;
          mes_num: number | null;
          mes_nombre: string | null;
          total_egresos: number | null;
          cantidad_movimientos: number | null;
        };
        Relationships: [];
      };
      vw_egresos_por_categoria: {
        Row: {
          anio: number | null;
          mes_num: number | null;
          categoria: string | null;
          tipo_costo: Database["public"]["Enums"]["tipo_costo"] | null;
          total: number | null;
        };
        Relationships: [];
      };
      vw_ingresos_por_servicio: {
        Row: {
          anio: number | null;
          mes_num: number | null;
          servicio: Database["public"]["Enums"]["servicio_tipo"] | null;
          total: number | null;
          cantidad_pagos: number | null;
        };
        Relationships: [];
      };
      vw_ingresos_por_perro: {
        Row: {
          anio: number | null;
          mes_num: number | null;
          perro_id: string | null;
          perro_nombre: string | null;
          total: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      aplicar_migracion_legacy: {
        Args: { payload: Json };
        Returns: Json;
      };
    };
    Enums: {
      servicio_tipo: "HOTEL" | "ESTETICA" | "GUARDERIA";
      pago_tipo: "ANTICIPO" | "ABONO" | "RESTANTE";
      reservacion_estado: "RESERVADA" | "EN_CURSO" | "FINALIZADA" | "CANCELADA";
      tipo_costo: "FIJO" | "VARIABLE" | "SUELDO" | "MARKETING" | "REINVERSION";
      sexo_perro: "MACHO" | "HEMBRA";
      talla_perro: "EXTRA_CHICO" | "CHICO" | "MEDIANO" | "GRANDE";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ---------------------------------------------------------------------------
// Helpers ergonómicos (mismo nombre que produce `supabase gen types`).
// ---------------------------------------------------------------------------
type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
