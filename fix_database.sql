-- Add the missing file_size column to project_files table

USE woodworking_projects;

ALTER TABLE project_files 
ADD COLUMN file_size INT NOT NULL AFTER file_type;

-- Verify the change
DESCRIBE project_files;
