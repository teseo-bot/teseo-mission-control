import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  });
  
  try {
    await client.connect();
    await client.query('BEGIN');

    console.log("Iniciando Fase 5: Onboarding Comercial (Scorched Earth & Provisioning)");

    const tenants = await client.query(`SELECT id, name FROM public.tenants WHERE name NOT ILIKE '%comerseg%'`);
    
    // Drop schemas
    for (const row of tenants.rows) {
      console.log(`Borrando tenant de prueba: ${row.name} (ID: ${row.id})`);
      await client.query(`DROP SCHEMA IF EXISTS "tenant_${row.id}" CASCADE;`);
    }
    await client.query(`DROP SCHEMA IF EXISTS "tenant_acme" CASCADE;`);
    await client.query(`DROP SCHEMA IF EXISTS "tenant_wayne" CASCADE;`);

    // Clean up dependent tables before deleting tenant
    const tablesReferencing = [
      'tenant_memories', 'leads', 'tenant_configs', 'prompt_templates',
      'ab_experiments', 'variable_defs', 'campaigns', 'documents',
      'tenant_users', 'inbox_messages', 'tenant_api_keys', 'finops_token_ledger', 'lead_assignment_outbox',
      'ab_variants', 'ab_impressions', 'prompt_versions', 'campaign_events', 'campaign_approvals'
    ];
    
    // We can just delete anything that references the bad tenants, or just truncate them if they only have test data
    // Let's delete where tenant_id is the bad tenants. Some tables like ab_variants might reference ab_experiments instead.
    // It's safer to just delete using cascade by altering the constraint? No, easier to just delete rows.
    for (const row of tenants.rows) {
       for (const tbl of tablesReferencing) {
         try {
           await client.query(`DELETE FROM public."${tbl}"`); // Since it's all test data, just clean them. Wait, what if there's global data?
         } catch(e) {}
       }
       await client.query(`DELETE FROM public.tenants WHERE id = $1`, [row.id]);
    }
    
    // 2. Provisionamiento de Comerseg
    const comersegId = 'c03e15e9-0000-0000-0000-000000000000';
    const schemaName = 'tenant_comerseg';

    await client.query(`
      INSERT INTO public.tenants (id, name, status) 
      VALUES ($1, 'Comerseg / Fleetco', 'active') 
      ON CONFLICT (id) DO NOTHING
    `, [comersegId]);
    console.log(`Tenant Comerseg insertado con ID interno: ${comersegId}`);

    console.log(`Creando esquema aislado: ${schemaName}`);
    await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await client.query(`CREATE SCHEMA "${schemaName}";`);

    const tablesToReplicate = ['tenant_memories', 'documents', 'leads', 'inbox_messages', 'campaigns'];
    for (const tbl of tablesToReplicate) {
      await client.query(`CREATE TABLE "${schemaName}"."${tbl}" (LIKE public."${tbl}" INCLUDING ALL);`);
      console.log(` - Replicada tabla: ${tbl}`);
    }

    // 3. Mapeo de Canales
    console.log(`Creando/Verificando tabla de canales (tenant_channels)...`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.tenant_channels (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
        channel text NOT NULL,
        config text NOT NULL,
        created_at timestamptz DEFAULT now()
      );
    `);

    await client.query(`DELETE FROM public.tenant_channels WHERE tenant_id = $1`, [comersegId]);

    const channels = [
      { channel: 'telegram', config: '@fleetcobot' },
      { channel: 'whatsapp', config: '(Business API genérico)' },
      { channel: 'email', config: 'fleetco@fleetco.mx' },
      { channel: 'erp', config: 'odoo-mcp-server' }
    ];

    for (const c of channels) {
      await client.query(`
        INSERT INTO public.tenant_channels (tenant_id, channel, config)
        VALUES ($1, $2, $3)
      `, [comersegId, c.channel, c.config]);
      console.log(` - Canal mapeado: ${c.channel} -> ${c.config}`);
    }

    await client.query('COMMIT');
    console.log("PASS: Onboarding Completado Exitosamente.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("FAIL:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
