-- Add end_grain_segment_width column to cutting_board_designs table
ALTER TABLE cutting_board_designs 
ADD COLUMN end_grain_segment_width DECIMAL(4,2) DEFAULT 2.00 
AFTER custom_colors;
