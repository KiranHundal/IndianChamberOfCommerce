import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const sql = `
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  business_name TEXT,
  city TEXT,
  sector TEXT,
  membership_tier TEXT NOT NULL DEFAULT 'individual',
  status TEXT NOT NULL DEFAULT 'pending',
  role TEXT NOT NULL DEFAULT 'member',
  created_at INTEGER NOT NULL,
  approved_at INTEGER,
  deactivated_at INTEGER
);
`

try {
  await client.execute(sql)
  console.log('Schema pushed successfully!')
} catch (e) {
  console.error('Error:', e.message)
}
