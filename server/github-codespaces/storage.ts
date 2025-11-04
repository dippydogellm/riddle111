import * as fs from "fs";
import * as path from "path";

/**
 * GitHub Codespaces Persistent Storage Module
 * Provides persistent file storage in /workspaces/riddle111/storage
 * Survives Codespace rebuilds (32GB allocated)
 */

const STORAGE_BASE = "/workspaces/riddle111/storage";
const METADATA_FILE = ".meta";

interface FileMetadata {
  created: string;
  modified: string;
  size: number;
  type: string;
}

export class CodespacesStorage {
  constructor() {
    this.ensureStorageDir();
  }

  private ensureStorageDir() {
    if (!fs.existsSync(STORAGE_BASE)) {
      fs.mkdirSync(STORAGE_BASE, { recursive: true });
      console.log(`[Codespaces Storage] Created storage directory: ${STORAGE_BASE}`);
    }
  }

  /**
   * Upload file
   */
  async uploadBytes(filename: string, data: Buffer): Promise<boolean> {
    try {
      const filepath = path.join(STORAGE_BASE, filename);
      const dir = path.dirname(filepath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filepath, data);
      this.updateMetadata(filename, data.length);
      console.log(`[Codespaces] Uploaded: ${filename} (${data.length} bytes)`);
      return true;
    } catch (error) {
      console.error("[Codespaces Upload] Error:", error);
      return false;
    }
  }

  /**
   * Download file
   */
  async downloadBytes(filename: string): Promise<Buffer | null> {
    try {
      const filepath = path.join(STORAGE_BASE, filename);
      if (!fs.existsSync(filepath)) {
        console.warn(`[Codespaces] File not found: ${filename}`);
        return null;
      }
      return fs.readFileSync(filepath);
    } catch (error) {
      console.error("[Codespaces Download] Error:", error);
      return null;
    }
  }

  /**
   * Check file exists
   */
  async exists(filename: string): Promise<boolean> {
    try {
      const filepath = path.join(STORAGE_BASE, filename);
      return fs.existsSync(filepath);
    } catch {
      return false;
    }
  }

  /**
   * Delete file
   */
  async delete(filename: string): Promise<boolean> {
    try {
      const filepath = path.join(STORAGE_BASE, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`[Codespaces] Deleted: ${filename}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("[Codespaces Delete] Error:", error);
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(filename: string): Promise<FileMetadata | null> {
    try {
      const filepath = path.join(STORAGE_BASE, filename);
      if (!fs.existsSync(filepath)) return null;

      const stats = fs.statSync(filepath);
      const metaPath = filepath + METADATA_FILE;
      let metadata: FileMetadata = {
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        size: stats.size,
        type: "file",
      };

      if (fs.existsSync(metaPath)) {
        metadata = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      }

      return metadata;
    } catch (error) {
      console.error("[Codespaces Metadata] Error:", error);
      return null;
    }
  }

  /**
   * List files in directory
   */
  async listFiles(prefix: string = ""): Promise<string[]> {
    try {
      const dir = prefix
        ? path.join(STORAGE_BASE, prefix)
        : STORAGE_BASE;
      if (!fs.existsSync(dir)) return [];

      const files: string[] = [];

      const traverse = (current: string, relPath: string) => {
        const entries = fs.readdirSync(current);
        for (const entry of entries) {
          if (entry === METADATA_FILE) continue;
          const full = path.join(current, entry);
          const rel = relPath ? `${relPath}/${entry}` : entry;

          if (fs.statSync(full).isDirectory()) {
            traverse(full, rel);
          } else {
            files.push(rel);
          }
        }
      };

      traverse(dir, prefix);
      return files;
    } catch (error) {
      console.error("[Codespaces List] Error:", error);
      return [];
    }
  }

  /**
   * Get storage status
   */
  async getStatus(): Promise<{
    available: boolean;
    path: string;
    fileCount: number;
    totalSize: number;
  }> {
    try {
      const files = await this.listFiles();
      let totalSize = 0;

      for (const file of files) {
        const filepath = path.join(STORAGE_BASE, file);
        if (fs.existsSync(filepath)) {
          totalSize += fs.statSync(filepath).size;
        }
      }

      return {
        available: true,
        path: STORAGE_BASE,
        fileCount: files.length,
        totalSize,
      };
    } catch (error) {
      console.error("[Codespaces Status] Error:", error);
      return {
        available: false,
        path: STORAGE_BASE,
        fileCount: 0,
        totalSize: 0,
      };
    }
  }

  private updateMetadata(filename: string, size: number) {
    try {
      const filepath = path.join(STORAGE_BASE, filename);
      const metaPath = filepath + METADATA_FILE;
      const metadata: FileMetadata = {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        size,
        type: "file",
      };
      fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error("[Metadata] Error:", error);
    }
  }
}

export const codespacesStorage = new CodespacesStorage();
