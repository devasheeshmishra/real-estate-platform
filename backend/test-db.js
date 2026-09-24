const pool = require('./db');

async function testDatabase() {
    try {
        // const result = await pool.query('SELECT NOW()');
        const result = await pool.query("SELECT * FROM leads");
        // console.log('Database connection successfully!');
        console.log('Leads from the database:');
        console.log(result.rows);

    } catch (error) {
        console.error('Database query failed: ');
        console.error(error.message);
    } finally {
        await pool.end();
    }
}

testDatabase();