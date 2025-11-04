import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

/**
 * Database Migration Script
 * Supports PostgreSQL, MySQL, and SQLite
 */

interface MigrationData {
  database: {
    type: "postgresql" | "mysql" | "sqlite";
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database: string;
    filepath?: string;
  };
  files?: Array<{ name: string; data: string }>;
  metadata?: any;
}

async function loadMigrationData(
  migrationPath: string
): Promise<MigrationData> {
  console.log(`📦 Loading migration data from: ${migrationPath}`);

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration path not found: ${migrationPath}`);
  }

  const migrationFile = path.join(migrationPath, "migration.json");
  if (!fs.existsSync(migrationFile)) {
    throw new Error(`migration.json not found in ${migrationPath}`);
  }

  const data = JSON.parse(fs.readFileSync(migrationFile, "utf-8"));
  return data;
}

async function restoreDatabase(migrationData: MigrationData): Promise<void> {
  const dbType = migrationData.database.type;
  console.log(`🔄 Restoring ${dbType.toUpperCase()} database...`);

  // Create DATABASE_URL for Drizzle
  let databaseUrl = "";

  switch (dbType) {
    case "postgresql":
      const {
        host = "localhost",
        port = 5432,
        username = "postgres",
        password = "postgres",
        database = "riddle111",
      } = migrationData.database;
      databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;
      break;

    case "mysql":
      const mysqlCfg = migrationData.database;
      databaseUrl = `mysql://${mysqlCfg.username}@${mysqlCfg.host}/${mysqlCfg.database}`;
      break;

    case "sqlite":
      const sqliteFile = migrationData.database.filepath || "./db.sqlite";
      databaseUrl = `file:${sqliteFile}`;
      break;

    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }

  // Update environment
  if (!fs.existsSync(".env")) {
    fs.writeFileSync(
      ".env",
      `DATABASE_URL="${databaseUrl}"\nNODE_ENV=development\n`
    );
    console.log("✅ Created .env file with DATABASE_URL");
  } else {
    const envContent = fs.readFileSync(".env", "utf-8");
    if (!envContent.includes("DATABASE_URL")) {
      fs.appendFileSync(".env", `\nDATABASE_URL="${databaseUrl}"\n`);
      console.log("✅ Updated .env with DATABASE_URL");
    }
  }

  console.log(`✅ Database URL configured: ${dbType}`);
}

async function migrateFiles(migrationData: MigrationData): Promise<void> {
  if (!migrationData.files || migrationData.files.length === 0) {
    console.log("ℹ️  No files to migrate");
    return;
  }

  console.log(`📁 Migrating ${migrationData.files.length} files...`);

  const storageDir = "./storage";
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  for (const file of migrationData.files) {
    const filePath = path.join(storageDir, file.name);
    const fileDir = path.dirname(filePath);

    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    fs.writeFileSync(filePath, file.data);
    console.log(`  ✓ ${file.name}`);
  }

  console.log(`✅ Migrated ${migrationData.files.length} files`);
}

async function runMigration(migrationPath: string): Promise<void> {
  try {
    console.log("🚀 Starting database migration...\n");

    const migrationData = await loadMigrationData(migrationPath);
    await restoreDatabase(migrationData);
    await migrateFiles(migrationData);

    console.log("\n✅ Migration completed successfully!");
    console.log("📝 Next steps:");
    console.log("  1. Review .env file");
    console.log("  2. Run: npm run db:push");
    console.log("  3. Start dev server: npm run dev");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
const migrationPath = process.argv[2] || "./migration-backup";
runMigration(migrationPath);
