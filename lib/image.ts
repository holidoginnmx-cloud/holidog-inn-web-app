// Compresión de imágenes en el cliente (canvas, sin dependencias).
// Redimensiona el lado mayor a `maxPx` y reexporta como JPEG con calidad ~0.82.
// Pensado para fotos de perros antes de subirlas a Supabase Storage.

const DEFAULT_MAX_PX = 1200;
const DEFAULT_QUALITY = 0.82;

export async function comprimirImagen(
  file: File,
  maxPx: number = DEFAULT_MAX_PX,
  quality: number = DEFAULT_QUALITY,
): Promise<File> {
  // Si no es imagen, no tocamos el archivo.
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const escala = Math.min(1, maxPx / Math.max(width, height));

  // Ya es suficientemente chica y no es HEIC/otra: devolver tal cual.
  if (escala === 1 && (file.type === "image/jpeg" || file.type === "image/webp")) {
    bitmap.close();
    return file;
  }

  const w = Math.round(width * escala);
  const h = Math.round(height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) return file;

  const nombre = file.name.replace(/\.[^./\\]+$/, "") || "foto";
  return new File([blob], `${nombre}.jpg`, { type: "image/jpeg" });
}
