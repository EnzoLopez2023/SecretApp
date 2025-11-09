# 🚀 Quick Setup - Recipe Image Upload

## One-Command Setup

### Option 1: MySQL Command Line Client (Recommended)

```sql
USE woodworking_projects;
SOURCE C:/Source/Repo/SecretApp/setup_recipe_image_features.sql
```

### Option 2: Copy & Paste SQL

Open MySQL Command Line Client and paste:

```sql
USE woodworking_projects;

-- Add images column
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS images JSON DEFAULT NULL AFTER image_url;

-- Create images table
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
) ENGINE=InnoDB;
```

## Restart Server

```powershell
# Press Ctrl+C to stop current server
node server.js
```

## Test It!

1. Open your Recipe Manager
2. Create a new recipe
3. Look for **"Upload Images"** button
4. Click it and select images from your computer
5. Save and enjoy! 📸

## That's It!

You can now upload images just like in your Woodworking Projects app!

- ✅ Upload from computer
- ✅ Or add by URL
- ✅ Multiple images per recipe
- ✅ Auto-saved to database
- ✅ First image shows on card
- ✅ All images in detail view

Happy cooking! 👨‍🍳
