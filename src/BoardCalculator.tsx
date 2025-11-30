import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  Typography,
  IconButton,
  Paper,
  Grid,
  Divider,
  Button,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

interface StockBoard {
  id: string;
  woodType: string;
  width: number;
  thickness: number;
  length: number;
  quantity: number;
}

interface BoardCalculatorProps {
  open: boolean;
  onClose: () => void;
}

const WOOD_TYPES = [
  'Maple',
  'Walnut',
  'Cherry',
  'Oak',
  'Mahogany',
  'Ash',
  'Birch',
  'Hickory',
  'Teak',
  'Purpleheart',
  'Padauk',
  'Sapele',
  'Other'
];

const WOOD_COLORS: { [key: string]: string } = {
  'Maple': '#f5deb3',
  'Walnut': '#5c4033',
  'Cherry': '#c95a3f',
  'Oak': '#c9a66b',
  'Mahogany': '#6b3410',
  'Ash': '#d4c5b3',
  'Birch': '#f3e5ab',
  'Hickory': '#b89968',
  'Teak': '#b5651d',
  'Purpleheart': '#722f5e',
  'Padauk': '#c44536',
  'Sapele': '#7f5347',
  'Other': '#8D6E63'
};

const BoardCalculator: React.FC<BoardCalculatorProps> = ({ open, onClose }) => {
  // Desired cutting board
  const [desiredWidth, setDesiredWidth] = useState('20');
  const [desiredLength, setDesiredLength] = useState('16');
  const [desiredThickness, setDesiredThickness] = useState('1.5');

  // Available stock boards
  const [stockBoards, setStockBoards] = useState<StockBoard[]>([
    {
      id: '1',
      woodType: 'Maple',
      width: 2,
      thickness: 0.75,
      length: 24,
      quantity: 10
    }
  ]);

  // Pre-designed pattern selection
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  
  // Color selection for patterns (indices into stockBoards array)
  const [mainColorIndex, setMainColorIndex] = useState(0);
  const [accentColorIndex, setAccentColorIndex] = useState(1);

  // Auto-adjust color indices when stock boards change
  React.useEffect(() => {
    if (stockBoards.length < 2) {
      // Not enough boards for 2-color patterns
      return;
    }
    
    // Ensure indices are valid
    if (mainColorIndex >= stockBoards.length) {
      setMainColorIndex(0);
    }
    if (accentColorIndex >= stockBoards.length) {
      setAccentColorIndex(Math.min(1, stockBoards.length - 1));
    }
    
    // Ensure they're different
    if (mainColorIndex === accentColorIndex && stockBoards.length >= 2) {
      setAccentColorIndex(mainColorIndex === 0 ? 1 : 0);
    }
  }, [stockBoards.length, mainColorIndex, accentColorIndex]);

  // Pattern definitions
  const PATTERNS = {
    'woven-2color': {
      name: '2 Color Woven Pattern',
      description: 'Brick parquet - each 2"×2" cube has 3 layers (outer/accent/outer)',
      image: '🎨',
      requiredColors: 2,
      cubeSize: 2,
      calculateNeeds: (width: number, length: number) => {
        // Each visual "cube" in the pattern is 2"×2" on the face
        // Each cube requires 3 pieces of 0.666"×2"×2" wood glued together:
        // - 2 pieces of main color (front and back layers)
        // - 1 piece of accent color (middle layer)
        const squaresWide = Math.floor(width / 2);
        const squaresLong = Math.floor(length / 2);
        const totalSquares = squaresWide * squaresLong;
        
        // All squares need the same 3-layer construction
        // Main color (outer layers): 2 pieces per cube
        // Accent color (middle layer): 1 piece per cube
        const mainPiecesNeeded = totalSquares * 2;  // 2 layers per cube
        const accentPiecesNeeded = totalSquares * 1; // 1 layer per cube
        
        return {
          mainSquares: totalSquares,
          secondarySquares: totalSquares,
          totalSquares,
          squaresWide,
          squaresLong,
          mainPiecesNeeded,
          accentPiecesNeeded
        };
      }
    },
    'woven-2color-thin': {
      name: '2 Color Woven Pattern with Thin Strip',
      description: 'Basketweave with thin accent - each 1.75"×1.75" cube has 3 layers (0.75"/0.25"/0.75")',
      image: '🎨',
      requiredColors: 2,
      cubeSize: 1.75,
      calculateNeeds: (width: number, length: number) => {
        // Each visual "cube" in the pattern is 1.75"×1.75" on the face
        // Each cube requires 3 pieces glued together:
        // - 2 pieces of main color at 0.75"×1.75"×1.75" (top and bottom layers)
        // - 1 piece of accent color at 0.25"×1.75"×1.75" (thin middle layer)
        const squaresWide = Math.floor(width / 1.75);
        const squaresLong = Math.floor(length / 1.75);
        const totalSquares = squaresWide * squaresLong;
        
        // Main color (outer layers): 2 pieces per cube at 0.75" thick
        // Accent color (thin middle layer): 1 piece per cube at 0.25" thick
        const mainPiecesNeeded = totalSquares * 2;  // 2 layers per cube
        const accentPiecesNeeded = totalSquares * 1; // 1 thin layer per cube
        
        return {
          mainSquares: totalSquares,
          secondarySquares: totalSquares,
          totalSquares,
          squaresWide,
          squaresLong,
          mainPiecesNeeded,
          accentPiecesNeeded
        };
      }
    }
  };

  // Helper functions
  const addStockBoard = () => {
    const newBoard: StockBoard = {
      id: Date.now().toString(),
      woodType: 'Maple',
      width: 2,
      thickness: 0.75,
      length: 24,
      quantity: 5
    };
    setStockBoards([...stockBoards, newBoard]);
  };

  const removeStockBoard = (id: string) => {
    setStockBoards(stockBoards.filter(board => board.id !== id));
  };

  const updateStockBoard = (id: string, field: keyof StockBoard, value: any) => {
    setStockBoards(stockBoards.map(board =>
      board.id === id ? { ...board, [field]: value } : board
    ));
  };

  // Calculate board area
  const calculateBoardArea = (width: number, length: number): number => {
    return width * length;
  };

  // Calculate linear inches needed for edge grain (using thickness as the glue-up dimension)
  const calculateEdgeGrainNeeds = (): {
    totalArea: number;
    stripsNeeded: number;
    boardsByType: { woodType: string; boardsNeeded: number; boardsAvailable: number; enoughStock: boolean; color: string }[];
    totalBoardsNeeded: number;
    totalBoardsAvailable: number;
    overallEnoughStock: boolean;
    patternInfo?: {
      name: string;
      mainSquares: number;
      secondarySquares: number;
      squaresWide: number;
      squaresLong: number;
      mainPiecesNeeded: number;
      accentPiecesNeeded: number;
    };
  } => {
    const dWidth = parseFloat(desiredWidth) || 0;
    const dLength = parseFloat(desiredLength) || 0;
    const dThickness = parseFloat(desiredThickness) || 0;

    // Total board area (face)
    const totalArea = calculateBoardArea(dWidth, dLength);

    let boardsByType;
    let patternInfo;

    // Check if a pattern is selected
    if (selectedPattern && PATTERNS[selectedPattern as keyof typeof PATTERNS]) {
      const pattern = PATTERNS[selectedPattern as keyof typeof PATTERNS];
      const needs = pattern.calculateNeeds(dWidth, dLength);
      
      patternInfo = {
        name: pattern.name,
        mainSquares: needs.mainSquares,
        secondarySquares: needs.secondarySquares,
        squaresWide: needs.squaresWide,
        squaresLong: needs.squaresLong,
        mainPiecesNeeded: needs.mainPiecesNeeded || needs.mainSquares,
        accentPiecesNeeded: needs.accentPiecesNeeded || needs.secondarySquares
      };

      // For pattern-based calculation with 3-layer cubes
      // Use selected colors instead of first two boards
      const mainBoard = stockBoards[mainColorIndex];
      const accentBoard = stockBoards[accentColorIndex];
      
      boardsByType = [mainBoard, accentBoard].map((board, idx) => {
        // Main color needs 2 pieces per cube, accent needs 1 piece per cube
        const piecesNeeded = idx === 0 
          ? (needs.mainPiecesNeeded || needs.mainSquares * 2)
          : (needs.accentPiecesNeeded || needs.secondarySquares);
        
        // Get the cube size from pattern (2" or 1.75")
        const cubeSize = pattern.cubeSize || 2;
        
        // How many pieces can we get from one board?
        const piecesPerBoard = Math.floor(board.length / cubeSize);
        
        // Total boards needed
        const boardsNeeded = piecesPerBoard > 0 ? Math.ceil(piecesNeeded / piecesPerBoard) : 0;

        return {
          woodType: board.woodType,
          boardsNeeded,
          boardsAvailable: board.quantity,
          enoughStock: board.quantity >= boardsNeeded,
          color: WOOD_COLORS[board.woodType] || WOOD_COLORS['Other']
        };
      });
    } else {
      // Standard edge grain calculation
      boardsByType = stockBoards.map(board => {
        // For edge grain: strips are glued on their thickness edge
        // Each strip contributes its width to the board length
        const stripsNeeded = Math.ceil(dLength / board.width);

        // Each strip needs to be as long as the desired width
        // How many strips can we get from one available board?
        const stripsPerBoard = Math.floor(board.length / dWidth);

        // Total boards needed for this wood type
        const boardsNeeded = stripsPerBoard > 0 ? Math.ceil(stripsNeeded / stripsPerBoard) : 0;

        return {
          woodType: board.woodType,
          boardsNeeded,
          boardsAvailable: board.quantity,
          enoughStock: board.quantity >= boardsNeeded,
          color: WOOD_COLORS[board.woodType] || WOOD_COLORS['Other']
        };
      });
    }

    // Use the first board type for strip calculation (or average if you prefer)
    const firstBoard = stockBoards[0];
    const stripsNeeded = firstBoard ? Math.ceil(dLength / firstBoard.width) : 0;

    const totalBoardsNeeded = boardsByType.reduce((sum, b) => sum + b.boardsNeeded, 0);
    const totalBoardsAvailable = boardsByType.reduce((sum, b) => sum + b.boardsAvailable, 0);
    const overallEnoughStock = boardsByType.every(b => b.enoughStock);

    return {
      totalArea,
      stripsNeeded,
      boardsByType,
      totalBoardsNeeded,
      totalBoardsAvailable,
      overallEnoughStock,
      ...(patternInfo && { patternInfo })
    };
  };

  const results = calculateEdgeGrainNeeds();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Board Calculator</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={3}>
            {/* Desired Board and Available Stock in same row */}
            <Grid item xs={12}>
              <Grid container spacing={3}>
                {/* Desired Board - Made Smaller */}
                <Grid item xs={10} md={2}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontSize: '1rem' }}>
                      Desired Cutting Board
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <TextField
                        label="Width"
                        type="number"
                        value={desiredWidth}
                        onChange={(e) => setDesiredWidth(e.target.value)}
                        fullWidth
                        size="small"
                        inputProps={{ step: 0.25, min: 0 }}
                      />
                      <TextField
                        label="Length"
                        type="number"
                        value={desiredLength}
                        onChange={(e) => setDesiredLength(e.target.value)}
                        fullWidth
                        size="small"
                        inputProps={{ step: 0.25, min: 0 }}
                      />
                      <TextField
                        label="Thickness"
                        type="number"
                        value={desiredThickness}
                        onChange={(e) => setDesiredThickness(e.target.value)}
                        fullWidth
                        size="small"
                        inputProps={{ step: 0.125, min: 0 }}
                      />
                    </Box>
                  </Paper>
                  
                  {/* Standard Size Reference */}
                  <Paper elevation={1} sx={{ p: 1.5, mt: 2, bgcolor: '#fff8e1', border: '1px solid #fbc02d' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: '#f57f17' }}>
                      📏 Standard Sizes
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        <strong>Large:</strong> 16"L × 14"W
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        <strong>XL:</strong> 20"L × 16"W
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        <strong>XXL:</strong> 24"L × 18"W
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {/* Available Boards - Made Larger */}
                <Grid item xs={15} md={12}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: '#1565c0' }}>
                        Available Stock Boards
                      </Typography>
                      <Button
                        startIcon={<AddIcon />}
                        variant="contained"
                        size="small"
                        onClick={addStockBoard}
                      >
                        Add
                      </Button>
                    </Box>
                
                <Stack spacing={2}>
                  {stockBoards.map((board) => (
                    <Paper key={board.id} elevation={1} sx={{ p: 1.5, bgcolor: 'white' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        {/* Wood Type */}
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel>Wood</InputLabel>
                          <Select
                            value={board.woodType}
                            label="Wood"
                            onChange={(e) => updateStockBoard(board.id, 'woodType', e.target.value)}
                          >
                            {WOOD_TYPES.map((type) => (
                              <MenuItem key={type} value={type}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    sx={{
                                      width: 16,
                                      height: 16,
                                      bgcolor: WOOD_COLORS[type],
                                      border: '1px solid #999'
                                    }}
                                  />
                                  {type}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {/* Dimensions */}
                        <TextField
                          label="W"
                          type="number"
                          size="small"
                          value={board.width}
                          onChange={(e) => updateStockBoard(board.id, 'width', parseFloat(e.target.value))}
                          sx={{ width: 60 }}
                          inputProps={{ step: 0.25, min: 0 }}
                        />
                        <TextField
                          label="T"
                          type="number"
                          size="small"
                          value={board.thickness}
                          onChange={(e) => updateStockBoard(board.id, 'thickness', parseFloat(e.target.value))}
                          sx={{ width: 80 }}
                          inputProps={{ step: 0.125, min: 0 }}
                        />
                        <TextField
                          label="L"
                          type="number"
                          size="small"
                          value={board.length}
                          onChange={(e) => updateStockBoard(board.id, 'length', parseFloat(e.target.value))}
                          sx={{ width: 60 }}
                          inputProps={{ step: 0.25, min: 0 }}
                        />
                        <TextField
                          label="Qty"
                          type="number"
                          size="small"
                          value={board.quantity}
                          onChange={(e) => updateStockBoard(board.id, 'quantity', parseInt(e.target.value))}
                          sx={{ width: 60 }}
                          inputProps={{ step: 1, min: 0 }}
                        />

                        {/* Delete button */}
                        <IconButton
                          size="small"
                          onClick={() => removeStockBoard(board.id)}
                          disabled={stockBoards.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      {/* Summary */}
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                        {board.quantity} × {board.width}"W × {board.thickness}"T × {board.length}"L
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            </Grid>
              </Grid>
            </Grid>

            {/* Pre-Designed Patterns */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2, bgcolor: '#f3e5f5' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#6a1b9a' }}>
                  🎨 Pre-Designed Cutting Board Ideas
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
                  Select a pattern to calculate exact board requirements
                </Typography>
                
                {/* Color Selection for 2-Color Patterns */}
                {selectedPattern && stockBoards.length >= 2 && (
                  <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: '#fff9e6', border: '2px solid #fbc02d' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#f57f17' }}>
                      🎨 Select Colors for Pattern
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Main Color (Outer Layers)</InputLabel>
                          <Select
                            value={mainColorIndex}
                            label="Main Color (Outer Layers)"
                            onChange={(e) => setMainColorIndex(Number(e.target.value))}
                          >
                            {stockBoards.map((board, idx) => (
                              <MenuItem key={board.id} value={idx} disabled={idx === accentColorIndex}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      bgcolor: WOOD_COLORS[board.woodType],
                                      border: '2px solid #333',
                                      borderRadius: 0.5
                                    }}
                                  />
                                  <Typography>{board.woodType}</Typography>
                                  {idx === accentColorIndex && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                                      (Used as accent)
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Accent Color (Middle Layer)</InputLabel>
                          <Select
                            value={accentColorIndex}
                            label="Accent Color (Middle Layer)"
                            onChange={(e) => setAccentColorIndex(Number(e.target.value))}
                          >
                            {stockBoards.map((board, idx) => (
                              <MenuItem key={board.id} value={idx} disabled={idx === mainColorIndex}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      bgcolor: WOOD_COLORS[board.woodType],
                                      border: '2px solid #333',
                                      borderRadius: 0.5
                                    }}
                                  />
                                  <Typography>{board.woodType}</Typography>
                                  {idx === mainColorIndex && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                                      (Used as main)
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                      💡 Main color forms the outer layers (2 pieces per cube), accent color is the middle stripe (1 piece per cube)
                    </Typography>
                  </Paper>
                )}
                
                <Grid container spacing={2}>
                  {/* 2 Color Woven Pattern */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper
                      elevation={selectedPattern === 'woven-2color' ? 4 : 1}
                      onClick={() => setSelectedPattern(selectedPattern === 'woven-2color' ? null : 'woven-2color')}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedPattern === 'woven-2color' ? '3px solid #6a1b9a' : '1px solid #ddd',
                        bgcolor: selectedPattern === 'woven-2color' ? '#f3e5f5' : 'white',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h4">🎨</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          2 Color Woven Pattern
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 2 }}>
                        Brick parquet - groups of 3 pieces alternate horizontal/vertical
                      </Typography>
                      
                      {/* Pattern Preview */}
                      <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(10, 1fr)',
                        gap: '1px',
                        bgcolor: '#ddd',
                        p: 0.5,
                        borderRadius: 1,
                        mb: 2,
                        border: '1px solid #999'
                      }}>
                        {Array.from({ length: 80 }, (_, idx) => {
                          const row = Math.floor(idx / 10);
                          const col = idx % 10;
                          
                          // Simple checkerboard alternation (same as thin strip pattern)
                          const isHorizontal = (row + col) % 2 === 0;
                          
                          // Get colors from selected indices
                          const color1 = stockBoards[accentColorIndex] ? WOOD_COLORS[stockBoards[accentColorIndex].woodType] : '#722f5e'; // Accent
                          const color2 = stockBoards[mainColorIndex] ? WOOD_COLORS[stockBoards[mainColorIndex].woodType] : '#f5deb3'; // Main
                          
                          // ALL cubes are main color with accent stripe
                          // Standard pattern has thicker accent (0.666" vs 0.25")
                          return (
                            <Box
                              key={idx}
                              sx={{
                                aspectRatio: '1',
                                bgcolor: color2, // All cubes are main color
                                border: '0.5px solid rgba(0,0,0,0.1)',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              {/* Show accent stripe - thicker than thin strip (33% vs 14%) */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  ...(isHorizontal ? {
                                    // Horizontal: accent runs horizontally
                                    top: '33%',  // 0.666 / 2.0 = 33%
                                    left: 0,
                                    right: 0,
                                    height: '33%',  // 0.666 / 2.0 = 33%
                                  } : {
                                    // Vertical: accent runs vertically
                                    left: '33%',
                                    top: 0,
                                    bottom: 0,
                                    width: '33%',
                                  }),
                                  bgcolor: color1, // Accent color stripe
                                  opacity: 1
                                }}
                              />
                              {/* Grain direction indicator */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: isHorizontal
                                    ? 'repeating-linear-gradient(90deg, transparent 0px, transparent 40%, rgba(0,0,0,0.03) 45%, rgba(0,0,0,0.03) 55%, transparent 60%, transparent 100%)'
                                    : 'repeating-linear-gradient(0deg, transparent 0px, transparent 40%, rgba(0,0,0,0.03) 45%, rgba(0,0,0,0.03) 55%, transparent 60%, transparent 100%)',
                                  pointerEvents: 'none'
                                }}
                              />
                            </Box>
                          );
                        })}
                      </Box>
                      
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label="Requires 2 Wood Types"
                          size="small"
                          sx={{ bgcolor: '#ce93d8', color: 'white' }}
                        />
                      </Box>
                      {selectedPattern === 'woven-2color' && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: '#e1bee7', borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a1b9a' }}>
                            ✓ Selected - Calculating based on this pattern
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* 2 Color Woven Pattern with Thin Strip */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper
                      elevation={selectedPattern === 'woven-2color-thin' ? 4 : 1}
                      onClick={() => setSelectedPattern(selectedPattern === 'woven-2color-thin' ? null : 'woven-2color-thin')}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedPattern === 'woven-2color-thin' ? '3px solid #6a1b9a' : '1px solid #ddd',
                        bgcolor: selectedPattern === 'woven-2color-thin' ? '#f3e5f5' : 'white',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h4">🎨</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          2 Color Woven with Thin Strip
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 2 }}>
                        Basketweave with thin accent - 1.75"×1.75" cubes (0.75"/0.25"/0.75")
                      </Typography>
                      
                      {/* Pattern Preview - Show thin accent strip proportions */}
                      <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(10, 1fr)',
                        gap: '1px',
                        bgcolor: '#ddd',
                        p: 0.5,
                        borderRadius: 1,
                        mb: 2,
                        border: '1px solid #999'
                      }}>
                        {Array.from({ length: 80 }, (_, idx) => {
                          const row = Math.floor(idx / 10);
                          const col = idx % 10;
                          
                          // Each individual cube alternates in a checkerboard pattern
                          // No 3×3 grouping - just simple checkerboard
                          const isHorizontalBlock = (row + col) % 2 === 0;
                          
                          const color1 = stockBoards[accentColorIndex] ? WOOD_COLORS[stockBoards[accentColorIndex].woodType] : '#722f5e'; // Accent (dark stripe)
                          const color2 = stockBoards[mainColorIndex] ? WOOD_COLORS[stockBoards[mainColorIndex].woodType] : '#f5deb3'; // Main (light background)
                          
                          // For thin strip pattern, ALL cubes are main color with thin accent stripe
                          // The stripe orientation matches the block orientation
                          return (
                            <Box
                              key={idx}
                              sx={{
                                aspectRatio: '1',
                                bgcolor: color2, // ALL cubes are main color (light)
                                border: '0.5px solid rgba(0,0,0,0.1)',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              {/* Show thin accent stripe in the middle of EVERY cube */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  ...(isHorizontalBlock ? {
                                    // Horizontal block: thin accent runs horizontally
                                    top: '42%',
                                    left: 0,
                                    right: 0,
                                    height: '14%',  // 0.25 / 1.75 = 14.3%
                                  } : {
                                    // Vertical block: thin accent runs vertically
                                    left: '42%',
                                    top: 0,
                                    bottom: 0,
                                    width: '14%',
                                  }),
                                  bgcolor: color1, // Accent color (dark stripe)
                                  opacity: 1
                                }}
                              />
                              {/* Grain direction indicator */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: isHorizontalBlock
                                    ? 'repeating-linear-gradient(90deg, transparent 0px, transparent 40%, rgba(0,0,0,0.03) 45%, rgba(0,0,0,0.03) 55%, transparent 60%, transparent 100%)'
                                    : 'repeating-linear-gradient(0deg, transparent 0px, transparent 40%, rgba(0,0,0,0.03) 45%, rgba(0,0,0,0.03) 55%, transparent 60%, transparent 100%)',
                                  pointerEvents: 'none'
                                }}
                              />
                            </Box>
                          );
                        })}
                      </Box>
                      
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label="Requires 2 Wood Types"
                          size="small"
                          sx={{ bgcolor: '#ce93d8', color: 'white' }}
                        />
                        <Chip
                          label="Thin Accent (0.25″)"
                          size="small"
                          sx={{ bgcolor: '#ba68c8', color: 'white' }}
                        />
                      </Box>
                      {selectedPattern === 'woven-2color-thin' && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: '#e1bee7', borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#6a1b9a' }}>
                            ✓ Selected - Calculating based on this pattern
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Placeholder for future patterns */}
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '2px dashed #ddd',
                        bgcolor: '#fafafa',
                        opacity: 0.6
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h4">➕</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          More Patterns Coming Soon
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        Additional design patterns will be added here
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Results */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3, bgcolor: '#fff3e0' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#e65100' }}>
                  📊 Calculation Results
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Pattern Info (if selected) */}
                  {results.patternInfo && (
                    <>
                      <Paper elevation={1} sx={{ p: 2, bgcolor: '#f3e5f5', border: '2px solid #6a1b9a' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#6a1b9a', mb: 1 }}>
                          🎨 Pattern: {results.patternInfo.name}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Grid Size:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {results.patternInfo.squaresWide} × {results.patternInfo.squaresLong} squares
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Main Color Cubes:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {results.patternInfo.mainSquares} cubes
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Accent Color Cubes:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {results.patternInfo.secondarySquares} cubes
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Layer Ratio:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              2:1 (main:accent layers)
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              ℹ️ {selectedPattern === 'woven-2color-thin' 
                                ? 'Each 1.75"×1.75" cube = 3 layers: Main (0.75") / Accent (0.25") / Main (0.75")'
                                : 'Each 2"×2" cube = 3 layers: Main (0.666") / Accent (0.666") / Main (0.666")'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Main Pieces Needed:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                              {results.patternInfo.mainPiecesNeeded} pieces
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Accent Pieces Needed:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                              {results.patternInfo.accentPiecesNeeded} pieces
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                      
                      {/* Large Pattern Preview */}
                      <Paper elevation={2} sx={{ p: 2, bgcolor: 'white' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          Pattern Preview ({results.patternInfo.squaresWide} × {results.patternInfo.squaresLong} grid):
                        </Typography>
                        <Box sx={{ 
                          display: 'grid',
                          gridTemplateColumns: `repeat(${results.patternInfo.squaresWide}, 1fr)`,
                          gap: '2px',
                          bgcolor: '#333',
                          p: 1,
                          borderRadius: 1,
                          border: '2px solid #6a1b9a',
                          maxWidth: 400,
                          margin: '0 auto'
                        }}>
                          {Array.from({ length: results.patternInfo.squaresWide * results.patternInfo.squaresLong }, (_, idx) => {
                            const row = Math.floor(idx / results.patternInfo.squaresWide);
                            const col = idx % results.patternInfo.squaresWide;
                            
                            // Check if this is the thin strip pattern
                            const isThinStripPattern = selectedPattern === 'woven-2color-thin';
                            
                            // Both patterns use simple checkerboard alternation
                            const isHorizontalOrientation = (row + col) % 2 === 0;
                            
                            const color1 = stockBoards[accentColorIndex] ? WOOD_COLORS[stockBoards[accentColorIndex].woodType] : '#722f5e'; // Accent
                            const color2 = stockBoards[mainColorIndex] ? WOOD_COLORS[stockBoards[mainColorIndex].woodType] : '#f5deb3'; // Main
                            
                            return (
                              <Box
                                key={idx}
                                sx={{
                                  aspectRatio: '1',
                                  bgcolor: color2, // Both patterns: all cubes are main color
                                  border: '0.5px solid rgba(0,0,0,0.2)',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}
                              >
                                {/* Show accent stripe for both patterns */}
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    ...(isHorizontalOrientation ? {
                                      top: isThinStripPattern ? '42%' : '33%',
                                      left: 0,
                                      right: 0,
                                      height: isThinStripPattern ? '14%' : '33%',
                                    } : {
                                      left: isThinStripPattern ? '42%' : '33%',
                                      top: 0,
                                      bottom: 0,
                                      width: isThinStripPattern ? '14%' : '33%',
                                    }),
                                    bgcolor: color1,
                                    opacity: 1
                                  }}
                                />
                                {/* Grain direction indicator */}
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: isHorizontalOrientation
                                      ? 'repeating-linear-gradient(90deg, transparent 0px, transparent 40%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.08) 55%, transparent 60%, transparent 100%)'
                                      : 'repeating-linear-gradient(0deg, transparent 0px, transparent 40%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.08) 55%, transparent 60%, transparent 100%)',
                                    pointerEvents: 'none'
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              width: 20, 
                              height: 20, 
                              bgcolor: stockBoards[mainColorIndex] ? WOOD_COLORS[stockBoards[mainColorIndex].woodType] : '#f5deb3',
                              border: '2px solid #333',
                              borderRadius: 0.5
                            }} />
                            <Typography variant="caption">
                              {stockBoards[mainColorIndex]?.woodType || 'Main Color'} (Main - Outer Layers)
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              width: 20, 
                              height: 20, 
                              bgcolor: stockBoards[accentColorIndex] ? WOOD_COLORS[stockBoards[accentColorIndex].woodType] : '#722f5e',
                              border: '2px solid #333',
                              borderRadius: 0.5
                            }} />
                            <Typography variant="caption">
                              {stockBoards[accentColorIndex]?.woodType || 'Accent Color'} (Accent - Middle Stripe)
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                          Alternating rows with 90° rotated grain direction
                        </Typography>
                      </Paper>
                      
                      <Divider />
                    </>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Total Board Area:
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#e65100' }}>
                      {results.totalArea.toFixed(2)} sq in
                    </Typography>
                  </Box>

                  {!selectedPattern && (
                    <>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          Strips Needed (for {desiredLength}" length):
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#e65100' }}>
                          {results.stripsNeeded} strips
                        </Typography>
                      </Box>
                    </>
                  )}

                  <Divider />

                  {/* Boards by Wood Type */}
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#e65100' }}>
                    Stock Breakdown by Wood Type:
                  </Typography>
                  
                  {results.boardsByType.map((boardType, idx) => (
                    <Paper
                      key={idx}
                      elevation={1}
                      sx={{
                        p: 2,
                        bgcolor: 'white',
                        border: `2px solid ${boardType.enoughStock ? '#4caf50' : '#f44336'}`
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            bgcolor: boardType.color,
                            border: '2px solid #333',
                            borderRadius: 1
                          }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {boardType.woodType}
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Boards Needed:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {boardType.boardsNeeded}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Boards Available:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: boardType.enoughStock ? '#2e7d32' : '#d32f2f' }}>
                            {boardType.boardsAvailable}
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={boardType.enoughStock ? '✅ Enough Stock' : '❌ Need More'}
                          size="small"
                          sx={{
                            bgcolor: boardType.enoughStock ? '#c8e6c9' : '#ffcdd2',
                            color: boardType.enoughStock ? '#1b5e20' : '#b71c1c',
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    </Paper>
                  ))}

                  <Divider />

                  {/* Overall Summary */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Total Boards Needed:
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#d32f2f' }}>
                      {results.totalBoardsNeeded} boards
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Total Boards Available:
                    </Typography>
                    <Typography variant="h6" sx={{ color: results.overallEnoughStock ? '#2e7d32' : '#d32f2f' }}>
                      {results.totalBoardsAvailable} boards
                    </Typography>
                  </Box>

                  <Divider />

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: results.overallEnoughStock ? '#c8e6c9' : '#ffcdd2',
                      border: `2px solid ${results.overallEnoughStock ? '#2e7d32' : '#d32f2f'}`
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: results.overallEnoughStock ? '#1b5e20' : '#b71c1c',
                        textAlign: 'center',
                        fontWeight: 600
                      }}
                    >
                      {results.overallEnoughStock
                        ? '✅ You have enough stock for all wood types!'
                        : `❌ Need ${results.totalBoardsNeeded - results.totalBoardsAvailable} more boards total`}
                    </Typography>
                  </Paper>

                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
                    💡 Calculation assumes edge grain construction where strips are glued on their thickness edge.
                    Each strip runs the full {desiredWidth}" width of the board.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BoardCalculator;
