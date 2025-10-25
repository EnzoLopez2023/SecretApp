import mysql from 'mysql2/promise';
import fs from 'fs';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function createHomeMaintenance() {
  try {
    console.log('🏠 Creating Home Maintenance database tables...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('create_home_maintenance_tables.sql', 'utf8');
    
    // Split SQL statements by semicolon and filter out comments/empty statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        // Remove comments and empty statements
        const cleanStmt = stmt.replace(/--.*$/gm, '').trim();
        return cleanStmt.length > 10 && !cleanStmt.startsWith('--');
      });
    
    console.log(`📝 Found ${statements.length} SQL statements to execute...`);
    
    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].replace(/--.*$/gm, '').trim();
      if (statement.length > 10) { // Only execute substantial statements
        try {
          console.log(`   📝 Executing statement ${i + 1}: ${statement.substring(0, 50)}...`);
          await pool.execute(statement);
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
          console.error(`   SQL: ${statement.substring(0, 200)}...`);
        }
      }
    }
    
    console.log('✅ Home Maintenance tables creation completed!');
    
    // Test by checking if tables exist
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'woodworking_projects' 
      AND (TABLE_NAME LIKE '%home%' OR TABLE_NAME LIKE '%maintenance%' OR TABLE_NAME LIKE '%warrant%')
    `);
    
    console.log('📋 Created tables:');
    tables.forEach(table => {
      console.log(`   ✓ ${table.TABLE_NAME}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    await pool.end();
  }
}

createHomeMaintenance();