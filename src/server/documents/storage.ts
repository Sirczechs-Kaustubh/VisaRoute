import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import crypto from "node:crypto";

export interface StorageAdapter {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
  read(key: string): Promise<Buffer>;
}

// ---------------------------------------------------------------------------
// Local (dev-only) adapter
// ---------------------------------------------------------------------------

const UPLOADS_DIR = resolve(process.cwd(), "uploads");

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<string> {
    ensureDir(UPLOADS_DIR);
    const filePath = join(UPLOADS_DIR, key);
    const dir = join(UPLOADS_DIR, key.split("/").slice(0, -1).join("/"));
    ensureDir(dir);
    writeFileSync(filePath, buffer);
    return key;
  }

  getUrl(key: string): string {
    return `/api/files/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = join(UPLOADS_DIR, key);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  async read(key: string): Promise<Buffer> {
    const filePath = join(UPLOADS_DIR, key);
    return readFileSync(filePath);
  }
}

// ---------------------------------------------------------------------------
// Supabase Storage (production) — Storage REST only, no @supabase/supabase-js
// ---------------------------------------------------------------------------

const SUPABASE_BUCKET = "documents";

function encodeStorageObjectPath(objectKey: string): string {
  return objectKey.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

/** Uses Supabase Storage HTTP API so the app bundle does not depend on @supabase/supabase-js. */
export class SupabaseStorageAdapter implements StorageAdapter {
  private readonly projectUrl: string;
  private readonly serviceRoleKey: string;

  constructor(projectUrl: string, serviceRoleKey: string) {
    if (!projectUrl?.trim() || !serviceRoleKey?.trim()) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
    }
    this.projectUrl = projectUrl.replace(/\/$/, "");
    this.serviceRoleKey = serviceRoleKey;
  }

  private authHeaders(contentType?: string): Record<string, string> {
    const h: Record<string, string> = {
      Authorization: `Bearer ${this.serviceRoleKey}`,
      apikey: this.serviceRoleKey,
    };
    if (contentType) h["Content-Type"] = contentType;
    return h;
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const path = encodeStorageObjectPath(key);
    const url = `${this.projectUrl}/storage/v1/object/${SUPABASE_BUCKET}/${path}?upsert=true`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.authHeaders(mimeType),
      body: new Uint8Array(buffer),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Supabase upload failed: ${res.status} ${detail}`);
    }
    return key;
  }

  getUrl(key: string): string {
    const path = encodeStorageObjectPath(key);
    return `${this.projectUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
  }

  async delete(key: string): Promise<void> {
    const path = encodeStorageObjectPath(key);
    const url = `${this.projectUrl}/storage/v1/object/${SUPABASE_BUCKET}/${path}`;
    const res = await fetch(url, { method: "DELETE", headers: this.authHeaders() });
    if (!res.ok && res.status !== 404) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Supabase delete failed: ${res.status} ${detail}`);
    }
  }

  async read(key: string): Promise<Buffer> {
    const path = encodeStorageObjectPath(key);
    const url = `${this.projectUrl}/storage/v1/object/${SUPABASE_BUCKET}/${path}`;
    const res = await fetch(url, { headers: this.authHeaders() });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Supabase read failed: ${res.status} ${detail}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
}

// ---------------------------------------------------------------------------
// Key generator + factory
// ---------------------------------------------------------------------------

export function generateStorageKey(
  applicationId: string,
  documentType: string,
  originalFileName: string,
): string {
  const ext = originalFileName.split(".").pop() ?? "bin";
  const hash = crypto.randomBytes(8).toString("hex");
  return `${applicationId}/${documentType}-${hash}.${ext}`;
}

let storageInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    const useSupabase =
      !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY;
    storageInstance = useSupabase
      ? new SupabaseStorageAdapter(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!,
        )
      : new LocalStorageAdapter();
  }
  return storageInstance;
}
