import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:postgres@localhost:5432/cre_db";

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.views 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
