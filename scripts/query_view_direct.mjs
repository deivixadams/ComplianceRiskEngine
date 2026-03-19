import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:postgres@localhost:5432/cre_db";

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM "_Schema".framework_doc_view LIMIT 20');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
