# Riddle111 - Multi-tier Object Storage with GitHub Codespaces

## Overview

This project implements a production-ready object storage system with intelligent fallback mechanisms, ready for deployment on GitHub Codespaces or any Node.js environment.

**Current Status**: ✅ Deployed to GitHub
- Backend API: Port 5002
- Frontend Dev: Port 5050
- Storage: Multi-tier (GCS → Replit → Mock filesystem)

---

## Architecture

### Storage Providers (Auto-selected in order)

1. **Google Cloud Storage (Primary)**
   - Persistent, scalable cloud storage
   - Requires GCS credentials
   - Supports signed URLs for direct access

2. **Replit Object Storage (Fallback)**
   - Automatic in Replit environments
   - Simple key-value storage
   - Non-persistent (resets on workspace restart)

3. **Mock Filesystem (Development)**
   - Local file storage
   - Perfect for development/testing
   - Stored in `./storage` directory

---

## Quick Start

### GitHub Codespaces (Recommended)

```bash
# Clone repo
git clone https://github.com/dippydogellm/riddle111.git

# Create Codespace from GitHub UI
# Auto-runs: npm install, npm run db:push
```

**Automatic Configuration**:
- Ports: 5002 (backend), 5050 (frontend)
- Storage: `/workspaces/riddle111/storage` (32GB persistent)
- Database: Auto-configured from environment

### Local Development

```bash
npm install
npm run dev
```

---

## File Structure

```
riddle111/
├── .devcontainer/
│   └── devcontainer.json          # Codespaces configuration
├── server/
│   ├── gcs-config.ts              # Google Cloud Storage setup
│   ├── objectStorage.ts           # Multi-tier storage service
│   └── github-codespaces/
│       └── storage.ts             # Persistent storage
├── scripts/
│   └── migrate-database.ts         # Migration tool
└── README.md
```

---

## API Usage

```typescript
import { ObjectStorageService } from "./server/objectStorage";

const storage = new ObjectStorageService();

// Upload
await storage.uploadBytes("path/file.txt", buffer);

// Download
const data = await storage.downloadBytes("path/file.txt");

// Check & Delete
const exists = await storage.exists("path/file.txt");
await storage.delete("path/file.txt");

// Metadata
const meta = await storage.getMetadata("path/file.txt");
const url = await storage.getUrl("path/file.txt");
```

---

## Database Migration

### Format (migration.json)

```json
{
  "database": {
    "type": "postgresql|mysql|sqlite",
    "host": "localhost",
    "database": "riddle111"
  },
  "files": [
    {"name": "uploads/file.png", "data": "base64-data"}
  ]
}
```

### Run Migration

```bash
npx tsx scripts/migrate-database.ts ./migration-data
```

---

## Configuration

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Database connection string |
| `GCS_KEY` | GCS credentials (JSON) |
| `GCS_BUCKET` | GCS bucket name |
| `GOOGLE_APPLICATION_CREDENTIALS` | GCS key file path |

---

## Features

✅ Multi-tier storage with automatic fallback
✅ GitHub Codespaces ready
✅ Persistent storage (32GB in Codespaces)
✅ Database migration (PostgreSQL/MySQL/SQLite)
✅ TypeScript throughout
✅ Production-ready error handling

---

## Next Steps

1. **Create Codespace**: GitHub UI → Codespaces → Create on main
2. **Provide Migration Data**: ZIP with migration.json + files
3. **Configure GCS**: Add credentials for production storage
4. **Deploy**: Point to production database URL

---

**Repository**: https://github.com/dippydogellm/riddle111
**Last Updated**: 2025-11-04