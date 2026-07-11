import { tenantContext, query } from './src/config/db.js';

async function run() {
  const { rows: tenants } = await query("SELECT id FROM tenants WHERE subdomain = 'snps'");
  
  tenantContext.run(tenants[0].id, async () => {
    try {
      const { rows } = await query('SELECT * FROM classes ORDER BY sort_order, name');
      console.log('Got classes length:', rows.length);
    } catch(e) {
      console.error(e);
    }
    process.exit(0);
  });
}

run();
