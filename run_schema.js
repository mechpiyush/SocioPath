const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.irlevkhbtubgsboyqdoj:Manush%401308@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
  });
  
  try {
    await client.connect();
    const sql = fs.readFileSync('schema.sql', 'utf8');
    await client.query(sql);
    console.log('Schema executed successfully');
  } catch (err) {
    console.error('Error executing schema:', err);
  } finally {
    await client.end();
  }
}

run();
