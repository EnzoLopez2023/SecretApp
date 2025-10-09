-- Create MyShop Inventory table in woodworking_projects database

USE woodworking_projects;

-- Drop table if it exists (for clean reinstall)
DROP TABLE IF EXISTS myshop_inventory;

-- Create the inventory table
CREATE TABLE myshop_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  order_number BIGINT,
  order_date INT,
  product_name VARCHAR(500) NOT NULL,
  product_detail TEXT,
  company VARCHAR(255),
  location VARCHAR(255),
  sub_location VARCHAR(255),
  tags VARCHAR(255),
  sku VARCHAR(100),
  price DECIMAL(10, 2) DEFAULT 0.00,
  qty INT DEFAULT 0,
  sku_on_website VARCHAR(255),
  barcode VARCHAR(255),
  notes TEXT,
  purchased VARCHAR(255),
  spare2 VARCHAR(255),
  base_url TEXT,
  full_url TEXT,
  html_link TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_item_id (item_id),
  INDEX idx_product_name (product_name(255)),
  INDEX idx_company (company),
  INDEX idx_sku (sku),
  INDEX idx_tags (tags)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify the table was created
DESCRIBE myshop_inventory;

SELECT 'MyShop Inventory table created successfully!' as status;
