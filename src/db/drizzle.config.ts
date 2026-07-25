import { defineConfig } from 'drizzle-kit';

const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER || 'postgres';
const pass = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || '';
const host = process.env.SQL_HOST || '127.0.0.1';
const dbName = process.env.SQL_DB_NAME || 'cloud_sql_development_database';

const connectionString = process.env.DATABASE_URL || 
  `postgres://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@localhost:5432/${dbName}?host=${encodeURIComponent(host)}`;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
});
