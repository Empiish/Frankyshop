#!/usr/bin/env node
// Apply all .sql files under db/migrations in lexical order, then run db/seed.sql.
// Idempotent — uses CREATE TABLE IF NOT EXISTS and a guarded seed.

import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL ?? process.env.DATANEXUS_URL;
if (!url) {
  console.error("DATABASE_URL not set. Did you run /reg datanexus?");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });

try {
  const migDir = join(here, "migrations");
  const files = (await readdir(migDir)).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    process.stdout.write(`→ ${f} ... `);
    const body = await readFile(join(migDir, f), "utf8");
    await sql.unsafe(body);
    console.log("ok");
  }
  process.stdout.write("→ seed.sql ... ");
  const seed = await readFile(join(here, "seed.sql"), "utf8");
  await sql.unsafe(seed);
  console.log("ok");
} catch (err) {
  console.error("\nMigration failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
