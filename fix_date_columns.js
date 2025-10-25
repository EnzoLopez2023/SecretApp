import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function fixDateColumns() {
  try {
    console.log('🔧 Fixing date column types in Home Maintenance tables...');
    
    // Update maintenance_tasks table to use DATETIME instead of DATE for date columns
    const fixes = [
      {
        table: 'maintenance_tasks',
        columns: ['scheduled_date', 'due_date', 'completed_date', 'next_due_date'],
        description: 'Convert DATE columns to DATETIME'
      },
      {
        table: 'home_items',
        columns: ['purchase_date', 'installation_date'],
        description: 'Convert DATE columns to DATETIME'
      }
    ];
    
    for (const fix of fixes) {
      console.log(`📝 Updating ${fix.table}: ${fix.description}`);
      
      for (const column of fix.columns) {
        try {
          const sql = `ALTER TABLE ${fix.table} MODIFY COLUMN ${column} DATETIME NULL`;
          await pool.execute(sql);
          console.log(`   ✅ Updated ${fix.table}.${column} to DATETIME`);
        } catch (error) {
          console.error(`   ❌ Error updating ${fix.table}.${column}:`, error.message);
        }
      }
    }
    
    console.log('✅ Date column fixes completed!');
    
    // Test by showing the updated table structures
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'woodworking_projects' 
      AND TABLE_NAME IN ('home_items', 'maintenance_tasks')
      AND COLUMN_NAME LIKE '%date%'
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);
    
    console.log('📋 Updated date columns:');
    tables.forEach(col => {
      console.log(`   ${col.TABLE_NAME}.${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing date columns:', error.message);
  } finally {
    await pool.end();
  }
}

fixDateColumns();