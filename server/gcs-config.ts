import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";

let gcsBucket: any = null;
let isGCSReady = false;

/**
 * Initialize Google Cloud Storage with credential detection
 * Supports 4 credential methods:
 * 1. GCS_KEY env var (JSON string)
 * 2. GOOGLE_APPLICATION_CREDENTIALS env var (file path)
 * 3. GCS_KEY_FILE env var (file path)
 * 4. gcs-key.json in project root
 */
export async function initializeGCS() {
  try {
    let credentials = null;

    // Method 1: Check GCS_KEY environment variable
    if (process.env.GCS_KEY) {
      console.log("[GCS] Using GCS_KEY environment variable");
      credentials = JSON.parse(process.env.GCS_KEY);
    }
    // Method 2: Check GOOGLE_APPLICATION_CREDENTIALS
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (fs.existsSync(credPath)) {
        console.log(`[GCS] Using GOOGLE_APPLICATION_CREDENTIALS: ${credPath}`);
        credentials = JSON.parse(fs.readFileSync(credPath, "utf-8"));
      }
    }
    // Method 3: Check GCS_KEY_FILE
    else if (process.env.GCS_KEY_FILE) {
      const keyPath = process.env.GCS_KEY_FILE;
      if (fs.existsSync(keyPath)) {
        console.log(`[GCS] Using GCS_KEY_FILE: ${keyPath}`);
        credentials = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
      }
    }
    // Method 4: Check for gcs-key.json in project root
    else {
      const localKeyPath = path.join(process.cwd(), "gcs-key.json");
      if (fs.existsSync(localKeyPath)) {
        console.log("[GCS] Using gcs-key.json from project root");
        credentials = JSON.parse(fs.readFileSync(localKeyPath, "utf-8"));
      }
    }

    if (!credentials) {
      console.warn("[GCS] No credentials found. GCS will not be available.");
      return false;
    }

    const projectId = credentials.project_id;
    const bucketName = process.env.GCS_BUCKET || `${projectId}-storage`;

    const storage = new Storage({
      projectId,
      credentials,
    });

    gcsBucket = storage.bucket(bucketName);
    isGCSReady = true;
    console.log(`[GCS] Successfully initialized. Bucket: ${bucketName}`);
    return true;
  } catch (error) {
    console.error("[GCS] Initialization failed:", error);
    return false;
  }
}

export function getGCSBucket() {
  return gcsBucket;
}

export function isGCSAvailable(): boolean {
  return isGCSReady && gcsBucket !== null;
}

/**
 * Generate signed URL for direct access
 */
export async function generateSignedUrl(
  filename: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!isGCSAvailable()) return null;

  try {
    const file = gcsBucket.file(filename);
    const urls = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + expiresIn * 1000,
    });
    return urls[0];
  } catch (error) {
    console.error("[GCS] Error generating signed URL:", error);
    return null;
  }
}

/**
 * Check if object exists
 */
export async function objectExists(filename: string): Promise<boolean> {
  if (!isGCSAvailable()) return false;

  try {
    const file = gcsBucket.file(filename);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error("[GCS] Error checking object existence:", error);
    return false;
  }
}

/**
 * Delete object
 */
export async function deleteObject(filename: string): Promise<boolean> {
  if (!isGCSAvailable()) return false;

  try {
    const file = gcsBucket.file(filename);
    await file.delete();
    return true;
  } catch (error) {
    console.error("[GCS] Error deleting object:", error);
    return false;
  }
}

/**
 * Get object metadata
 */
export async function getObjectMetadata(
  filename: string
): Promise<any | null> {
  if (!isGCSAvailable()) return null;

  try {
    const file = gcsBucket.file(filename);
    const [metadata] = await file.getMetadata();
    return metadata;
  } catch (error) {
    console.error("[GCS] Error getting metadata:", error);
    return null;
  }
}

/**
 * List objects in bucket
 */
export async function listObjects(
  prefix: string = ""
): Promise<string[] | null> {
  if (!isGCSAvailable()) return null;

  try {
    const [files] = await gcsBucket.getFiles({ prefix });
    return files.map((f: any) => f.name);
  } catch (error) {
    console.error("[GCS] Error listing objects:", error);
    return null;
  }
}

export function getGCSStatus() {
  return {
    available: isGCSReady,
    bucket: gcsBucket?.name || null,
  };
}
