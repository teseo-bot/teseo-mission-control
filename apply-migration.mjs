import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  });
  await client.connect();
  const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260426160000_create_tenant_api_keys.sql'), 'utf8');
  await client.query(sql);
  console.log('Migration applied');
  await client.end();
}

main().catch(console.error);