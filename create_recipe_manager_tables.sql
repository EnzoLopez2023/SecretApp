-- Create Recipe Manager tables in woodworking_projects database

USE woodworking_projects;

-- Drop tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS recipe_meal_plans;
DROP TABLE IF EXISTS recipe_shopping_lists;
DROP TABLE IF EXISTS recipe_shopping_list_items;
DROP TABLE IF EXISTS recipe_pantry_items;
DROP TABLE IF EXISTS recipe_ingredients;
DROP TABLE IF EXISTS recipes;

-- Create the main recipes table
CREATE TABLE recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cuisine_type VARCHAR(100),
  meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer') DEFAULT 'dinner',
  prep_time_minutes INT DEFAULT 0,
  cook_time_minutes INT DEFAULT 0,
  total_time_minutes INT GENERATED ALWAYS AS (prep_time_minutes + cook_time_minutes) STORED,
  servings INT DEFAULT 4,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  instructions TEXT,
  notes TEXT,
  source_url TEXT,
  image_url TEXT,
  nutritional_info JSON,
  tags VARCHAR(500),
  is_favorite BOOLEAN DEFAULT FALSE,
  rating DECIMAL(2,1) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_title (title),
  INDEX idx_cuisine_type (cuisine_type),
  INDEX idx_meal_type (meal_type),
  INDEX idx_difficulty (difficulty),
  INDEX idx_tags (tags),
  INDEX idx_is_favorite (is_favorite),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the recipe ingredients table
CREATE TABLE recipe_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  ingredient_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  notes TEXT,
  is_optional BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  INDEX idx_recipe_id (recipe_id),
  INDEX idx_ingredient_name (ingredient_name),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the pantry items table
CREATE TABLE recipe_pantry_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),
  current_quantity DECIMAL(10,3) DEFAULT 0,
  unit VARCHAR(50),
  minimum_quantity DECIMAL(10,3) DEFAULT 0,
  purchase_location VARCHAR(255),
  average_price DECIMAL(10,2) DEFAULT 0.00,
  expiry_date DATE,
  notes TEXT,
  last_purchased DATE,
  is_staple BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_item_name (item_name),
  INDEX idx_category (category),
  INDEX idx_expiry_date (expiry_date),
  INDEX idx_is_staple (is_staple)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the meal plans table
CREATE TABLE recipe_meal_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  total_people INT DEFAULT 4,
  dietary_restrictions TEXT,
  budget_target DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plan_name (plan_name),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create meal plan entries (which recipes for which days)
CREATE TABLE recipe_meal_plan_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meal_plan_id INT NOT NULL,
  recipe_id INT NOT NULL,
  planned_date DATE NOT NULL,
  meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
  servings_needed INT DEFAULT 4,
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meal_plan_id) REFERENCES recipe_meal_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  INDEX idx_meal_plan_id (meal_plan_id),
  INDEX idx_recipe_id (recipe_id),
  INDEX idx_planned_date (planned_date),
  INDEX idx_meal_type (meal_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the shopping lists table
CREATE TABLE recipe_shopping_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  list_name VARCHAR(255) NOT NULL,
  description TEXT,
  meal_plan_id INT,
  store_name VARCHAR(255),
  total_estimated_cost DECIMAL(10,2) DEFAULT 0.00,
  actual_cost DECIMAL(10,2) DEFAULT 0.00,
  shopping_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (meal_plan_id) REFERENCES recipe_meal_plans(id) ON DELETE SET NULL,
  INDEX idx_list_name (list_name),
  INDEX idx_meal_plan_id (meal_plan_id),
  INDEX idx_shopping_date (shopping_date),
  INDEX idx_is_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the shopping list items table
CREATE TABLE recipe_shopping_list_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shopping_list_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  estimated_price DECIMAL(10,2) DEFAULT 0.00,
  actual_price DECIMAL(10,2) DEFAULT 0.00,
  is_purchased BOOLEAN DEFAULT FALSE,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shopping_list_id) REFERENCES recipe_shopping_lists(id) ON DELETE CASCADE,
  INDEX idx_shopping_list_id (shopping_list_id),
  INDEX idx_item_name (item_name),
  INDEX idx_category (category),
  INDEX idx_is_purchased (is_purchased),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample data
INSERT INTO recipes (title, description, cuisine_type, meal_type, prep_time_minutes, cook_time_minutes, servings, difficulty, instructions, tags) VALUES
('Classic Spaghetti Carbonara', 'Authentic Italian pasta dish with eggs, cheese, and pancetta', 'Italian', 'dinner', 10, 15, 4, 'medium', 
'1. Cook spaghetti in salted water\n2. Cook pancetta until crispy\n3. Whisk eggs with cheese\n4. Combine pasta with pancetta\n5. Add egg mixture off heat\n6. Toss quickly and serve', 
'pasta,italian,quick,comfort-food'),

('Chicken Stir Fry', 'Quick and healthy chicken and vegetable stir fry', 'Asian', 'dinner', 15, 10, 4, 'easy',
'1. Cut chicken into strips\n2. Heat oil in wok\n3. Cook chicken until golden\n4. Add vegetables\n5. Add sauce and toss\n6. Serve over rice',
'chicken,healthy,quick,asian'),

('Chocolate Chip Cookies', 'Classic homemade chocolate chip cookies', 'American', 'dessert', 15, 12, 24, 'easy',
'1. Cream butter and sugars\n2. Add eggs and vanilla\n3. Mix in flour mixture\n4. Fold in chocolate chips\n5. Drop on baking sheet\n6. Bake until golden',
'dessert,baking,cookies,sweet');

-- Insert sample ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, category) VALUES
(1, 'Spaghetti', 400, 'g', 'pasta'),
(1, 'Pancetta', 150, 'g', 'meat'),
(1, 'Parmesan cheese', 100, 'g', 'dairy'),
(1, 'Eggs', 3, 'whole', 'dairy'),
(1, 'Black pepper', 1, 'tsp', 'spices'),

(2, 'Chicken breast', 500, 'g', 'meat'),
(2, 'Bell peppers', 2, 'whole', 'vegetables'),
(2, 'Broccoli', 300, 'g', 'vegetables'),
(2, 'Soy sauce', 3, 'tbsp', 'condiments'),
(2, 'Garlic', 3, 'cloves', 'vegetables'),

(3, 'All-purpose flour', 300, 'g', 'baking'),
(3, 'Butter', 200, 'g', 'dairy'),
(3, 'Brown sugar', 150, 'g', 'baking'),
(3, 'White sugar', 100, 'g', 'baking'),
(3, 'Chocolate chips', 200, 'g', 'baking');

-- Insert sample pantry items
INSERT INTO recipe_pantry_items (item_name, category, current_quantity, unit, minimum_quantity, is_staple) VALUES
('All-purpose flour', 'baking', 2000, 'g', 500, TRUE),
('White sugar', 'baking', 1000, 'g', 200, TRUE),
('Brown sugar', 'baking', 800, 'g', 200, TRUE),
('Olive oil', 'oils', 500, 'ml', 100, TRUE),
('Salt', 'spices', 1000, 'g', 100, TRUE),
('Black pepper', 'spices', 50, 'g', 10, TRUE),
('Garlic', 'vegetables', 10, 'cloves', 3, TRUE),
('Eggs', 'dairy', 12, 'whole', 6, TRUE),
('Butter', 'dairy', 500, 'g', 250, TRUE),
('Soy sauce', 'condiments', 250, 'ml', 50, TRUE);

-- Verify the tables were created
SHOW TABLES LIKE 'recipe%';

SELECT 'Recipe Manager tables created successfully!' as status;