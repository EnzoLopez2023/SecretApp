-- Complete Recipe Manager Image Features Migration
-- Run this script to set up both the images JSON column and recipe_images table

USE woodworking_projects;

-- Step 1: Add images JSON column to recipes table (if not exists)
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'woodworking_projects' 
  AND TABLE_NAME = 'recipes' 
  AND COLUMN_NAME = 'images'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE recipes ADD COLUMN images JSON DEFAULT NULL AFTER image_url',
  'SELECT "images column already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Migrate existing image_url data to images array (if any)
UPDATE recipes 
SET images = JSON_ARRAY(image_url) 
WHERE image_url IS NOT NULL 
  AND image_url != '' 
  AND (images IS NULL OR JSON_LENGTH(images) = 0);

-- Step 3: Create recipe_images table for uploaded images
CREATE TABLE IF NOT EXISTS recipe_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_data LONGBLOB NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  INDEX idx_recipe_id (recipe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Display success message
SELECT 
  'Recipe image features setup complete!' as status,
  'You can now:' as message,
  '1. Add multiple images per recipe' as feature_1,
  '2. Upload images from your computer' as feature_2,
  '3. Add images by URL' as feature_3;
