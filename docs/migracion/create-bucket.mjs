// Crea el bucket público 'productos' en Supabase Storage (idempotente).
// Un bucket público permite lectura por URL; las subidas del admin usan la
// SERVICE_ROLE_KEY (ignora RLS), así que no hacen falta policies extra.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function env(name) {
  if (process.env[name]) return process.env[name];
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, "");
  }
  throw new Error(`Falta ${name}`);
}

const sb = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

const { data, error } = await sb.storage.createBucket("productos", {
  public: true,
  fileSizeLimit: "8MB",
});

if (error) {
  if (/already exists/i.test(error.message)) {
    console.log("✓ El bucket 'productos' ya existía.");
  } else {
    console.error("✗ Error:", error.message);
    process.exit(1);
  }
} else {
  console.log("✓ Bucket 'productos' creado (público):", data?.name ?? "productos");
}
