# CLAUDE.md — Holidog Inn

> Archivo de contexto para Claude Code. Léelo completo al iniciar cualquier sesión.

## 1. Qué es este proyecto

Holidog Inn es un hotel para perros con tres servicios: **HOTEL** (estancias), **ESTÉTICA** (baño/corte) y **GUARDERÍA** (día). El dueño venía operando toda la administración en un Excel y ahora migramos a una app web propia.

**Usuario:** uno solo (el dueño). No hay multi-tenant ni roles. La app es interna, no de cara al cliente final.

**Dispositivo principal:** móvil. Todo se diseña mobile-first y se prueba en viewport de 375-414px antes que en desktop.

## 2. Stack

| Capa             | Tecnología                                              |
|------------------|---------------------------------------------------------|
| Framework        | Next.js 15+ (App Router, TypeScript estricto)           |
| Auth             | Clerk                                                   |
| Base de datos    | Supabase (Postgres) + Supabase Storage (fotos)          |
| Cliente DB       | `@supabase/supabase-js` con tipos generados            |
| Estilos          | Tailwind CSS v4 + shadcn/ui                             |
| Iconos           | lucide-react                                            |
| Fechas           | date-fns (locale `es`)                                  |
| Forms            | react-hook-form + zod                                   |
| Charts dashboard | Recharts                                                |
| Deploy           | Vercel                                                  |

**Decisiones explícitas:**
- **No usamos ORM.** El cliente de Supabase + tipos generados es suficiente y mantiene la complejidad baja. Si una query es muy compleja, se hace SQL view o RPC en Supabase.
- **Server Components por default.** Solo se usa `"use client"` cuando hay estado o interactividad.
- **Server Actions** para mutaciones (insert/update/delete). Nada de Route Handlers REST salvo que sea estrictamente necesario.

## 3. Identidad visual

Colores extraídos del logo oficial:

```css
/* tailwind.config.ts → theme.extend.colors */
brand: {
  teal:    '#063F52',  /* color del texto "holidog inn" */
  mustard: '#EB9B22',  /* color de la huella y la cama */
}
```

Paleta de soporte (warm/tierra/pastel):

```css
neutral: {
  cream:  '#FAF6F0',  /* fondo de la app */
  sand:   '#F0E8D8',  /* tarjetas / surfaces secundarias */
  border: '#E5DDD0',  /* bordes sutiles */
  ink:    '#1A1A1A',  /* texto principal */
  muted:  '#6B6B6B',  /* texto secundario */
}
```

**Reglas de uso:**
- Fondo de la app: `cream`. Cards/Surfaces: blanco o `sand` muy sutil.
- Acción primaria (botones): `teal`. Hover: `teal` con opacidad o un shade más oscuro.
- Acentos, estados positivos, highlights: `mustard`.
- Tipografía: usar `Inter` por default. Para el header del logo (si se renderiza en HTML), una opción display tipo `Caveat` o `Fraunces` para la palabra "dog".

## 4. Modelo de datos

Ver `schema.sql` para el detalle completo. Resumen:

```
clientes ── tienen ── perros
                         ├── vacunas (solo cartilla, no por vacuna)
                         └── reservaciones (HOTEL / ESTETICA / GUARDERIA)
                                  └── pagos (ANTICIPO / ABONO / RESTANTE)
egresos (independiente, con categoría y tipo_costo)
config (cupo_maximo, nombre_hotel)
```

**Reglas de negocio importantes:**

1. **Cada renglón histórico del Excel = un pago individual.** Una reservación se compone de N pagos. El total de una reservación es `SUM(pagos.monto)`. El campo `precio_acordado` en `reservaciones` es lo que se cotizó; puede diferir del total pagado.
2. **Talla del perro se calcula automáticamente** desde `peso_kg` (columna generada, ver schema):
   - `< 10kg` → CHICO
   - `10-25kg` → MEDIANO
   - `25-40kg` → GRANDE
   - `> 40kg` → GIGANTE
3. **Anticipo es flexible.** No hay regla fija. El campo `anticipo_acordado` es opcional. Algunos clientes pagan anticipo, otros no.
4. **Precio es flexible.** Varía por tamaño del perro y caso por caso. No hay catálogo fijo.
5. **Cupo máximo** está en `config.cupo_maximo` (default 20). El calendario muestra `cupo_actual / cupo_máximo` por día.
6. **Vacunas:** solo guardamos si la cartilla está vigente (`cartilla_vigente` boolean) y opcionalmente cuándo vence (`cartilla_vence`). No trackeamos vacunas individuales.
7. **Egresos** tienen estas categorías reales (vistas en el Excel): `Transporte / Logística`, `Bano/ Estetica`, `RH / Asistente`, `Servicios básicos`, `Limpieza / Insumos`, `Administración / Oficina`, `Marketing / Ads`, `Marketing / Merchandising`, `Reinvención / Mobiliario`, `Reinvención / Obra`, `Reinvención / Equipamiento`, `tienda/ Estetica`, `FESTEJO`, `CAFE VAINILLA`, `mantenimiento`. Mantener `categoria` como `text` libre (no enum) para que el dueño cree nuevas sin migración. El `tipo_costo` sí es enum (`FIJO`, `VARIABLE`, `SUELDO`, `MARKETING`, `REINVERSION`).

## 5. Estructura de carpetas esperada

```
app/
  (auth)/
    sign-in/[[...sign-in]]/page.tsx
    sign-up/[[...sign-up]]/page.tsx
  (dashboard)/
    layout.tsx                         # bottom-nav móvil + header
    page.tsx                           # dashboard (resumen)
    perros/
      page.tsx                         # lista
      nuevo/page.tsx
      [id]/page.tsx                    # ficha del perro
      [id]/editar/page.tsx
    clientes/...
    reservaciones/
      page.tsx                         # calendario
      nueva/page.tsx
      [id]/page.tsx
    ingresos/                          # captura rápida de pagos
    egresos/                           # captura rápida de egresos
    config/page.tsx
  api/
    (solo si es estrictamente necesario; preferir Server Actions)
components/
  ui/                                  # shadcn primitives
  domain/                              # PerroCard, PagoForm, CalendarioReservaciones, etc.
  layout/                              # BottomNav, AppHeader
lib/
  supabase/
    client.ts                          # browser client
    server.ts                          # server client (con service role en server-only)
    types.ts                           # generado con `supabase gen types`
  validations/                         # schemas de zod por entidad
  utils.ts
  date.ts                              # helpers con date-fns en español
middleware.ts                          # Clerk authMiddleware
```

## 6. Convenciones de código

- **TypeScript estricto.** `strict: true`, sin `any` salvo justificación con comentario.
- **No `useEffect` para fetch.** Server Components o Server Actions. Si hace falta cliente, `swr` o `@tanstack/react-query`.
- **Validación con zod en el server.** Toda Server Action valida input con zod antes de tocar la DB.
- **Errores de DB no se devuelven crudos al cliente.** Loguear el detalle, devolver mensaje genérico.
- **Spanish-first.** Todo el UI en español. Mensajes de error en español. Formatos de fecha y moneda en `es-MX` (`Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`).
- **Mobile-first.** Cada componente se diseña primero en mobile y se ajusta con breakpoints de Tailwind (`sm:`, `md:`…) para desktop.
- **Server Actions retornan `{ ok: true, data } | { ok: false, error }`** para que los formularios manejen estados uniformemente.

## 7. Auth (Clerk + Supabase)

Single user, pero auth completo igual:

1. Clerk maneja sign-in/sign-up.
2. El middleware protege todo bajo `(dashboard)`.
3. En el servidor, Supabase se llama con la `SERVICE_ROLE_KEY` (nunca expuesta al cliente). No usamos el flujo de JWT de Clerk → Supabase porque con un solo usuario es over-engineering.
4. RLS habilitado por hábito, con policy permisiva para `authenticated`.

**Variables de entorno necesarias (`.env.local`):**

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 8. Datos históricos (migración)

El archivo `migrate_excel.py` genera 5 CSVs (`clientes`, `perros`, `reservaciones`, `pagos`, `egresos`) desde el Excel original. **Ya está validado: los totales cuadran exactamente con el Excel.**

Después de correr el schema en Supabase:
1. Ejecutar `python migrate_excel.py HOLIDOG_INN_2026.xlsx ./out` localmente.
2. En Supabase → Table Editor, importar los CSVs en este orden: `clientes`, `perros`, `reservaciones`, `pagos`, `egresos`.
3. Las reservaciones migradas tienen `origen_legacy = true` y estado `FINALIZADA`. El cliente y el perro vienen como placeholders (`Cliente — <NOMBRE>`); el dueño los completa después.

## 9. Cosas que NO hay que hacer

- ❌ No introducir un ORM (Prisma/Drizzle) salvo que se pida explícitamente. Supabase client + tipos generados es la decisión.
- ❌ No agregar i18n. Todo es español-MX.
- ❌ No agregar gestión de roles ni permisos por usuario.
- ❌ No usar `localStorage` para persistir datos del negocio (todo va en Supabase).
- ❌ No exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.
- ❌ No instalar librerías de animación pesadas (Framer Motion solo si hace falta para una transición específica).
- ❌ No crear endpoints REST en `app/api/*` para CRUD; usar Server Actions.
