import { query, tenantContext } from './src/config/db.js';
import bcrypt from 'bcryptjs';

async function restore() {
  const { rows: tRows } = await query("SELECT id FROM tenants WHERE subdomain = 'snps'");
  if (!tRows.length) return;
  const tenantId = tRows[0].id;
  
  tenantContext.run(tenantId, async () => {
    try {
      const passwordHash = await bcrypt.hash('Password@123', 10);
      
      const insertUser = async (name, email) => {
        const { rows } = await query(
          'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id',
          [name, email, passwordHash, 'teacher']
        );
        if (rows.length) {
          const userId = rows[0].id;
          const employeeId = 'SNPS-STAFF-' + Math.floor(Math.random() * 10000);
          await query(
            'INSERT INTO staff (user_id, employee_id, name, designation, department, joining_date, salary_basic) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [userId, employeeId, name, 'Teacher', 'General', '2026-07-01', 30000]
          );
          console.log(`Added ${name}`);
        } else {
          console.log(`${name} already exists.`);
        }
      };
      
      await insertUser('Ramesh Pandey', 'ramesh@snps.edu.in');
      await insertUser('Anup Kumar', 'anup@snps.edu.in');
      
      console.log('Restoration complete!');
    } catch(e) {
      console.error(e);
    }
    process.exit(0);
  });
}
restore();
