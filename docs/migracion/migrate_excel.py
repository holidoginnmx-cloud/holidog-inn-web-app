#!/usr/bin/env python3
"""
Holidog Inn — Migración del Excel 2026 a CSVs para Supabase.

Uso:
    python migrate_excel.py /ruta/al/HOLIDOG_INN_2026.xlsx ./out

Salida (en ./out):
    clientes.csv          — un cliente placeholder por cada nombre único de perro
    perros.csv            — un perro por nombre único
    reservaciones.csv     — agrupa pagos por (perro, servicio, mes) como una reservación legacy
    pagos.csv             — todos los pagos del Excel, vinculados a su reservación
    egresos.csv           — todos los egresos del Excel

Heurística de migración:
    - El Excel registra PAGOS individuales (anticipo, restante, final). No hay IDs.
    - Agrupamos: pagos del MISMO perro + MISMO servicio + MISMO mes => 1 reservación.
    - Cliente placeholder: "Cliente — <nombre del perro>" para que tú edites después.
    - Pagos con "ANTICIPO" en descripción se marcan tipo=ANTICIPO; "RESTANTE" => RESTANTE; resto => ABONO.
    - origen_legacy=true en reservaciones para diferenciar las migradas.

Después de generar los CSVs, súbelos por el Table Editor de Supabase en este orden:
    1. clientes
    2. perros
    3. reservaciones
    4. pagos
    5. egresos
"""
from __future__ import annotations

import csv
import sys
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

import openpyxl


EXCEL_EPOCH = datetime(1899, 12, 30)
SHEET_NAME = "2026"


def excel_serial_to_date(serial) -> datetime | None:
    """Convierte un valor de fecha de Excel a datetime.

    openpyxl con data_only=True devuelve datetime directo si la celda tiene
    formato fecha, pero algunas celdas pueden venir como float (serial).
    """
    if serial is None:
        return None
    if isinstance(serial, datetime):
        return serial
    try:
        return EXCEL_EPOCH + timedelta(days=float(serial))
    except (ValueError, TypeError):
        return None


def normalize_servicio(s: str | None) -> str:
    """Normaliza el campo SERVICIO al enum del schema."""
    if not s:
        return "HOTEL"
    s = s.strip().upper()
    if "ESTÉT" in s or "ESTET" in s:
        return "ESTETICA"
    if "GUARDER" in s:
        return "GUARDERIA"
    return "HOTEL"


def normalize_tipo_costo(t: str | None) -> str:
    """Normaliza TIPO DE COSTO al enum."""
    if not t:
        return "VARIABLE"
    t = t.strip().upper()
    mapping = {
        "FIJO": "FIJO",
        "FIJOS": "FIJO",
        "VARIABLE": "VARIABLE",
        "SUELDO": "SUELDO",
        "MARKETING": "MARKETING",
        "REINVERSIÓN": "REINVERSION",
        "REINVERSION": "REINVERSION",
    }
    return mapping.get(t, "VARIABLE")


def classify_pago_tipo(descripcion: str) -> str:
    """Detecta si un pago es ANTICIPO, RESTANTE o ABONO basado en la descripción."""
    d = (descripcion or "").upper()
    if "ANTICIPO" in d or "ANICIPO" in d:  # typo común en el Excel
        return "ANTICIPO"
    if "RESTANTE" in d:
        return "RESTANTE"
    return "ABONO"


def clean_dog_name(descripcion: str) -> str:
    """Limpia el nombre del perro removiendo etiquetas como ANTICIPO/RESTANTE."""
    d = (descripcion or "").strip().upper()
    for prefix in ["ANTICIPO ", "ANICIPO ", "RESTANTE ", "ANTICIPOS "]:
        if d.startswith(prefix):
            d = d[len(prefix):]
    if d.endswith(" ANTICIPO"):
        d = d[: -len(" ANTICIPO")]
    if d.endswith(" RESTANTE"):
        d = d[: -len(" RESTANTE")]
    return d.strip()


def parse_excel(xlsx_path: Path):
    """Lee el Excel y devuelve (lista_pagos, lista_egresos) como dicts crudos."""
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    ws = wb[SHEET_NAME]

    pagos_raw = []
    egresos_raw = []

    # Layout real del Excel (verificado fila 9 en adelante):
    #   col  1 (A): fecha ingreso (datetime)
    #   col  2 (B): MES_NUM
    #   col  3 (C): MES
    #   col  4 (D): descripción (nombre perro)
    #   col  5 (E): monto
    #   col  6 (F): servicio (HOTEL / ESTÉTICA / GUARDERÍA)
    #   col  7 (G): semana
    #   col  9 (I): fecha egreso (datetime)
    #   col 10 (J): MES
    #   col 11 (K): descripción egreso
    #   col 12 (L): monto egreso
    #   col 13 (M): categoría
    #   col 14 (N): tipo de costo
    for row in ws.iter_rows(min_row=9, values_only=True):
        if len(row) < 6:
            continue

        # --- INGRESO ---
        fecha_in = excel_serial_to_date(row[0])
        descripcion_in = row[3]
        monto_in = row[4]
        servicio_in = row[5] if len(row) > 5 else None

        if (
            fecha_in is not None
            and descripcion_in
            and isinstance(monto_in, (int, float))
            and float(monto_in) > 0
        ):
            pagos_raw.append({
                "fecha": fecha_in.date(),
                "descripcion": str(descripcion_in).strip(),
                "monto": round(float(monto_in), 2),
                "servicio": normalize_servicio(str(servicio_in) if servicio_in else None),
            })

        # --- EGRESO ---
        # Columna I = índice 8
        if len(row) >= 14:
            fecha_eg = excel_serial_to_date(row[8])
            descripcion_eg = row[10]
            monto_eg = row[11]
            categoria_eg = row[12]
            tipo_eg = row[13]

            if (
                fecha_eg is not None
                and descripcion_eg
                and isinstance(monto_eg, (int, float))
                and float(monto_eg) > 0
            ):
                egresos_raw.append({
                    "fecha": fecha_eg.date(),
                    "descripcion": str(descripcion_eg).strip(),
                    "monto": round(float(monto_eg), 2),
                    "categoria": str(categoria_eg).strip() if categoria_eg else "Sin categoría",
                    "tipo_costo": normalize_tipo_costo(str(tipo_eg) if tipo_eg else None),
                })

    return pagos_raw, egresos_raw


def build_migration(pagos_raw, egresos_raw):
    """Construye los CSVs finales a partir de los datos crudos."""
    # 1. Cliente + Perro placeholder por cada nombre único
    perros_por_nombre = {}     # nombre_limpio -> perro_id
    clientes_por_nombre = {}   # nombre_limpio -> cliente_id

    for p in pagos_raw:
        nombre_limpio = clean_dog_name(p["descripcion"])
        if not nombre_limpio:
            continue
        if nombre_limpio not in perros_por_nombre:
            cliente_id = str(uuid.uuid4())
            perro_id   = str(uuid.uuid4())
            clientes_por_nombre[nombre_limpio] = cliente_id
            perros_por_nombre[nombre_limpio]   = perro_id

    # 2. Reservaciones agrupadas por (perro, servicio, año-mes)
    reservaciones_map = {}  # (perro_id, servicio, year, month) -> reservacion_id
    pagos_finales = []

    for p in pagos_raw:
        nombre_limpio = clean_dog_name(p["descripcion"])
        if not nombre_limpio:
            continue
        perro_id = perros_por_nombre[nombre_limpio]
        key = (perro_id, p["servicio"], p["fecha"].year, p["fecha"].month)

        if key not in reservaciones_map:
            reservaciones_map[key] = {
                "id": str(uuid.uuid4()),
                "perro_id": perro_id,
                "servicio": p["servicio"],
                "fecha_inicio": p["fecha"],
                "fecha_fin": p["fecha"],
                "total": 0.0,
            }
        res = reservaciones_map[key]
        res["fecha_inicio"] = min(res["fecha_inicio"], p["fecha"])
        res["fecha_fin"]    = max(res["fecha_fin"], p["fecha"])
        res["total"]       += p["monto"]

        pagos_finales.append({
            "id": str(uuid.uuid4()),
            "reservacion_id": res["id"],
            "monto": p["monto"],
            "tipo": classify_pago_tipo(p["descripcion"]),
            "fecha": p["fecha"],
            "metodo_pago": None,
            "descripcion": p["descripcion"],
        })

    return clientes_por_nombre, perros_por_nombre, reservaciones_map, pagos_finales


def write_csvs(out_dir: Path, clientes, perros, reservaciones, pagos, egresos_raw):
    out_dir.mkdir(parents=True, exist_ok=True)

    # clientes.csv
    with (out_dir / "clientes.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "nombre", "telefono", "email", "notas"])
        for nombre, cid in clientes.items():
            w.writerow([cid, f"Cliente — {nombre}", "", "", "Importado del Excel 2026, actualizar datos"])

    # perros.csv
    with (out_dir / "perros.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "cliente_id", "nombre", "raza", "sexo", "fecha_nacimiento",
                    "peso_kg", "foto_url", "alergias", "comportamiento", "notas",
                    "cartilla_vigente", "cartilla_vence"])
        for nombre, pid in perros.items():
            cliente_id = clientes[nombre]
            w.writerow([pid, cliente_id, nombre, "", "", "", "", "", "", "",
                        "Importado del Excel 2026", "false", ""])

    # reservaciones.csv
    with (out_dir / "reservaciones.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "perro_id", "servicio", "fecha_inicio", "fecha_fin",
                    "precio_acordado", "anticipo_acordado", "estado", "notas", "origen_legacy"])
        for res in reservaciones.values():
            w.writerow([res["id"], res["perro_id"], res["servicio"],
                        res["fecha_inicio"].isoformat(), res["fecha_fin"].isoformat(),
                        round(res["total"], 2), 0,
                        "FINALIZADA", "Reservación migrada del Excel", "true"])

    # pagos.csv
    with (out_dir / "pagos.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "reservacion_id", "monto", "tipo", "fecha", "metodo_pago", "descripcion"])
        for p in pagos:
            w.writerow([p["id"], p["reservacion_id"], p["monto"], p["tipo"],
                        p["fecha"].isoformat(), p["metodo_pago"] or "", p["descripcion"]])

    # egresos.csv
    with (out_dir / "egresos.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "fecha", "descripcion", "monto", "categoria", "tipo_costo", "notas"])
        for e in egresos_raw:
            w.writerow([str(uuid.uuid4()), e["fecha"].isoformat(), e["descripcion"],
                        e["monto"], e["categoria"], e["tipo_costo"], ""])


def main():
    if len(sys.argv) < 2:
        print("Uso: python migrate_excel.py <ruta_excel> [carpeta_salida]")
        sys.exit(1)

    xlsx_path = Path(sys.argv[1])
    out_dir   = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("./out")

    print(f"📖 Leyendo {xlsx_path}…")
    pagos_raw, egresos_raw = parse_excel(xlsx_path)
    print(f"   • {len(pagos_raw)} pagos (ingresos) detectados")
    print(f"   • {len(egresos_raw)} egresos detectados")

    print("🔧 Construyendo modelo…")
    clientes, perros, reservaciones, pagos = build_migration(pagos_raw, egresos_raw)
    print(f"   • {len(clientes)} clientes placeholder")
    print(f"   • {len(perros)} perros únicos")
    print(f"   • {len(reservaciones)} reservaciones agrupadas")
    print(f"   • {len(pagos)} pagos finales")

    total_ingresos = sum(p["monto"] for p in pagos)
    total_egresos  = sum(e["monto"] for e in egresos_raw)
    print(f"   • Ingresos migrados: ${total_ingresos:,.2f}")
    print(f"   • Egresos migrados:  ${total_egresos:,.2f}")
    print(f"   • Utilidad:          ${total_ingresos - total_egresos:,.2f}")

    print(f"💾 Escribiendo CSVs en {out_dir}/…")
    write_csvs(out_dir, clientes, perros, reservaciones, pagos, egresos_raw)
    print("✅ Listo. Importa los CSVs en Supabase en este orden:")
    print("   1. clientes.csv")
    print("   2. perros.csv")
    print("   3. reservaciones.csv")
    print("   4. pagos.csv")
    print("   5. egresos.csv")


if __name__ == "__main__":
    main()
