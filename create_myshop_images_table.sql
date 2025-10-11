-- Create MyShop Images table to store item pictures

USE woodworking_projects;

-- Drop table if it exists (for clean reinstall)
DROP TABLE IF EXISTS myshop_images;

-- Create the images table
CREATE TABLE myshop_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_id INT NOT NULL,
  image_name VARCHAR(255) NOT NULL,
  image_data LONGBLOB NOT NULL,
  image_type VARCHAR(100) NOT NULL,
  image_size INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_id) REFERENCES myshop_inventory(id) ON DELETE CASCADE,
  INDEX idx_inventory_id (inventory_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify the table was created
DESCRIBE myshop_images;

SELECT 'MyShop Images table created successfully!' as status;
