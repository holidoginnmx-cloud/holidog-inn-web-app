# Parches SQL puntuales

Scripts de **cierre de datos**, ya aplicados en producción (Supabase). Son de una
sola ejecución y **NO deben volver a correrse** (varios no son idempotentes:
re-ejecutarlos duplicaría montos). Se guardan solo como historial de qué se tocó
y por qué. No son migraciones de schema (esas viven aparte, numeradas).

> ⚠️ Si vuelves a importar el Excel desde cero (`/config/migrar`), revisa estos
> parches: insertan filas con `origen_legacy = false` para que el reimport no las
> borre, así que podrían quedar **duplicadas** tras un reimport. Ver
> `MEMORY.md → migracion-parches-manuales`.

| Archivo | Qué hace | Monto |
|---|---|---|
| `agregar_mayo_egresos.sql` | 4 egresos del 31/05/2026 que el Excel no alcanzó a registrar. | +$6,500.00 |
| `agregar_mayo_faltante.sql` | 13 ingresos (pagos) de mayo 2026 faltantes; enlaza perros por nombre y reporta los que no resuelve. | +$6,766.28 |
| `agregar_mayo_revisar.sql` | Crea placeholders `REVISAR` para las 6 filas que el script anterior no pudo enlazar (NALA, TOBY, NALA REYNOSO, DORA GRAJEDA). Se resuelven luego en `/perros/revisar`. | +$3,007.35 |
| `fix_fechas_redondeo.sql` | Corrige 13 filas cuya fecha cruzó de mes por el bug `Math.round` del importador (3 egresos 28/02→01/03, 10 pagos 31/03→01/04 y 30/04→01/05). Idempotente. | — |
