import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

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
// Supabase Storage adapter (production)
// ---------------------------------------------------------------------------

const SUPABASE_BUCKET = "documents";

export class SupabaseStorageAdapter implements StorageAdapter {
  private client;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
    }
    this.client = createClient(url, key);
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const { error } = await this.client.storage
      .from(SUPABASE_BUCKET)
      .upload(key, buffer, { contentType: mimeType, upsert: true });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    return key;
  }

  getUrl(key: string): string {
    const { data } = this.client.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
    return data.publicUrl;
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.client.storage.from(SUPABASE_BUCKET).remove([key]);
    if (error) throw new Error(`Supabase delete failed: ${error.message}`);
  }

  async read(key: string): Promise<Buffer> {
    const { data, error } = await this.client.storage.from(SUPABASE_BUCKET).download(key);
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    return Buffer.from(await data.arrayBuffer());
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
    storageInstance = useSupabase ? new SupabaseStorageAdapter() : new LocalStorageAdapter();
  }
  return storageInstance;
}
