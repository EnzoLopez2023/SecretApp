-- Check all projects
SELECT * FROM projects;

-- Check all files
SELECT 
    id,
    project_id,
    file_name,
    file_type,
    file_size,
    uploaded_at
FROM project_files;

-- Check files with their project names
SELECT 
    p.id as project_id,
    p.title as project_title,
    pf.id as file_id,
    pf.file_name,
    pf.file_size,
    pf.uploaded_at
FROM projects p
LEFT JOIN project_files pf ON p.id = pf.project_id
ORDER BY p.created_at DESC, pf.uploaded_at DESC;
