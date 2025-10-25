-- Home Maintenance Tracker Database Schema
-- This script creates all necessary tables for the Home Maintenance Tracker app

-- 1. Main home items/locations table
CREATE TABLE IF NOT EXISTS home_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category ENUM('HVAC', 'Plumbing', 'Electrical', 'Appliances', 'Exterior', 'Interior', 'Flooring', 'Security', 'Landscaping', 'Other') NOT NULL DEFAULT 'Other',
    location VARCHAR(255),
    description TEXT,
    purchase_date DATE,
    installation_date DATE,
    manufacturer VARCHAR(255),
    model_number VARCHAR(255),
    serial_number VARCHAR(255),
    estimated_lifespan_years INT,
    replacement_cost DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_location (location)
);

-- 2. Maintenance tasks table
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type ENUM('Scheduled', 'Emergency', 'Preventive', 'Inspection', 'Repair', 'Replacement') NOT NULL DEFAULT 'Scheduled',
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled', 'Overdue') NOT NULL DEFAULT 'Pending',
    scheduled_date DATE,
    due_date DATE,
    completed_date DATE,
    estimated_duration_hours DECIMAL(4, 2),
    actual_duration_hours DECIMAL(4, 2),
    recurring_interval_days INT DEFAULT NULL,
    next_due_date DATE,
    assigned_to VARCHAR(255),
    notes TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES home_items(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_priority (priority),
    INDEX idx_item_id (item_id)
);

-- 3. Warranties table
CREATE TABLE IF NOT EXISTS warranties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT,
    warranty_type ENUM('Manufacturer', 'Extended', 'Service Plan', 'Insurance') NOT NULL DEFAULT 'Manufacturer',
    provider VARCHAR(255),
    warranty_number VARCHAR(255),
    start_date DATE,
    end_date DATE,
    coverage_description TEXT,
    claim_process TEXT,
    contact_info TEXT,
    document_path VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    ai_analyzed BOOLEAN DEFAULT FALSE,
    ai_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES home_items(id) ON DELETE CASCADE,
    INDEX idx_end_date (end_date),
    INDEX idx_is_active (is_active),
    INDEX idx_item_id (item_id)
);

-- 4. Maintenance photos table
CREATE TABLE IF NOT EXISTS maintenance_photos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT,
    task_id INT DEFAULT NULL,
    photo_name VARCHAR(255) NOT NULL,
    photo_data LONGBLOB NOT NULL,
    photo_type VARCHAR(50) NOT NULL,
    photo_size INT NOT NULL,
    photo_category ENUM('Before', 'After', 'During', 'Problem', 'Solution', 'Documentation', 'General') NOT NULL DEFAULT 'General',
    description TEXT,
    taken_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ai_analyzed BOOLEAN DEFAULT FALSE,
    ai_description TEXT,
    ai_tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES home_items(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id) ON DELETE SET NULL,
    INDEX idx_item_id (item_id),
    INDEX idx_task_id (task_id),
    INDEX idx_photo_category (photo_category),
    INDEX idx_taken_date (taken_date)
);

-- 5. Maintenance costs table
CREATE TABLE IF NOT EXISTS maintenance_costs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT,
    task_id INT DEFAULT NULL,
    cost_type ENUM('Labor', 'Materials', 'Tools', 'Professional Service', 'Parts', 'Emergency', 'Other') NOT NULL DEFAULT 'Other',
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    vendor VARCHAR(255),
    receipt_path VARCHAR(500),
    cost_date DATE NOT NULL,
    notes TEXT,
    tax_amount DECIMAL(10, 2),
    warranty_covered BOOLEAN DEFAULT FALSE,
    ai_categorized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES home_items(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id) ON DELETE SET NULL,
    INDEX idx_item_id (item_id),
    INDEX idx_task_id (task_id),
    INDEX idx_cost_date (cost_date),
    INDEX idx_cost_type (cost_type)
);

-- 6. Maintenance history/logs table
CREATE TABLE IF NOT EXISTS maintenance_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT,
    task_id INT DEFAULT NULL,
    action_type ENUM('Created', 'Updated', 'Completed', 'Cancelled', 'Photo Added', 'Cost Added', 'AI Analysis', 'Status Change') NOT NULL,
    description TEXT,
    old_value TEXT,
    new_value TEXT,
    user_name VARCHAR(255),
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES home_items(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id) ON DELETE SET NULL,
    INDEX idx_item_id (item_id),
    INDEX idx_task_id (task_id),
    INDEX idx_action_date (action_date),
    INDEX idx_action_type (action_type)
);

-- 7. AI insights and suggestions table
CREATE TABLE IF NOT EXISTS ai_insights (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT,
    insight_type ENUM('Maintenance Suggestion', 'Cost Prediction', 'Risk Assessment', 'Replacement Timing', 'Energy Efficiency', 'Safety Alert') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    status ENUM('New', 'Acknowledged', 'Acted Upon', 'Dismissed') DEFAULT 'New',
    predicted_date DATE,
    predicted_cost DECIMAL(10, 2),
    source_data JSON, -- Store the data used for the AI prediction
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES home_items(id) ON DELETE CASCADE,
    INDEX idx_item_id (item_id),
    INDEX idx_insight_type (insight_type),
    INDEX idx_priority (priority),
    INDEX idx_status (status)
);

-- Insert some sample data to get started
INSERT INTO home_items (name, category, location, description, purchase_date, manufacturer, estimated_lifespan_years, replacement_cost) VALUES
('Central Air Conditioning Unit', 'HVAC', 'Backyard', 'Main AC unit for whole house cooling', '2020-05-15', 'Carrier', 15, 5500.00),
('Water Heater', 'Plumbing', 'Basement', 'Natural gas water heater, 50 gallon capacity', '2019-03-10', 'Rheem', 10, 1200.00),
('Refrigerator', 'Appliances', 'Kitchen', 'Stainless steel French door refrigerator', '2021-08-20', 'Samsung', 12, 2800.00),
('Front Door', 'Exterior', 'Front Entrance', 'Solid wood front door with decorative glass', '2018-06-01', 'Pella', 25, 1500.00),
('Roof', 'Exterior', 'Whole House', 'Asphalt shingle roof with architectural shingles', '2017-09-15', 'GAF', 20, 12000.00);

-- Insert some sample maintenance tasks
INSERT INTO maintenance_tasks (item_id, title, description, task_type, priority, scheduled_date, due_date, recurring_interval_days) VALUES
(1, 'Replace AC Air Filter', 'Change HVAC air filter for optimal air quality and efficiency', 'Preventive', 'Medium', '2024-11-01', '2024-11-01', 90),
(1, 'Annual AC Maintenance', 'Professional inspection and tune-up of AC system', 'Scheduled', 'High', '2024-04-15', '2024-04-15', 365),
(2, 'Flush Water Heater', 'Drain and flush water heater to remove sediment buildup', 'Preventive', 'Medium', '2024-12-01', '2024-12-01', 365),
(3, 'Clean Refrigerator Coils', 'Clean condenser coils on back/bottom of refrigerator', 'Preventive', 'Low', '2024-11-15', '2024-11-15', 180),
(5, 'Roof Inspection', 'Visual inspection of roof for damage, loose shingles, or wear', 'Inspection', 'High', '2024-10-01', '2024-10-01', 365);

-- Insert some sample warranties
INSERT INTO warranties (item_id, warranty_type, provider, start_date, end_date, coverage_description, is_active) VALUES
(1, 'Manufacturer', 'Carrier', '2020-05-15', '2025-05-15', '5-year parts warranty on compressor and major components', TRUE),
(2, 'Manufacturer', 'Rheem', '2019-03-10', '2025-03-10', '6-year tank warranty, 1-year parts and labor', TRUE),
(3, 'Manufacturer', 'Samsung', '2021-08-20', '2022-08-20', '1-year full warranty on all parts and labor', FALSE),
(3, 'Extended', 'Best Buy', '2021-08-20', '2026-08-20', '5-year extended warranty covering repairs and replacement', TRUE);

COMMIT;