-- Create cutting_board_designs table for storing cutting board designs
CREATE TABLE IF NOT EXISTS cutting_board_designs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  wood_pieces JSON NOT NULL,
  design_options JSON NOT NULL,
  flip_alternating_rows BOOLEAN DEFAULT FALSE,
  stagger_alternating_rows BOOLEAN DEFAULT FALSE,
  project_notes TEXT,
  custom_colors JSON,
  end_grain_segment_width DECIMAL(4,2) DEFAULT 2.00,
  juice_groove JSON,
  handle_holes JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
