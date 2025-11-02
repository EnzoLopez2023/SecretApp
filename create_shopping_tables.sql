-- Create missing shopping list tables for the SecretApp
-- Run this if the shopping list tables don't exist

USE woodworking_projects;

-- Create the shopping lists table if it doesn't exist
CREATE TABLE IF NOT EXISTS recipe_shopping_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('active', 'completed', 'archived') DEFAULT 'active',
  total_estimated_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the shopping list items table if it doesn't exist
CREATE TABLE IF NOT EXISTS recipe_shopping_list_items (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables were created
SHOW TABLES LIKE '%shopping%';