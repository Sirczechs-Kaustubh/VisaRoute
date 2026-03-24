import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import crypto from "node:crypto";

export interface StorageAdapter {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
  read(key: string): Promise<Buffer>;
}

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

export function generateStorageKey(applicationId: string, documentType: string, originalFileName: string): string {
  const ext = originalFileName.split(".").pop() ?? "bin";
  const hash = crypto.randomBytes(8).toString("hex");
  return `${applicationId}/${documentType}-${hash}.${ext}`;
}

let storageInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = new LocalStorageAdapter();
  }
  return storageInstance;
}
