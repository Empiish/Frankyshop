"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { requireStaff } from "@/lib/auth";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export type UploadResult =
  | { ok: true; urls: string[] }
  | { ok: false; error: string };

export async function uploadProductImages(formData: FormData): Promise<UploadResult> {
  await requireStaff();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, error: "Pick one or more image files." };

  const dir = join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return { ok: false, error: `Unsupported file type: ${file.type}. Use JPG, PNG, WebP or GIF.` };
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, error: `${file.name} is over 8 MB. Compress it first.` };
    }
    const ext = extname(file.name) || mimeToExt(file.type);
    const id = randomUUID();
    const filename = `${id}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);
    urls.push(`/uploads/products/${filename}`);
  }
  return { ok: true, urls };
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/jpeg": return ".jpg";
    case "image/png": return ".png";
    case "image/webp": return ".webp";
    case "image/gif": return ".gif";
    default: return "";
  }
}
