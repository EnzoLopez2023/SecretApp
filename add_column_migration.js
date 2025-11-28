import mysql from 'mysql2/promise';

async function addColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'secretapp',
      password: 'YourSecurePassword123!',
      database: 'woodworking_projects'
    });

    console.log('Connected to database');

    // Add the new column
    await connection.execute(`
      ALTER TABLE cutting_board_designs 
      ADD COLUMN end_grain_segment_width DECIMAL(4,2) DEFAULT 2.00 
      AFTER custom_colors
    `);

    console.log('✅ Column end_grain_segment_width added successfully');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists, skipping');
    } else {
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

addColumn();
