import * as fs from "fs";import { Client } from '@replit/object-storage';

import * as path from "path";import { Response } from "express";

import { isGCSAvailable, getGCSBucket, generateSignedUrl } from "./gcs-config";import { randomUUID } from "crypto";

import * as path from "path";

/**import gcsConfig, { isGCSReady, generateSignedUrl, getBucket, objectExists, getObjectMetadata } from "./gcs-config";

 * Multi-tier Object Storage Service

 * Fallback order: GCS → Replit → Mock paths// Initialize Replit Object Storage client as fallback

 */let replitClient: any;



export interface StorageProvider {try {

  uploadBytes(filename: string, data: Buffer): Promise<boolean>;  replitClient = new Client();

  downloadBytes(filename: string): Promise<Buffer | null>;  // Initialize client asynchronously without blocking server startup

  exists(filename: string): Promise<boolean>;  replitClient.init().catch((err: any) => {

  delete(filename: string): Promise<boolean>;    console.warn('⚠️ [OBJECT STORAGE] Replit client initialization failed (non-critical):', err?.message || err);

  getMetadata(filename: string): Promise<any | null>;    console.log('ℹ️ [OBJECT STORAGE] Will use Google Cloud Storage if configured');

  getUrl(filename: string): Promise<string | null>;  });

}} catch (error) {

  console.warn('⚠️ [OBJECT STORAGE] Failed to create Replit client:', error instanceof Error ? error.message : String(error));

/**  replitClient = null;

 * Google Cloud Storage Provider}

 */

class GCSProvider implements StorageProvider {// Initialize GCS client at module load

  async uploadBytes(filename: string, data: Buffer): Promise<boolean> {gcsConfig.initializeGCS().then(result => {

    if (!isGCSAvailable()) return false;  console.log(result.message);

}).catch(err => {

    try {  console.error('❌ [OBJECT STORAGE] GCS init error:', err);

      const bucket = getGCSBucket();});

      const file = bucket.file(filename);

      await file.save(data);export class ObjectNotFoundError extends Error {

      return true;  constructor() {

    } catch (error) {    super("Object not found");

      console.error("[GCS Upload] Error:", error);    this.name = "ObjectNotFoundError";

      return false;    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);

    }  }

  }}



  async downloadBytes(filename: string): Promise<Buffer | null> {// The object storage service using GCS with Replit fallback

    if (!isGCSAvailable()) return null;export class ObjectStorageService {

  constructor() {}

    try {

      const bucket = getGCSBucket();  // Upload bytes (for images) and return the object path

      const file = bucket.file(filename);  async uploadBytes(buffer: Buffer, contentType: string): Promise<string> {

      const [data] = await file.download();    const objectId = randomUUID();

      return data;    const objectPath = `uploads/${objectId}`;

    } catch (error) {    

      console.error("[GCS Download] Error:", error);    // Try GCS first (primary method)

      return null;    if (isGCSReady()) {

    }      try {

  }        console.log(`📤 [GCS] Uploading object: ${objectPath}`);

        

  async exists(filename: string): Promise<boolean> {        const bucket = getBucket();

    if (!isGCSAvailable()) return false;        if (!bucket) throw new Error('Bucket not available');

        

    try {        const blob = bucket.file(objectPath);

      const bucket = getGCSBucket();        await blob.save(buffer, {

      const file = bucket.file(filename);          metadata: {

      const [exists] = await file.exists();            contentType: contentType || 'application/octet-stream',

      return exists;            cacheControl: 'public, max-age=3600',

    } catch (error) {          },

      console.error("[GCS Exists] Error:", error);        });

      return false;        

    }        console.log(`✅ [GCS] Object uploaded successfully: ${objectPath}`);

  }        

        // Return the path in /objects/... format for the frontend

  async delete(filename: string): Promise<boolean> {        return `/objects/${objectPath}`;

    if (!isGCSAvailable()) return false;      } catch (error) {

        const errorMsg = error instanceof Error ? error.message : String(error);

    try {        console.error('❌ [GCS] Upload failed:', errorMsg);

      const bucket = getGCSBucket();        console.log('ℹ️ [OBJECT STORAGE] Falling back to Replit client...');

      await bucket.file(filename).delete();      }

      return true;    }

    } catch (error) {    

      console.error("[GCS Delete] Error:", error);    // Fallback to Replit client

      return false;    if (replitClient) {

    }      try {

  }        console.log(`📤 [REPLIT] Uploading object: ${objectPath}`);

        

  async getMetadata(filename: string): Promise<any | null> {        const { ok, error } = await replitClient.uploadFromBytes(objectPath, buffer);

    if (!isGCSAvailable()) return null;        

        if (!ok) {

    try {          console.error('❌ [REPLIT] Upload failed:', error);

      const bucket = getGCSBucket();          throw new Error(`Failed to upload to Replit storage: ${error}`);

      const file = bucket.file(filename);        }

      const [metadata] = await file.getMetadata();        

      return metadata;        console.log(`✅ [REPLIT] Object uploaded successfully: ${objectPath}`);

    } catch (error) {        return `/objects/${objectPath}`;

      console.error("[GCS Metadata] Error:", error);      } catch (error) {

      return null;        const errorMsg = error instanceof Error ? error.message : String(error);

    }        console.error('❌ [REPLIT] Fallback upload failed:', errorMsg);

  }      }

    }

  async getUrl(filename: string): Promise<string | null> {    

    try {    // Last resort: return mock path

      return await generateSignedUrl(filename);    console.warn('⚠️ [OBJECT STORAGE] No storage backend available - returning mock path');

    } catch (error) {    return `/objects/${objectPath}`;

      console.error("[GCS URL] Error:", error);  }

      return null;

    }  // Download and stream an object to the response

  }  async downloadObject(objectPath: string, res: Response, cacheTtlSec: number = 3600) {

}    // Check if GCS is ready first

    if (isGCSReady()) {

/**      try {

 * Replit Object Storage Provider        // Remove /objects/ prefix to get the actual storage path

 */        const storagePath = objectPath.replace(/^\/objects\//, '');

class ReplitProvider implements StorageProvider {        

  private storage: any;        console.log(`📦 [GCS] Attempting to serve object: ${objectPath} (storage: ${storagePath})`);

        

  constructor(storage: any) {        const bucket = getBucket();

    this.storage = storage;        if (!bucket) throw new Error('Bucket not available');

  }        

        const blob = bucket.file(storagePath);

  async uploadBytes(filename: string, data: Buffer): Promise<boolean> {        const [exists] = await blob.exists();

    try {        

      await this.storage.write(filename, data);        if (!exists) {

      return true;          console.error(`❌ [GCS] Object not found: ${objectPath}`);

    } catch (error) {          throw new ObjectNotFoundError();

      console.error("[Replit Upload] Error:", error);        }

      return false;        

    }        // Set appropriate headers

  }        res.set({

          "Content-Type": this.getContentType(storagePath),

  async downloadBytes(filename: string): Promise<Buffer | null> {          "Cache-Control": `public, max-age=${cacheTtlSec}`,

    try {        });

      const data = await this.storage.read(filename);

      return Buffer.from(data);        // Create read stream from GCS

    } catch (error) {        const readStream = blob.createReadStream();

      console.error("[Replit Download] Error:", error);        

      return null;        readStream.on("error", (err: any) => {

    }          console.error("🔴 [GCS] Stream error:", err);

  }          if (!res.headersSent) {

            res.status(500).json({ error: "Error streaming file" });

  async exists(filename: string): Promise<boolean> {          }

    try {        });

      const data = await this.storage.read(filename);

      return data !== null;        readStream.pipe(res);

    } catch {        return;

      return false;      } catch (error) {

    }        if (error instanceof ObjectNotFoundError) {

  }          throw error;

        }

  async delete(filename: string): Promise<boolean> {        const errorMsg = error instanceof Error ? error.message : String(error);

    try {        console.error("❌ [GCS] Error downloading file:", errorMsg);

      await this.storage.delete(filename);        console.log('ℹ️ [OBJECT STORAGE] Falling back to Replit client...');

      return true;      }

    } catch (error) {    }

      console.error("[Replit Delete] Error:", error);    

      return false;    // Fallback to Replit client

    }    if (replitClient) {

  }      try {

        // Remove /objects/ prefix to get the actual storage path

  async getMetadata(filename: string): Promise<any | null> {        const storagePath = objectPath.replace(/^\/objects\//, '');

    try {        

      const data = await this.storage.read(filename);        console.log(`📦 [REPLIT] Attempting to serve object: ${objectPath} (storage: ${storagePath})`);

      return {        

        size: Buffer.byteLength(data),        const result = await replitClient.downloadAsStream(storagePath) as any;

        updated: new Date(),        

      };        if (!result.ok || !result.value) {

    } catch {          console.error(`❌ [REPLIT] Failed to serve object: ${objectPath}`, result.error);

      return null;          throw new ObjectNotFoundError();

    }        }

  }        

        const stream = result.value;

  async getUrl(filename: string): Promise<string | null> {        

    // Replit doesn't have public URLs by default        // Set appropriate headers

    return null;        res.set({

  }          "Content-Type": this.getContentType(storagePath),

}          "Cache-Control": `public, max-age=${cacheTtlSec}`,

        });

/**

 * Mock File System Provider        // Stream the file to the response

 */        stream.on("error", (err: any) => {

class MockProvider implements StorageProvider {          console.error("🔴 [REPLIT] Stream error:", err);

  private baseDir: string;          if (!res.headersSent) {

            res.status(500).json({ error: "Error streaming file" });

  constructor(baseDir: string = "./storage") {          }

    this.baseDir = baseDir;        });

    if (!fs.existsSync(baseDir)) {

      fs.mkdirSync(baseDir, { recursive: true });        stream.pipe(res);

    }        return;

  }      } catch (error) {

        if (error instanceof ObjectNotFoundError) {

  async uploadBytes(filename: string, data: Buffer): Promise<boolean> {          throw error;

    try {        }

      const filepath = path.join(this.baseDir, filename);        const errorMsg = error instanceof Error ? error.message : String(error);

      const dir = path.dirname(filepath);        console.error("❌ [REPLIT] Error downloading file:", errorMsg);

      if (!fs.existsSync(dir)) {      }

        fs.mkdirSync(dir, { recursive: true });    }

      }    

      fs.writeFileSync(filepath, data);    // No storage backend available

      return true;    console.error("❌ [OBJECT STORAGE] No storage backend available");

    } catch (error) {    if (!res.headersSent) {

      console.error("[Mock Upload] Error:", error);      res.status(503).json({ error: "Object storage unavailable" });

      return false;    }

    }  }

  }

  // Check if an object exists

  async downloadBytes(filename: string): Promise<Buffer | null> {  async exists(objectPath: string): Promise<boolean> {

    try {    // Try GCS first

      const filepath = path.join(this.baseDir, filename);    if (isGCSReady()) {

      return fs.readFileSync(filepath);      try {

    } catch (error) {        const storagePath = objectPath.replace(/^\/objects\//, '');

      console.error("[Mock Download] Error:", error);        return await objectExists(storagePath);

      return null;      } catch (error) {

    }        console.warn('⚠️ [GCS] Exists check failed, trying Replit...');

  }      }

    }

  async exists(filename: string): Promise<boolean> {    

    try {    // Fallback to Replit

      const filepath = path.join(this.baseDir, filename);    if (replitClient) {

      return fs.existsSync(filepath);      try {

    } catch {        const storagePath = objectPath.replace(/^\/objects\//, '');

      return false;        const { ok, value: bytes } = await replitClient.downloadAsBytes(storagePath);

    }        return ok && bytes !== undefined;

  }      } catch (error) {

        return false;

  async delete(filename: string): Promise<boolean> {      }

    try {    }

      const filepath = path.join(this.baseDir, filename);    

      if (fs.existsSync(filepath)) {    return false;

        fs.unlinkSync(filepath);  }

      }

      return true;  // Get content type from file extension

    } catch (error) {  private getContentType(path: string): string {

      console.error("[Mock Delete] Error:", error);    const ext = path.split('.').pop()?.toLowerCase();

      return false;    const contentTypes: Record<string, string> = {

    }      'jpg': 'image/jpeg',

  }      'jpeg': 'image/jpeg',

      'png': 'image/png',

  async getMetadata(filename: string): Promise<any | null> {      'gif': 'image/gif',

    try {      'webp': 'image/webp',

      const filepath = path.join(this.baseDir, filename);      'svg': 'image/svg+xml',

      const stats = fs.statSync(filepath);    };

      return {    return contentTypes[ext || ''] || 'application/octet-stream';

        size: stats.size,  }

        updated: stats.mtime,

      };  // Legacy method for compatibility - now just calls uploadBytes

    } catch (error) {  async getObjectEntityUploadURL(): Promise<never> {

      console.error("[Mock Metadata] Error:", error);    throw new Error('getObjectEntityUploadURL is deprecated - use uploadBytes directly');

      return null;  }

    }

  }  // Normalize object entity path (for compatibility with old code)

  normalizeObjectEntityPath(rawPath: string): string {

  async getUrl(filename: string): Promise<string | null> {    // If already in /objects/ format, return as-is

    return `/storage/${filename}`;    if (rawPath.startsWith("/objects/")) {

  }      return rawPath;

}    }

    

/**    // If it's a storage path, add /objects/ prefix

 * Multi-tier Object Storage Service    if (!rawPath.startsWith("http")) {

 */      return `/objects/${rawPath}`;

export class ObjectStorageService {    }

  private gcsProvider: GCSProvider;    

  private replitProvider: ReplitProvider | null;    // Otherwise return as-is

  private mockProvider: MockProvider;    return rawPath;

  private activeProvider: StorageProvider;  }

}

  constructor(replitStorage?: any) {

    this.gcsProvider = new GCSProvider();// Export a singleton instance for convenience

    this.replitProvider = replitStorage ? new ReplitProvider(replitStorage) : null;export const objectStorage = new ObjectStorageService();

    this.mockProvider = new MockProvider();

// Legacy export for backwards compatibility - now returns Replit client (fallback only)

    // Determine active provider (GCS > Replit > Mock)export const objectStorageClient = replitClient;

    if (isGCSAvailable()) {

      this.activeProvider = this.gcsProvider;// Export GCS configuration for direct access if needed

      console.log("[ObjectStorage] Using GCS provider");export { gcsConfig };

    } else if (this.replitProvider) {
      this.activeProvider = this.replitProvider;
      console.log("[ObjectStorage] Using Replit provider");
    } else {
      this.activeProvider = this.mockProvider;
      console.log("[ObjectStorage] Using Mock provider");
    }
  }

  async uploadBytes(filename: string, data: Buffer): Promise<boolean> {
    return this.activeProvider.uploadBytes(filename, data);
  }

  async downloadBytes(filename: string): Promise<Buffer | null> {
    return this.activeProvider.downloadBytes(filename);
  }

  async exists(filename: string): Promise<boolean> {
    return this.activeProvider.exists(filename);
  }

  async delete(filename: string): Promise<boolean> {
    return this.activeProvider.delete(filename);
  }

  async getMetadata(filename: string): Promise<any | null> {
    return this.activeProvider.getMetadata(filename);
  }

  async getUrl(filename: string): Promise<string | null> {
    return this.activeProvider.getUrl(filename);
  }

  getActiveProvider(): string {
    if (this.activeProvider === this.gcsProvider) return "GCS";
    if (this.activeProvider === this.replitProvider) return "Replit";
    return "Mock";
  }
}
