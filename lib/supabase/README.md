# lib/supabase

Acceso a la base de datos. **No hay ORM**: usamos `@supabase/supabase-js` con tipos
generados (ver CLAUDE.md §2).

## Archivos

| Archivo           | Qué es                                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `server.ts`       | Cliente de **servidor** (SERVICE_ROLE_KEY, `server-only`). El default.                                                                   |
| `client.ts`       | Cliente de **navegador** (anon key). Solo en client components que de verdad consulten en el cliente.                                    |
| `store-server.ts` | Cliente de servidor tipado para las tablas de **tienda** (`StoreDB`).                                                                    |
| `types.ts`        | Tipos **generados** (`npm run db:types`). Excepción: las columnas `address`/`addressLat`/`addressLng`/`addressPlaceId` de `users` se añadieron a mano (existen en la DB, el generador estaba desactualizado); al regenerar, confirma que sigan. |
| `store-types.ts`  | Tipos **a mano** de las tablas de tienda (las gestiona Prisma en otro repo, columnas camelCase). Provisional hasta regenerar `types.ts`. |
| `helpers.ts`      | `one()`: normaliza un embed de PostgREST (objeto o array de 1) a `T \| null`.                                                            |

¿Qué cliente uso? Casi siempre `createSupabaseServerClient()`. Para las pantallas de
**tienda** (`app/(dashboard)/tienda/**`), `createStoreServerClient()`.

## ⚠️ Dos familias de tablas en la MISMA base

Tras el "repunte al esquema unificado en inglés", conviven dos generaciones de tablas:

- **Nuevas (en inglés, compartidas con la app móvil — usar SIEMPRE estas):**
  `users`, `pets`, `reservations`, `payments`, `expenses`, `reservation_addons`,
  `service_variants`, `dewormings`, `vaccines`, `hotel_config`, etc.
- **Legacy (en español, datos migrados del Excel — NO escribir):**
  `clientes`, `perros`, `reservaciones`, `pagos`, `egresos`, `config`, `tarifas`…

El admin lee/escribe **solo las tablas nuevas**. Las legacy quedan como histórico.

### Consecuencia práctica (campos del formulario de perro)

`pets` (esquema nuevo) **no tiene** `domicilio`, `cartilla_vence` ni
`desparasitacion_*`. Esas columnas solo existen en la tabla legacy `perros`. En el
esquema nuevo, la desparasitación es la tabla aparte `dewormings` y la cartilla se
maneja con `cartillaStatus` + `vaccines`. Por eso `PerroForm` pide esos campos pero
`perroAMascota()` (en `app/(dashboard)/perros/actions.ts`) los ignora al guardar.
Conectarlos NO es un mapeo simple: requiere migrar el schema compartido con la app
móvil o integrarse con `dewormings`/`vaccines` — es trabajo de feature, no limpieza.
