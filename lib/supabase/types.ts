export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      bath_config: {
        Row: {
          closeHour: number
          id: string
          isActive: boolean
          maxConcurrentBaths: number
          openHour: number
          slotMinutes: number
          updatedAt: string
        }
        Insert: {
          closeHour?: number
          id?: string
          isActive?: boolean
          maxConcurrentBaths?: number
          openHour?: number
          slotMinutes?: number
          updatedAt: string
        }
        Update: {
          closeHour?: number
          id?: string
          isActive?: boolean
          maxConcurrentBaths?: number
          openHour?: number
          slotMinutes?: number
          updatedAt?: string
        }
        Relationships: []
      }
      behavior_tags: {
        Row: {
          createdAt: string
          id: string
          notes: string | null
          petId: string
          staffId: string
          stayId: string
          tag: Database["public"]["Enums"]["BehaviorTagValue"]
        }
        Insert: {
          createdAt?: string
          id: string
          notes?: string | null
          petId: string
          staffId: string
          stayId: string
          tag: Database["public"]["Enums"]["BehaviorTagValue"]
        }
        Update: {
          createdAt?: string
          id?: string
          notes?: string | null
          petId?: string
          staffId?: string
          stayId?: string
          tag?: Database["public"]["Enums"]["BehaviorTagValue"]
        }
        Relationships: [
          {
            foreignKeyName: "behavior_tags_petId_fkey"
            columns: ["petId"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_tags_petId_fkey"
            columns: ["petId"]
            isOneToOne: false
            referencedRelation: "vw_ingresos_por_perro"
            referencedColumns: ["perro_id"]
          },
          {
            foreignKeyName: "behavior_tags_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nombre: string
          notas: string | null
          origen_legacy: boolean
          telefono: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          origen_legacy?: boolean
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          origen_legacy?: boolean
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      config: {
        Row: {
          cupo_maximo: number
          id: number
          nombre_hotel: string
          updated_at: string
        }
        Insert: {
          cupo_maximo?: number
          id?: number
          nombre_hotel?: string
          updated_at?: string
        }
        Update: {
          cupo_maximo?: number
          id?: number
          nombre_hotel?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          amount: number
          balanceAfter: number
          changeRequestId: string | null
          createdAt: string
          description: string
          id: string
          reservationId: string | null
          type: Database["public"]["Enums"]["CreditEntryType"]
          userId: string
        }
        Insert: {
          amount: number
          balanceAfter: number
          changeRequestId?: string | null
          createdAt?: string
          description: string
          id: string
          reservationId?: string | null
          type: Database["public"]["Enums"]["CreditEntryType"]
          userId: string
        }
        Update: {
          amount?: number
          balanceAfter?: number
          changeRequestId?: string | null
          createdAt?: string
          description?: string
          id?: string
          reservationId?: string | null
          type?: Database["public"]["Enums"]["CreditEntryType"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_changeRequestId_fkey"
            columns: ["changeRequestId"]
            isOneToOne: false
            referencedRelation: "reservation_change_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checklists: {
        Row: {
          additionalNotes: string | null
          bathroomBreaks: boolean
          behaviorNotes: string | null
          createdAt: string
          date: string
          energy: Database["public"]["Enums"]["EnergyLevel"]
          feedingNotes: string | null
          id: string
          mealsCompleted: boolean
          mealsNotes: string | null
          mood: Database["public"]["Enums"]["MoodLevel"]
          photosCount: number
          playtime: boolean
          reservationId: string
          rest: Database["public"]["Enums"]["RestQuality"]
          socialization: Database["public"]["Enums"]["SocializationLevel"]
          socializationDone: boolean
          staffId: string
          updatedAt: string
          videosCount: number
          walksCompleted: boolean
        }
        Insert: {
          additionalNotes?: string | null
          bathroomBreaks?: boolean
          behaviorNotes?: string | null
          createdAt?: string
          date: string
          energy: Database["public"]["Enums"]["EnergyLevel"]
          feedingNotes?: string | null
          id: string
          mealsCompleted?: boolean
          mealsNotes?: string | null
          mood: Database["public"]["Enums"]["MoodLevel"]
          photosCount?: number
          playtime?: boolean
          reservationId: string
          rest: Database["public"]["Enums"]["RestQuality"]
          socialization: Database["public"]["Enums"]["SocializationLevel"]
          socializationDone?: boolean
          staffId: string
          updatedAt: string
          videosCount?: number
          walksCompleted?: boolean
        }
        Update: {
          additionalNotes?: string | null
          bathroomBreaks?: boolean
          behaviorNotes?: string | null
          createdAt?: string
          date?: string
          energy?: Database["public"]["Enums"]["EnergyLevel"]
          feedingNotes?: string | null
          id?: string
          mealsCompleted?: boolean
          mealsNotes?: string | null
          mood?: Database["public"]["Enums"]["MoodLevel"]
          photosCount?: number
          playtime?: boolean
          reservationId?: string
          rest?: Database["public"]["Enums"]["RestQuality"]
          socialization?: Database["public"]["Enums"]["SocializationLevel"]
          socializationDone?: boolean
          staffId?: string
          updatedAt?: string
          videosCount?: number
          walksCompleted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "daily_checklists_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checklists_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "vw_ocupacion_hoy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checklists_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dewormings: {
        Row: {
          appliedAt: string
          createdAt: string
          expiresAt: string | null
          fileUrl: string | null
          id: string
          notes: string | null
          petId: string
          productName: string | null
          type: Database["public"]["Enums"]["DewormingType"]
          vetName: string | null
        }
        Insert: {
          appliedAt: string
          createdAt?: string
          expiresAt?: string | null
          fileUrl?: string | null
          id: string
          notes?: string | null
          petId: string
          productName?: string | null
          type: Database["public"]["Enums"]["DewormingType"]
          vetName?: string | null
        }
        Update: {
          appliedAt?: string
          createdAt?: string
          expiresAt?: string | null
          fileUrl?: string | null
          id?: string
          notes?: string | null
          petId?: string
          productName?: string | null
          type?: Database["public"]["Enums"]["DewormingType"]
          vetName?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dewormings_petId_fkey"
            columns: ["petId"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dewormings_petId_fkey"
            columns: ["petId"]
            isOneToOne: false
            referencedRelation: "vw_ingresos_por_perro"
            referencedColumns: ["perro_id"]
          },
        ]
      }
      egresos: {
        Row: {
          anio: number | null
          categoria: string
          created_at: string
          descripcion: string
          fecha: string
          id: string
          mes_num: number | null
          monto: number
          notas: string | null
          origen_legacy: boolean
          tipo_costo: Database["public"]["Enums"]["tipo_costo"]
        }
        Insert: {
          anio?: number | null
          categoria: string
          created_at?: string
          descripcion: string
          fecha: string
          id?: string
          mes_num?: number | null
          monto: number
          notas?: string | null
          origen_legacy?: boolean
          tipo_costo: Database["public"]["Enums"]["tipo_costo"]
        }
        Update: {
          anio?: number | null
          categoria?: string
          created_at?: string
          descripcion?: string
          fecha?: string
          id?: string
          mes_num?: number | null
          monto?: number
          notas?: string | null
          origen_legacy?: boolean
          tipo_costo?: Database["public"]["Enums"]["tipo_costo"]
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          costType: Database["public"]["Enums"]["CostType"]
          createdAt: string
          date: string
          description: string
          id: string
          notes: string | null
          originLegacy: boolean
        }
        Insert: {
          amount: number
          category: string
          costType: Database["public"]["Enums"]["CostType"]
          createdAt?: string
          date: string
          description: string
          id: string
          notes?: string | null
          originLegacy?: boolean
        }
        Update: {
          amount?: number
          category?: string
          costType?: Database["public"]["Enums"]["CostType"]
          createdAt?: string
          date?: string
          description?: string
          id?: string
          notes?: string | null
          originLegacy?: boolean
        }
        Relationships: []
      }
      hotel_config: {
        Row: {
          hotelName: string
          id: string
          maxCapacity: number
          updatedAt: string
        }
        Insert: {
          hotelName?: string
          id?: string
          maxCapacity?: number
          updatedAt: string
        }
        Update: {
          hotelName?: string
          id?: string
          maxCapacity?: number
          updatedAt?: string
        }
        Relationships: []
      }
      legal_acceptances: {
        Row: {
          acceptedAt: string
          documentType: Database["public"]["Enums"]["LegalDocumentType"]
          id: string
          ipAddress: string | null
          userAgent: string | null
          userId: string
          version: string
        }
        Insert: {
          acceptedAt?: string
          documentType: Database["public"]["Enums"]["LegalDocumentType"]
          id: string
          ipAddress?: string | null
          userAgent?: string | null
          userId: string
          version: string
        }
        Update: {
          acceptedAt?: string
          documentType?: Database["public"]["Enums"]["LegalDocumentType"]
          id?: string
          ipAddress?: string | null
          userAgent?: string | null
          userId?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_acceptances_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lodging_pricing: {
        Row: {
          daycarePricePerDay: number
          id: string
          largeWeightKg: number
          medicationSurchargePct: number
          pricePerDayLarge: number
          pricePerDaySmall: number
          priceProbarfLarge: number
          priceProbarfSmall: number
          updatedAt: string
        }
        Insert: {
          daycarePricePerDay?: number
          id?: string
          largeWeightKg?: number
          medicationSurchargePct?: number
          pricePerDayLarge?: number
          pricePerDaySmall?: number
          priceProbarfLarge?: number
          priceProbarfSmall?: number
          updatedAt: string
        }
        Update: {
          daycarePricePerDay?: number
          id?: string
          largeWeightKg?: number
          medicationSurchargePct?: number
          pricePerDayLarge?: number
          pricePerDaySmall?: number
          priceProbarfLarge?: number
          priceProbarfSmall?: number
          updatedAt?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          createdAt: string
          data: Json | null
          id: string
          isRead: boolean
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          userId: string
        }
        Insert: {
          body: string
          createdAt?: string
          data?: Json | null
          id: string
          isRead?: boolean
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          userId: string
        }
        Update: {
          body?: string
          createdAt?: string
          data?: Json | null
          id?: string
          isRead?: boolean
          title?: string
          type?: Database["public"]["Enums"]["NotificationType"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          anio: number | null
          created_at: string
          descripcion: string | null
          fecha: string
          id: string
          mes_num: number | null
          metodo_pago: string | null
          monto: number
          origen_legacy: boolean
          reservacion_id: string | null
          tipo: Database["public"]["Enums"]["pago_tipo"]
        }
        Insert: {
          anio?: number | null
          created_at?: string
          descripcion?: string | null
          fecha: string
          id?: string
          mes_num?: number | null
          metodo_pago?: string | null
          monto: number
          origen_legacy?: boolean
          reservacion_id?: string | null
          tipo?: Database["public"]["Enums"]["pago_tipo"]
        }
        Update: {
          anio?: number | null
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          mes_num?: number | null
          metodo_pago?: string | null
          monto?: number
          origen_legacy?: boolean
          reservacion_id?: string | null
          tipo?: Database["public"]["Enums"]["pago_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "pagos_reservacion_id_fkey"
            columns: ["reservacion_id"]
            isOneToOne: false
            referencedRelation: "reservaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      patrocinios: {
        Row: {
          created_at: string
          id: string
          nombre: string
          notas: string | null
          patrocina_bano: boolean
          patrocina_corral: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          notas?: string | null
          patrocina_bano?: boolean
          patrocina_corral?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          notas?: string | null
          patrocina_bano?: boolean
          patrocina_corral?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          createdAt: string
          id: string
          kind: Database["public"]["Enums"]["PaymentKind"]
          method: Database["public"]["Enums"]["PaymentMethod"]
          notes: string | null
          originLegacy: boolean
          paidAt: string | null
          reference: string | null
          reservationId: string
          status: Database["public"]["Enums"]["PaymentStatus"]
          stripePaymentIntentId: string | null
          userId: string | null
        }
        Insert: {
          amount: number
          createdAt?: string
          id: string
          kind?: Database["public"]["Enums"]["PaymentKind"]
          method: Database["public"]["Enums"]["PaymentMethod"]
          notes?: string | null
          originLegacy?: boolean
          paidAt?: string | null
          reference?: string | null
          reservationId: string
          status?: Database["public"]["Enums"]["PaymentStatus"]
          stripePaymentIntentId?: string | null
          userId?: string | null
        }
        Update: {
          amount?: number
          createdAt?: string
          id?: string
          kind?: Database["public"]["Enums"]["PaymentKind"]
          method?: Database["public"]["Enums"]["PaymentMethod"]
          notes?: string | null
          originLegacy?: boolean
          paidAt?: string | null
          reference?: string | null
          reservationId?: string
          status?: Database["public"]["Enums"]["PaymentStatus"]
          stripePaymentIntentId?: string | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "vw_ocupacion_hoy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      perros: {
        Row: {
          alergias: string | null
          cartilla_foto_url: string | null
          cartilla_vence: string | null
          cartilla_vigente: boolean
          cliente_id: string
          comportamiento: string | null
          created_at: string
          desparasitacion_vence: string | null
          desparasitacion_vigente: boolean
          domicilio: string | null
          esterilizado: boolean | null
          fecha_nacimiento: string | null
          foto_url: string | null
          id: string
          nombre: string
          notas: string | null
          origen_legacy: boolean
          peso_kg: number | null
          raza: string | null
          sexo: Database["public"]["Enums"]["sexo_perro"] | null
          talla: Database["public"]["Enums"]["talla_perro"] | null
          updated_at: string
          veterinario: string | null
        }
        Insert: {
          alergias?: string | null
          cartilla_foto_url?: string | null
          cartilla_vence?: string | null
          cartilla_vigente?: boolean
          cliente_id: string
          comportamiento?: string | null
          created_at?: string
          desparasitacion_vence?: string | null
          desparasitacion_vigente?: boolean
          domicilio?: string | null
          esterilizado?: boolean | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nombre: string
          notas?: string | null
          origen_legacy?: boolean
          peso_kg?: number | null
          raza?: string | null
          sexo?: Database["public"]["Enums"]["sexo_perro"] | null
          talla?: Database["public"]["Enums"]["talla_perro"] | null
          updated_at?: string
          veterinario?: string | null
        }
        Update: {
          alergias?: string | null
          cartilla_foto_url?: string | null
          cartilla_vence?: string | null
          cartilla_vigente?: boolean
          cliente_id?: string
          comportamiento?: string | null
          created_at?: string
          desparasitacion_vence?: string | null
          desparasitacion_vigente?: boolean
          domicilio?: string | null
          esterilizado?: boolean | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          origen_legacy?: boolean
          peso_kg?: number | null
          raza?: string | null
          sexo?: Database["public"]["Enums"]["sexo_perro"] | null
          talla?: Database["public"]["Enums"]["talla_perro"] | null
          updated_at?: string
          veterinario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          behavior: string | null
          birthDate: string | null
          breed: string | null
          cartillaPhotos: string[] | null
          cartillaRejectionReason: string | null
          cartillaReviewedAt: string | null
          cartillaReviewedById: string | null
          cartillaStatus: Database["public"]["Enums"]["CartillaStatus"] | null
          cartillaUrl: string | null
          createdAt: string
          diet: string | null
          emergencyContactName: string | null
          emergencyContactPhone: string | null
          emergencyContactRelation: string | null
          feedingAmount: string | null
          feedingInstructions: string | null
          feedingSchedule: string | null
          foodType: string | null
          healthIssues: string | null
          id: string
          isActive: boolean
          isNeutered: boolean
          name: string
          notes: string | null
          ownerId: string
          personality: string | null
          photoUrl: string | null
          sex: string | null
          size: Database["public"]["Enums"]["PetSize"]
          updatedAt: string
          vetEmergency24h: boolean
          vetName: string | null
          vetPhone: string | null
          walkPreference: string | null
          weight: number | null
        }
        Insert: {
          behavior?: string | null
          birthDate?: string | null
          breed?: string | null
          cartillaPhotos?: string[] | null
          cartillaRejectionReason?: string | null
          cartillaReviewedAt?: string | null
          cartillaReviewedById?: string | null
          cartillaStatus?: Database["public"]["Enums"]["CartillaStatus"] | null
          cartillaUrl?: string | null
          createdAt?: string
          diet?: string | null
          emergencyContactName?: string | null
          emergencyContactPhone?: string | null
          emergencyContactRelation?: string | null
          feedingAmount?: string | null
          feedingInstructions?: string | null
          feedingSchedule?: string | null
          foodType?: string | null
          healthIssues?: string | null
          id: string
          isActive?: boolean
          isNeutered?: boolean
          name: string
          notes?: string | null
          ownerId: string
          personality?: string | null
          photoUrl?: string | null
          sex?: string | null
          size: Database["public"]["Enums"]["PetSize"]
          updatedAt: string
          vetEmergency24h?: boolean
          vetName?: string | null
          vetPhone?: string | null
          walkPreference?: string | null
          weight?: number | null
        }
        Update: {
          behavior?: string | null
          birthDate?: string | null
          breed?: string | null
          cartillaPhotos?: string[] | null
          cartillaRejectionReason?: string | null
          cartillaReviewedAt?: string | null
          cartillaReviewedById?: string | null
          cartillaStatus?: Database["public"]["Enums"]["CartillaStatus"] | null
          cartillaUrl?: string | null
          createdAt?: string
          diet?: string | null
          emergencyContactName?: string | null
          emergencyContactPhone?: string | null
          emergencyContactRelation?: string | null
          feedingAmount?: string | null
          feedingInstructions?: string | null
          feedingSchedule?: string | null
          foodType?: string | null
          healthIssues?: string | null
          id?: string
          isActive?: boolean
          isNeutered?: boolean
          name?: string
          notes?: string | null
          ownerId?: string
          personality?: string | null
          photoUrl?: string | null
          sex?: string | null
          size?: Database["public"]["Enums"]["PetSize"]
          updatedAt?: string
          vetEmergency24h?: boolean
          vetName?: string | null
          vetPhone?: string | null
          walkPreference?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_cartillaReviewedById_fkey"
            columns: ["cartillaReviewedById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          createdAt: string
          id: string
          platform: string
          token: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          id: string
          platform: string
          token: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          platform?: string
          token?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reservaciones: {
        Row: {
          anticipo_acordado: number | null
          created_at: string
          estado: Database["public"]["Enums"]["reservacion_estado"]
          fecha_fin: string | null
          fecha_inicio: string
          hora_check_in: string | null
          hora_check_out: string | null
          id: string
          notas: string | null
          origen_legacy: boolean
          perro_id: string
          precio_acordado: number
          servicio: Database["public"]["Enums"]["servicio_tipo"]
          updated_at: string
        }
        Insert: {
          anticipo_acordado?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["reservacion_estado"]
          fecha_fin?: string | null
          fecha_inicio: string
          hora_check_in?: string | null
          hora_check_out?: string | null
          id?: string
          notas?: string | null
          origen_legacy?: boolean
          perro_id: string
          precio_acordado?: number
          servicio: Database["public"]["Enums"]["servicio_tipo"]
          updated_at?: string
        }
        Update: {
          anticipo_acordado?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["reservacion_estado"]
          fecha_fin?: string | null
          fecha_inicio?: string
          hora_check_in?: string | null
          hora_check_out?: string | null
          id?: string
          notas?: string | null
          origen_legacy?: boolean
          perro_id?: string
          precio_acordado?: number
          servicio?: Database["public"]["Enums"]["servicio_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservaciones_perro_id_fkey"
            columns: ["perro_id"]
            isOneToOne: false
            referencedRelation: "perros"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_addons: {
        Row: {
          completedAt: string | null
          createdAt: string
          extraCortePrice: number | null
          extraDescription: string | null
          extraDeslanadoPrice: number | null
          extraPaidAt: string | null
          extraPaymentStatus:
            | Database["public"]["Enums"]["AddonExtraPaymentStatus"]
            | null
          extraPrice: number | null
          extraSetAt: string | null
          extraSetById: string | null
          extraStripePaymentIntentId: string | null
          id: string
          paidWith: Database["public"]["Enums"]["AddonPaymentSource"]
          paymentId: string | null
          reservationId: string
          unitPrice: number
          variantId: string
        }
        Insert: {
          completedAt?: string | null
          createdAt?: string
          extraCortePrice?: number | null
          extraDescription?: string | null
          extraDeslanadoPrice?: number | null
          extraPaidAt?: string | null
          extraPaymentStatus?:
            | Database["public"]["Enums"]["AddonExtraPaymentStatus"]
            | null
          extraPrice?: number | null
          extraSetAt?: string | null
          extraSetById?: string | null
          extraStripePaymentIntentId?: string | null
          id: string
          paidWith: Database["public"]["Enums"]["AddonPaymentSource"]
          paymentId?: string | null
          reservationId: string
          unitPrice: number
          variantId: string
        }
        Update: {
          completedAt?: string | null
          createdAt?: string
          extraCortePrice?: number | null
          extraDescription?: string | null
          extraDeslanadoPrice?: number | null
          extraPaidAt?: string | null
          extraPaymentStatus?:
            | Database["public"]["Enums"]["AddonExtraPaymentStatus"]
            | null
          extraPrice?: number | null
          extraSetAt?: string | null
          extraSetById?: string | null
          extraStripePaymentIntentId?: string | null
          id?: string
          paidWith?: Database["public"]["Enums"]["AddonPaymentSource"]
          paymentId?: string | null
          reservationId?: string
          unitPrice?: number
          variantId?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_addons_extraSetById_fkey"
            columns: ["extraSetById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_addons_paymentId_fkey"
            columns: ["paymentId"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_addons_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_addons_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "vw_ocupacion_hoy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_addons_variantId_fkey"
            columns: ["variantId"]
            isOneToOne: false
            referencedRelation: "service_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_change_requests: {
        Row: {
          approvedAt: string | null
          approvedById: string | null
          createdAt: string
          deltaAmount: number
          id: string
          newCheckIn: string
          newCheckOut: string
          newTotalAmount: number
          newTotalDays: number
          paidAt: string | null
          payOnPickup: boolean
          refundChoice: Database["public"]["Enums"]["RefundChoice"] | null
          rejectionReason: string | null
          requestedById: string
          reservationId: string
          status: Database["public"]["Enums"]["ChangeRequestStatus"]
          updatedAt: string
        }
        Insert: {
          approvedAt?: string | null
          approvedById?: string | null
          createdAt?: string
          deltaAmount: number
          id: string
          newCheckIn: string
          newCheckOut: string
          newTotalAmount: number
          newTotalDays: number
          paidAt?: string | null
          payOnPickup?: boolean
          refundChoice?: Database["public"]["Enums"]["RefundChoice"] | null
          rejectionReason?: string | null
          requestedById: string
          reservationId: string
          status?: Database["public"]["Enums"]["ChangeRequestStatus"]
          updatedAt: string
        }
        Update: {
          approvedAt?: string | null
          approvedById?: string | null
          createdAt?: string
          deltaAmount?: number
          id?: string
          newCheckIn?: string
          newCheckOut?: string
          newTotalAmount?: number
          newTotalDays?: number
          paidAt?: string | null
          payOnPickup?: boolean
          refundChoice?: Database["public"]["Enums"]["RefundChoice"] | null
          rejectionReason?: string | null
          requestedById?: string
          reservationId?: string
          status?: Database["public"]["Enums"]["ChangeRequestStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_change_requests_approvedById_fkey"
            columns: ["approvedById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_change_requests_requestedById_fkey"
            columns: ["requestedById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_change_requests_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_change_requests_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "vw_ocupacion_hoy"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          appointmentAt: string | null
          checkIn: string | null
          checkOut: string | null
          createdAt: string
          depositAgreed: number | null
          depositDeadline: string | null
          groupId: string | null
          id: string
          legalAccepted: boolean
          medicationNotes: string | null
          notes: string | null
          originLegacy: boolean
          ownerId: string
          paymentType: string | null
          petId: string
          reservationType: Database["public"]["Enums"]["ReservationType"]
          roomId: string | null
          staffId: string | null
          status: Database["public"]["Enums"]["ReservationStatus"]
          totalAmount: number
          totalDays: number | null
          updatedAt: string
        }
        Insert: {
          appointmentAt?: string | null
          checkIn?: string | null
          checkOut?: string | null
          createdAt?: string
          depositAgreed?: number | null
          depositDeadline?: string | null
          groupId?: string | null
          id: string
          legalAccepted?: boolean
          medicationNotes?: string | null
          notes?: string | null
          originLegacy?: boolean
          ownerId: string
          paymentType?: string | null
          petId: string
          reservationType?: Database["public"]["Enums"]["ReservationType"]
          roomId?: string | null
          staffId?: string | null
          status?: Database["public"]["Enums"]["ReservationStatus"]
          totalAmount: number
          totalDays?: number | null
          updatedAt: string
        }
        Update: {
          appointmentAt?: string | null
          checkIn?: string | null
          checkOut?: string | null
          createdAt?: string
          depositAgreed?: number | null
          depositDeadline?: string | null
          groupId?: string | null
          id?: string
          legalAccepted?: boolean
          medicationNotes?: string | null
          notes?: string | null
          originLegacy?: boolean
          ownerId?: string
          paymentType?: string | null
          petId?: string
          reservationType?: Database["public"]["Enums"]["ReservationType"]
          roomId?: string | null
          staffId?: string | null
          status?: Database["public"]["Enums"]["ReservationStatus"]
          totalAmount?: number
          totalDays?: number | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_petId_fkey"
            columns: ["petId"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_petId_fkey"
            columns: ["petId"]
            isOneToOne: false
            referencedRelation: "vw_ingresos_por_perro"
            referencedColumns: ["perro_id"]
          },
          {
            foreignKeyName: "reservations_roomId_fkey"
            columns: ["roomId"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          createdAt: string
          id: string
          ownerId: string
          rating: number
          reservationId: string
        }
        Insert: {
          comment?: string | null
          createdAt?: string
          id: string
          ownerId: string
          rating: number
          reservationId: string
        }
        Update: {
          comment?: string | null
          createdAt?: string
          id?: string
          ownerId?: string
          rating?: number
          reservationId?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "vw_ocupacion_hoy"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          createdAt: string
          description: string | null
          id: string
          isActive: boolean
          name: string
          photoUrl: string | null
          sizeAllowed: Database["public"]["Enums"]["PetSize"][] | null
          updatedAt: string
        }
        Insert: {
          capacity?: number
          createdAt?: string
          description?: string | null
          id: string
          isActive?: boolean
          name: string
          photoUrl?: string | null
          sizeAllowed?: Database["public"]["Enums"]["PetSize"][] | null
          updatedAt: string
        }
        Update: {
          capacity?: number
          createdAt?: string
          description?: string | null
          id?: string
          isActive?: boolean
          name?: string
          photoUrl?: string | null
          sizeAllowed?: Database["public"]["Enums"]["PetSize"][] | null
          updatedAt?: string
        }
        Relationships: []
      }
      service_types: {
        Row: {
          code: string
          createdAt: string
          id: string
          isActive: boolean
          name: string
        }
        Insert: {
          code: string
          createdAt?: string
          id: string
          isActive?: boolean
          name: string
        }
        Update: {
          code?: string
          createdAt?: string
          id?: string
          isActive?: boolean
          name?: string
        }
        Relationships: []
      }
      service_variants: {
        Row: {
          corte: boolean
          deslanado: boolean
          id: string
          isActive: boolean
          petSize: Database["public"]["Enums"]["PetSize"]
          price: number
          serviceTypeId: string
          updatedAt: string
        }
        Insert: {
          corte: boolean
          deslanado: boolean
          id: string
          isActive?: boolean
          petSize: Database["public"]["Enums"]["PetSize"]
          price: number
          serviceTypeId: string
          updatedAt: string
        }
        Update: {
          corte?: boolean
          deslanado?: boolean
          id?: string
          isActive?: boolean
          petSize?: Database["public"]["Enums"]["PetSize"]
          price?: number
          serviceTypeId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_variants_serviceTypeId_fkey"
            columns: ["serviceTypeId"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          createdAt: string
          id: string
          isActive: boolean
          name: string
          notes: string | null
          sponsorsBath: boolean
          sponsorsKennel: boolean
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id: string
          isActive?: boolean
          name: string
          notes?: string | null
          sponsorsBath?: boolean
          sponsorsKennel?: boolean
          updatedAt: string
        }
        Update: {
          createdAt?: string
          id?: string
          isActive?: boolean
          name?: string
          notes?: string | null
          sponsorsBath?: boolean
          sponsorsKennel?: boolean
          updatedAt?: string
        }
        Relationships: []
      }
      staff_alerts: {
        Row: {
          createdAt: string
          description: string
          id: string
          isResolved: boolean
          petId: string
          reservationId: string
          resolvedAt: string | null
          staffId: string
          type: Database["public"]["Enums"]["AlertType"]
        }
        Insert: {
          createdAt?: string
          description: string
          id: string
          isResolved?: boolean
          petId: string
          reservationId: string
          resolvedAt?: string | null
          staffId: string
          type: Database["public"]["Enums"]["AlertType"]
        }
        Update: {
          createdAt?: string
          description?: string
          id?: string
          isResolved?: boolean
          petId?: string
          reservationId?: string
          resolvedAt?: string | null
          staffId?: string
          type?: Database["public"]["Enums"]["AlertType"]
        }
        Relationships: [
          {
            foreignKeyName: "staff_alerts_petId_fkey"
            columns: ["petId"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_alerts_petId_fkey"
            columns: ["petId"]
            isOneToOne: false
            referencedRelation: "vw_ingresos_por_perro"
            referencedColumns: ["perro_id"]
          },
          {
            foreignKeyName: "staff_alerts_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_alerts_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "vw_ocupacion_hoy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_alerts_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stay_updates: {
        Row: {
          caption: string | null
          createdAt: string
          id: string
          mediaType: string
          mediaUrl: string
          petId: string
          reservationId: string
          staffId: string | null
        }
        Insert: {
          caption?: string | null
          createdAt?: string
          id: string
          mediaType?: string
          mediaUrl: string
          petId: string
          reservationId: string
          staffId?: string | null
        }
        Update: {
          caption?: string | null
          createdAt?: string
          id?: string
          mediaType?: string
          mediaUrl?: string
          petId?: string
          reservationId?: string
          staffId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stay_updates_petId_fkey"
            columns: ["petId"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_updates_petId_fkey"
            columns: ["petId"]
            isOneToOne: false
            referencedRelation: "vw_ingresos_por_perro"
            referencedColumns: ["perro_id"]
          },
          {
            foreignKeyName: "stay_updates_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_updates_reservationId_fkey"
            columns: ["reservationId"]
            isOneToOne: false
            referencedRelation: "vw_ocupacion_hoy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_updates_staffId_fkey"
            columns: ["staffId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          id: string
          payload: Json
          processedAt: string
          type: string
        }
        Insert: {
          id: string
          payload: Json
          processedAt?: string
          type: string
        }
        Update: {
          id?: string
          payload?: Json
          processedAt?: string
          type?: string
        }
        Relationships: []
      }
      tarifas: {
        Row: {
          codigo: string
          etiqueta: string
          orden: number
          precio: number
          servicio: Database["public"]["Enums"]["servicio_tipo"]
          updated_at: string
        }
        Insert: {
          codigo: string
          etiqueta: string
          orden?: number
          precio?: number
          servicio: Database["public"]["Enums"]["servicio_tipo"]
          updated_at?: string
        }
        Update: {
          codigo?: string
          etiqueta?: string
          orden?: number
          precio?: number
          servicio?: Database["public"]["Enums"]["servicio_tipo"]
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatarUrl: string | null
          clerkId: string | null
          createdAt: string
          creditBalance: number
          email: string
          firstName: string
          id: string
          isActive: boolean
          lastCreditEntryAt: string | null
          lastName: string
          originLegacy: boolean
          phone: string | null
          role: Database["public"]["Enums"]["Role"]
          updatedAt: string
        }
        Insert: {
          avatarUrl?: string | null
          clerkId?: string | null
          createdAt?: string
          creditBalance?: number
          email: string
          firstName: string
          id: string
          isActive?: boolean
          lastCreditEntryAt?: string | null
          lastName: string
          originLegacy?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["Role"]
          updatedAt: string
        }
        Update: {
          avatarUrl?: string | null
          clerkId?: string | null
          createdAt?: string
          creditBalance?: number
          email?: string
          firstName?: string
          id?: string
          isActive?: boolean
          lastCreditEntryAt?: string | null
          lastName?: string
          originLegacy?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["Role"]
          updatedAt?: string
        }
        Relationships: []
      }
      vaccine_catalog: {
        Row: {
          code: string
          createdAt: string
          defaultDurationDays: number
          description: string | null
          displayName: string
          id: string
          isActive: boolean
          updatedAt: string
        }
        Insert: {
          code: string
          createdAt?: string
          defaultDurationDays: number
          description?: string | null
          displayName: string
          id: string
          isActive?: boolean
          updatedAt: string
        }
        Update: {
          code?: string
          createdAt?: string
          defaultDurationDays?: number
          description?: string | null
          displayName?: string
          id?: string
          isActive?: boolean
          updatedAt?: string
        }
        Relationships: []
      }
      vaccines: {
        Row: {
          appliedAt: string
          catalogId: string | null
          createdAt: string
          expiresAt: string | null
          fileUrl: string | null
          id: string
          name: string
          petId: string
          reminded0dAt: string | null
          reminded30dAt: string | null
          reminded7dAt: string | null
          vetName: string | null
        }
        Insert: {
          appliedAt: string
          catalogId?: string | null
          createdAt?: string
          expiresAt?: string | null
          fileUrl?: string | null
          id: string
          name: string
          petId: string
          reminded0dAt?: string | null
          reminded30dAt?: string | null
          reminded7dAt?: string | null
          vetName?: string | null
        }
        Update: {
          appliedAt?: string
          catalogId?: string | null
          createdAt?: string
          expiresAt?: string | null
          fileUrl?: string | null
          id?: string
          name?: string
          petId?: string
          reminded0dAt?: string | null
          reminded30dAt?: string | null
          reminded7dAt?: string | null
          vetName?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccines_catalogId_fkey"
            columns: ["catalogId"]
            isOneToOne: false
            referencedRelation: "vaccine_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccines_petId_fkey"
            columns: ["petId"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccines_petId_fkey"
            columns: ["petId"]
            isOneToOne: false
            referencedRelation: "vw_ingresos_por_perro"
            referencedColumns: ["perro_id"]
          },
        ]
      }
    }
    Views: {
      vw_egresos_mensuales: {
        Row: {
          anio: number | null
          cantidad_movimientos: number | null
          mes_nombre: string | null
          mes_num: number | null
          total_egresos: number | null
        }
        Relationships: []
      }
      vw_egresos_por_categoria: {
        Row: {
          anio: number | null
          categoria: string | null
          mes_num: number | null
          tipo_costo: Database["public"]["Enums"]["CostType"] | null
          total: number | null
        }
        Relationships: []
      }
      vw_ingresos_mensuales: {
        Row: {
          anio: number | null
          cantidad_pagos: number | null
          mes_nombre: string | null
          mes_num: number | null
          total_ingresos: number | null
        }
        Relationships: []
      }
      vw_ingresos_por_perro: {
        Row: {
          anio: number | null
          mes_num: number | null
          perro_id: string | null
          perro_nombre: string | null
          total: number | null
        }
        Relationships: []
      }
      vw_ingresos_por_servicio: {
        Row: {
          anio: number | null
          cantidad_pagos: number | null
          mes_num: number | null
          servicio: string | null
          total: number | null
        }
        Relationships: []
      }
      vw_ocupacion_hoy: {
        Row: {
          cliente: string | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string | null
          perro: string | null
          servicio: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      aplicar_migracion_legacy: { Args: { payload: Json }; Returns: Json }
    }
    Enums: {
      AddonExtraPaymentStatus: "PENDING_PAYMENT" | "PAY_ON_PICKUP" | "PAID"
      AddonPaymentSource: "BOOKING" | "STANDALONE"
      AlertType:
        | "NOT_EATING"
        | "LETHARGIC"
        | "BEHAVIOR_ISSUE"
        | "HEALTH_CONCERN"
        | "INCIDENT"
      BehaviorTagValue:
        | "CALM"
        | "ANXIOUS"
        | "DOMINANT"
        | "SOCIABLE"
        | "SHY"
        | "AGGRESSIVE"
      CartillaStatus: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED"
      ChangeRequestStatus: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
      CostType: "FIJO" | "VARIABLE" | "SUELDO" | "MARKETING" | "REINVERSION"
      CreditEntryType:
        | "CREDIT_ADDED"
        | "CREDIT_APPLIED"
        | "CREDIT_ADJUSTED"
        | "CREDIT_EXPIRED"
      DewormingType: "INTERNAL" | "EXTERNAL" | "BOTH"
      EnergyLevel: "LOW" | "MEDIUM" | "HIGH"
      LegalDocumentType:
        | "TOS"
        | "PRIVACY"
        | "IMAGE_USE"
        | "VET_AUTH"
        | "INCIDENT_POLICY"
      MoodLevel: "SAD" | "NEUTRAL" | "HAPPY" | "EXCITED"
      NotificationType:
        | "RESERVATION_CONFIRMED"
        | "RESERVATION_REMINDER"
        | "CHECK_IN"
        | "CHECK_OUT"
        | "NEW_UPDATE"
        | "PAYMENT_RECEIVED"
        | "GENERAL"
        | "DAILY_REPORT"
        | "STAFF_ALERT"
        | "REVIEW_REQUEST"
        | "RESERVATION_CHANGE_REQUESTED"
        | "RESERVATION_CHANGE_APPROVED"
        | "RESERVATION_CHANGE_REJECTED"
        | "REFUND_ISSUED"
        | "CREDIT_ADDED"
        | "CREDIT_APPLIED"
        | "NEW_RESERVATION"
        | "STAFF_ASSIGNED"
        | "CHECKLIST_REMINDER"
        | "VACCINE_EXPIRING"
      pago_tipo: "ANTICIPO" | "ABONO" | "RESTANTE"
      PaymentKind: "ANTICIPO" | "ABONO" | "RESTANTE" | "FULL"
      PaymentMethod: "CASH" | "CARD" | "TRANSFER" | "CREDIT" | "STRIPE"
      PaymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED"
      PetSize: "XS" | "S" | "M" | "L" | "XL"
      RefundChoice: "STRIPE_REFUND" | "CREDIT"
      reservacion_estado: "RESERVADA" | "EN_CURSO" | "FINALIZADA" | "CANCELADA"
      ReservationStatus:
        | "CONFIRMED"
        | "CHECKED_IN"
        | "CHECKED_OUT"
        | "CANCELLED"
      ReservationType: "STAY" | "BATH" | "DAYCARE"
      RestQuality: "POOR" | "FAIR" | "GOOD"
      Role: "OWNER" | "STAFF" | "ADMIN"
      servicio_tipo: "HOTEL" | "ESTETICA" | "GUARDERIA"
      sexo_perro: "MACHO" | "HEMBRA"
      SocializationLevel: "ISOLATED" | "SELECTIVE" | "SOCIAL"
      talla_perro: "EXTRA_CHICO" | "CHICO" | "MEDIANO" | "GRANDE"
      tipo_costo: "FIJO" | "VARIABLE" | "SUELDO" | "MARKETING" | "REINVERSION"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      AddonExtraPaymentStatus: ["PENDING_PAYMENT", "PAY_ON_PICKUP", "PAID"],
      AddonPaymentSource: ["BOOKING", "STANDALONE"],
      AlertType: [
        "NOT_EATING",
        "LETHARGIC",
        "BEHAVIOR_ISSUE",
        "HEALTH_CONCERN",
        "INCIDENT",
      ],
      BehaviorTagValue: [
        "CALM",
        "ANXIOUS",
        "DOMINANT",
        "SOCIABLE",
        "SHY",
        "AGGRESSIVE",
      ],
      CartillaStatus: ["PENDING", "APPROVED", "REJECTED", "EXPIRED"],
      ChangeRequestStatus: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      CostType: ["FIJO", "VARIABLE", "SUELDO", "MARKETING", "REINVERSION"],
      CreditEntryType: [
        "CREDIT_ADDED",
        "CREDIT_APPLIED",
        "CREDIT_ADJUSTED",
        "CREDIT_EXPIRED",
      ],
      DewormingType: ["INTERNAL", "EXTERNAL", "BOTH"],
      EnergyLevel: ["LOW", "MEDIUM", "HIGH"],
      LegalDocumentType: [
        "TOS",
        "PRIVACY",
        "IMAGE_USE",
        "VET_AUTH",
        "INCIDENT_POLICY",
      ],
      MoodLevel: ["SAD", "NEUTRAL", "HAPPY", "EXCITED"],
      NotificationType: [
        "RESERVATION_CONFIRMED",
        "RESERVATION_REMINDER",
        "CHECK_IN",
        "CHECK_OUT",
        "NEW_UPDATE",
        "PAYMENT_RECEIVED",
        "GENERAL",
        "DAILY_REPORT",
        "STAFF_ALERT",
        "REVIEW_REQUEST",
        "RESERVATION_CHANGE_REQUESTED",
        "RESERVATION_CHANGE_APPROVED",
        "RESERVATION_CHANGE_REJECTED",
        "REFUND_ISSUED",
        "CREDIT_ADDED",
        "CREDIT_APPLIED",
        "NEW_RESERVATION",
        "STAFF_ASSIGNED",
        "CHECKLIST_REMINDER",
        "VACCINE_EXPIRING",
      ],
      pago_tipo: ["ANTICIPO", "ABONO", "RESTANTE"],
      PaymentKind: ["ANTICIPO", "ABONO", "RESTANTE", "FULL"],
      PaymentMethod: ["CASH", "CARD", "TRANSFER", "CREDIT", "STRIPE"],
      PaymentStatus: ["UNPAID", "PARTIAL", "PAID", "REFUNDED"],
      PetSize: ["XS", "S", "M", "L", "XL"],
      RefundChoice: ["STRIPE_REFUND", "CREDIT"],
      reservacion_estado: ["RESERVADA", "EN_CURSO", "FINALIZADA", "CANCELADA"],
      ReservationStatus: [
        "CONFIRMED",
        "CHECKED_IN",
        "CHECKED_OUT",
        "CANCELLED",
      ],
      ReservationType: ["STAY", "BATH", "DAYCARE"],
      RestQuality: ["POOR", "FAIR", "GOOD"],
      Role: ["OWNER", "STAFF", "ADMIN"],
      servicio_tipo: ["HOTEL", "ESTETICA", "GUARDERIA"],
      sexo_perro: ["MACHO", "HEMBRA"],
      SocializationLevel: ["ISOLATED", "SELECTIVE", "SOCIAL"],
      talla_perro: ["EXTRA_CHICO", "CHICO", "MEDIANO", "GRANDE"],
      tipo_costo: ["FIJO", "VARIABLE", "SUELDO", "MARKETING", "REINVERSION"],
    },
  },
} as const
