import "server-only";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __frankyshop_sql: ReturnType<typeof postgres> | undefined;
}

function makeClient() {
  const url = process.env.DATABASE_URL ?? process.env.DATANEXUS_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL (or DATANEXUS_URL) not set — run /reg datanexus and copy creds into .env.local",
    );
  }
  return postgres(url, {
    prepare: false,
    max: 5,
    idle_timeout: 30,
    connect_timeout: 10,
  });
}

export const sql = global.__frankyshop_sql ?? makeClient();
if (process.env.NODE_ENV !== "production") global.__frankyshop_sql = sql;
