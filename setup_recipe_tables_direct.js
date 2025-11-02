import mysql from 'mysql2/promise'

// Database connection configuration (same as server.js)
const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects'
}

async function createRecipeTables() {
  let connection
  
  try {
    console.log('🔌 Connecting to MySQL database...')
    connection = await mysql.createConnection(dbConfig)
    
    console.log('🗑️ Dropping existing tables if they exist...')
    
    // Drop tables in reverse dependency order
    const dropStatements = [
      'DROP TABLE IF EXISTS recipe_shopping_list_items',
      'DROP TABLE IF EXISTS recipe_shopping_lists',
      'DROP TABLE IF EXISTS recipe_pantry_items',
      'DROP TABLE IF EXISTS recipe_ingredients',
      'DROP TABLE IF EXISTS recipes'
    ]
    
    for (const statement of dropStatements) {
      await connection.execute(statement)
    }
    
    console.log('📊 Creating recipes table...')
    await connection.execute(`
      CREATE TABLE recipes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        cuisine_type VARCHAR(100),
        meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer') DEFAULT 'dinner',
        prep_time_minutes INT DEFAULT 0,
        cook_time_minutes INT DEFAULT 0,
        total_time_minutes INT DEFAULT 0,
        servings INT DEFAULT 4,
        difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        instructions TEXT,
        notes TEXT,
        source_url VARCHAR(500),
        image_url VARCHAR(500),
        is_favorite BOOLEAN DEFAULT FALSE,
        rating DECIMAL(2,1) DEFAULT NULL,
        dietary_tags JSON,
        parsed_by_ai BOOLEAN DEFAULT FALSE,
        ai_suggestions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_meal_type (meal_type),
        INDEX idx_cuisine_type (cuisine_type),
        INDEX idx_difficulty (difficulty_level),
        INDEX idx_is_favorite (is_favorite),
        INDEX idx_rating (rating)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    
    console.log('🥕 Creating recipe_ingredients table...')
    await connection.execute(`
      CREATE TABLE recipe_ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipe_id INT NOT NULL,
        ingredient_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,3) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        INDEX idx_recipe_id (recipe_id),
        INDEX idx_ingredient_name (ingredient_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    
    console.log('🏪 Creating recipe_pantry_items table...')
    await connection.execute(`
      CREATE TABLE recipe_pantry_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        quantity DECIMAL(10,3) DEFAULT 0,
        unit VARCHAR(50),
        location VARCHAR(100),
        expiry_date DATE,
        purchase_date DATE,
        cost DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_item_name (item_name),
        INDEX idx_category (category),
        INDEX idx_expiry_date (expiry_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    
    console.log('🛒 Creating recipe_shopping_lists table...')
    await connection.execute(`
      CREATE TABLE recipe_shopping_lists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('active', 'completed', 'archived') DEFAULT 'active',
        total_estimated_cost DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    
    console.log('📝 Creating recipe_shopping_list_items table...')
    await connection.execute(`
      CREATE TABLE recipe_shopping_list_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shopping_list_id INT NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,3) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        estimated_cost DECIMAL(10,2),
        actual_cost DECIMAL(10,2),
        is_purchased BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (shopping_list_id) REFERENCES recipe_shopping_lists(id) ON DELETE CASCADE,
        INDEX idx_shopping_list_id (shopping_list_id),
        INDEX idx_item_name (item_name),
        INDEX idx_is_purchased (is_purchased)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    
    console.log('✅ All Recipe Manager tables created successfully!')
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...')
    const [tables] = await connection.execute('SHOW TABLES LIKE "recipe%"')
    
    if (tables.length > 0) {
      console.log('✅ Verification successful! Recipe Manager tables:')
      tables.forEach(table => {
        console.log(`  ✓ ${Object.values(table)[0]}`)
      })
    } else {
      console.log('❌ Verification failed - No recipe tables found!')
    }
    
  } catch (error) {
    console.error('❌ Error setting up Recipe Manager tables:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 Database connection closed.')
    }
  }
}

// Run the setup
createRecipeTables()