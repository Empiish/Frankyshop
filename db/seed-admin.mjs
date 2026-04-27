#!/usr/bin/env node
// Bootstrap an admin staff_user from ADMIN_EMAIL + ADMIN_PASSWORD env vars.
// Idempotent: if the email already exists, prints existing info and exits.

import postgres from "postgres";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? process.env.DATANEXUS_URL;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_NAME ?? "Admin";

if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.");
  process.exit(1);
}
if (password.length < 10) {
  console.error("ADMIN_PASSWORD must be at least 10 characters.");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });

try {
  const existing = await sql`select id, role, is_active from staff_users where email = ${email} limit 1`;
  if (existing[0]) {
    console.log(`✓ Admin already exists: ${email} (role=${existing[0].role}, active=${existing[0].is_active})`);
    process.exit(0);
  }
  const hash = await bcrypt.hash(password, 12);
  const [row] = await sql`
    insert into staff_users (email, password_hash, full_name, role, is_active)
    values (${email}, ${hash}, ${fullName}, 'admin', true)
    returning id
  `;
  console.log(`✓ Created admin ${email} (id=${row.id})`);
  console.log(`  Sign in at /admin/login`);
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
