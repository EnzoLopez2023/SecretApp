import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
  Alert,
  Chip,
  Stack,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  FormControlLabel,
  Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DownloadIcon from '@mui/icons-material/Download';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CalculateIcon from '@mui/icons-material/Calculate';
import StraightenIcon from '@mui/icons-material/Straighten';
import FractionCalculator from './FractionCalculator';
import BoardCalculator from './BoardCalculator';

interface WoodPiece {
  id: string;
  woodType: string;
  quantity: number;
  thickness: number; // inches
  width: number; // inches
  length: number; // inches
  customColor?: string; // optional custom color override
}

interface DesignOption {
  type: 'face-grain' | 'edge-grain' | 'end-grain';
  dimensions: {
    length: number;
    width: number;
    thickness: number;
  };
  description: string;
  cuts: number;
  wasteFromKerf: number;
  pattern: string[];
  id: string; // Unique ID for regenerating individual patterns
  // Juice Groove settings (per-design)
  juiceGrooveEnabled: boolean;
  juiceGrooveWidth: number; // inches
  juiceGrooveDepth: number; // inches
  juiceGrooveDistance: number; // inches from edge
  // Handle Holes settings (per-design)
  handleHolesEnabled: boolean;
  handleHoleCount: number;
  handleHoleDiameter: number; // inches
  handleHolePositionX: number; // percentage from left
  handleHolePositionY: number; // percentage from top
}

const CuttingBoardDesigner: React.FC = () => {
  const [woodPieces, setWoodPieces] = useState<WoodPiece[]>([
    {
      id: '1',
      woodType: 'Walnut',
      quantity: 5,
      thickness: 0.75,
      width: 2,
      length: 24
    }
  ]);

  const [designOptions, setDesignOptions] = useState<DesignOption[]>([]);
  const [flipAlternatingRows, setFlipAlternatingRows] = useState(false);
  const [staggerAlternatingRows, setStaggerAlternatingRows] = useState(false);
  const [zoomedView, setZoomedView] = useState<{ option: DesignOption; viewType: '2d' | '3d' } | null>(null);
  
  // Project metadata
  const [projectName, setProjectName] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [currentDesignId, setCurrentDesignId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);

  // Calculator dialogs
  const [fractionCalcOpen, setFractionCalcOpen] = useState(false);
  const [boardCalcOpen, setBoardCalcOpen] = useState(false);

  // Comparison view
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>([]);

  // End grain segment width settings
  const [endGrainSegmentWidth, setEndGrainSegmentWidth] = useState(2); // inches - width of cut strips

  // Helper function to update a specific option's juice groove settings
  const updateOptionJuiceGroove = (optionId: string, updates: Partial<Pick<DesignOption, 'juiceGrooveEnabled' | 'juiceGrooveWidth' | 'juiceGrooveDepth' | 'juiceGrooveDistance'>>) => {
    setDesignOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, ...updates } : opt
    ));
  };

  // Helper function to update a specific option's handle holes settings
  const updateOptionHandleHoles = (optionId: string, updates: Partial<Pick<DesignOption, 'handleHolesEnabled' | 'handleHoleCount' | 'handleHoleDiameter' | 'handleHolePositionX' | 'handleHolePositionY'>>) => {
    setDesignOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, ...updates } : opt
    ));
  };

  const addWoodPiece = () => {
    const newPiece: WoodPiece = {
      id: Date.now().toString(),
      woodType: '',
      quantity: 1,
      thickness: 0.75,
      width: 2,
      length: 24
    };
    setWoodPieces([...woodPieces, newPiece]);
  };

  const removeWoodPiece = (id: string) => {
    setWoodPieces(woodPieces.filter(piece => piece.id !== id));
  };

  const updateWoodPiece = (id: string, field: keyof WoodPiece, value: string | number) => {
    setWoodPieces(
      woodPieces.map(piece =>
        piece.id === id ? { ...piece, [field]: value } : piece
      )
    );
  };

  // Helper function to get display title for design options
  const getOptionTitle = (option: DesignOption): string => {
    if (option.id === 'end-grain-from-edge') {
      return 'END GRAIN (FROM EDGE GRAIN)';
    } else if (option.id === 'end-grain-from-face') {
      return 'END GRAIN (FROM FACE GRAIN)';
    }
    return option.type.toUpperCase();
  };

  const generateDesigns = () => {
    const options: DesignOption[] = [];
    const KERF_WIDTH = 0.125; // 1/8 inch blade width

    // Validate we have wood pieces
    if (woodPieces.length === 0) return;

    const totalQuantity = woodPieces.reduce((sum, piece) => sum + piece.quantity, 0);
    const avgThickness = woodPieces[0]?.thickness || 0.75;
    const avgWidth = woodPieces[0]?.width || 2;
    const maxLength = Math.max(...woodPieces.map(p => p.length));

    // Create alternating pattern from available woods
    const generateAlternatingPattern = (count: number): string[] => {
      const availableWoods = woodPieces.filter(p => p.woodType.trim() !== '');
      if (availableWoods.length === 0) return [];
      
      const pattern: string[] = [];
      for (let i = 0; i < count; i++) {
        const woodIndex = i % availableWoods.length;
        pattern.push(availableWoods[woodIndex].woodType);
      }
      return pattern;
    };

    // Create pattern respecting individual piece quantities
    const generatePatternByPieces = (): string[] => {
      const availableWoods = woodPieces.filter(p => p.woodType.trim() !== '');
      if (availableWoods.length === 0) return [];
      
      const pattern: string[] = [];
      
      // Add each wood type based on its quantity
      for (const wood of availableWoods) {
        for (let i = 0; i < wood.quantity; i++) {
          pattern.push(wood.woodType);
        }
      }
      
      return pattern;
    };

    // FACE GRAIN: Glue along the narrow edges (3/4" edges), cutting surface is the wide face
    // When you glue 3/4" edges together, the 2" faces create the width
    // Result: Shows the wide face of the wood
    const faceGrainWidth = totalQuantity * avgWidth; // 2" faces create the width
    const faceGrainPattern = generatePatternByPieces();
    
    options.push({
      type: 'face-grain',
      id: 'face-grain-1',
      dimensions: {
        length: maxLength,
        width: faceGrainWidth,
        thickness: avgThickness  // 3/4" thickness
      },
      description: `Glue pieces along their narrow edges (${avgThickness}" side). The ${avgWidth}" faces create the width. Shows ${faceGrainPattern.length} strips (${totalQuantity} pieces). Wide face pattern.`,
      cuts: 0,
      wasteFromKerf: 0,
      pattern: faceGrainPattern,
      // Default juice groove settings
      juiceGrooveEnabled: false,
      juiceGrooveWidth: 0.5,
      juiceGrooveDepth: 0.25,
      juiceGrooveDistance: 0.75,
      // Default handle holes settings
      handleHolesEnabled: false,
      handleHoleCount: 2,
      handleHoleDiameter: 1.25,
      handleHolePositionX: 50,
      handleHolePositionY: 50
    });

    // EDGE GRAIN: Glue along the wide faces (2" faces together)
    // When you glue 2" faces together, the 3/4" edges create the width
    // Result: Shows the narrow edge of the wood
    const edgeGrainWidth = totalQuantity * avgThickness; // 3/4" edges create the width
    const edgeGrainPattern = generatePatternByPieces();
    
    options.push({
      type: 'edge-grain',
      id: 'edge-grain-1',
      dimensions: {
        length: maxLength,
        width: edgeGrainWidth,
        thickness: avgWidth  // 2" thickness
      },
      description: `Glue pieces along their wide faces (${avgWidth}" side). The ${avgThickness}" edges create the width. Shows ${edgeGrainPattern.length} strips (${totalQuantity} pieces). Narrow edge pattern.`,
      cuts: 0,
      wasteFromKerf: 0,
      pattern: edgeGrainPattern,
      // Default juice groove settings
      juiceGrooveEnabled: false,
      juiceGrooveWidth: 0.5,
      juiceGrooveDepth: 0.25,
      juiceGrooveDistance: 0.75,
      // Default handle holes settings
      handleHolesEnabled: false,
      handleHoleCount: 2,
      handleHoleDiameter: 1.25,
      handleHolePositionX: 50,
      handleHolePositionY: 50
    });

    // END GRAIN FROM EDGE GRAIN: Take edge grain board, cut into strips, rotate 90°, and reglue
    const segmentWidthEdge = endGrainSegmentWidth; // use user-defined segment width
    const numberOfCutsEdge = Math.floor(maxLength / segmentWidthEdge);
    const totalKerfLossEdge = numberOfCutsEdge * KERF_WIDTH;
    
    // After cutting and rotating from edge grain:
    // - Each strip is segmentWidth long, edgeGrainWidth wide, avgWidth thick
    // - When rotated: avgWidth becomes the new LENGTH dimension per strip
    // - segmentWidth becomes the new THICKNESS
    // - Width stays the same
    const endGrainFromEdgeWidth = edgeGrainWidth; // maintains the edge grain width (5.25")
    const endGrainFromEdgeLength = numberOfCutsEdge * avgWidth; // e.g. 12 strips × 2" = 24"
    const endGrainFromEdgeThickness = segmentWidthEdge - (totalKerfLossEdge / numberOfCutsEdge); // segment width - kerf

    // Create end grain pattern by flipping alternating rows
    // This creates interesting brick-lay or checkerboard patterns
    const generateEndGrainFromEdgePattern = (): string[] => {
      const basePattern = [...edgeGrainPattern];
      const numRows = numberOfCutsEdge; // Each strip becomes a row
      const endPattern: string[] = [];
      
      for (let row = 0; row < numRows; row++) {
        if (row % 2 === 0) {
          // Even rows: keep original order
          endPattern.push(...basePattern);
        } else {
          // Odd rows: flip/reverse the pattern for brick-lay effect
          endPattern.push(...[...basePattern].reverse());
        }
      }
      
      return endPattern.slice(0, numRows * basePattern.length);
    };

    options.push({
      type: 'end-grain',
      id: 'end-grain-from-edge',
      dimensions: {
        length: endGrainFromEdgeLength,
        width: endGrainFromEdgeWidth,
        thickness: endGrainFromEdgeThickness
      },
      description: `Take edge grain board, cut into ${segmentWidthEdge}" segments, rotate 90°, and reglue. Narrow strip pattern. Most knife-friendly!`,
      cuts: numberOfCutsEdge,
      wasteFromKerf: totalKerfLossEdge,
      pattern: generateEndGrainFromEdgePattern(),
      // Default juice groove settings
      juiceGrooveEnabled: false,
      juiceGrooveWidth: 0.5,
      juiceGrooveDepth: 0.25,
      juiceGrooveDistance: 0.75,
      // Default handle holes settings
      handleHolesEnabled: false,
      handleHoleCount: 2,
      handleHoleDiameter: 1.25,
      handleHolePositionX: 50,
      handleHolePositionY: 50
    });

    // END GRAIN FROM FACE GRAIN: Take face grain board, cut into strips, rotate 90°, and reglue
    const segmentWidthFace = endGrainSegmentWidth; // use user-defined segment width
    const numberOfCutsFace = Math.floor(maxLength / segmentWidthFace);
    const totalKerfLossFace = numberOfCutsFace * KERF_WIDTH;
    
    // After cutting and rotating from face grain:
    // - Each strip is segmentWidth long, faceGrainWidth wide, avgThickness thick
    // - When rotated: avgThickness becomes the new LENGTH dimension per strip
    // - segmentWidth becomes the new THICKNESS
    // - Width stays the same
    const endGrainFromFaceWidth = faceGrainWidth; // maintains the face grain width (14")
    const endGrainFromFaceLength = numberOfCutsFace * avgThickness; // 12 strips × 0.75" = 9"
    const endGrainFromFaceThickness = segmentWidthFace - (totalKerfLossFace / numberOfCutsFace); // ~1.875" (2" - kerf)

    // Create end grain pattern from face grain base
    const generateEndGrainFromFacePattern = (): string[] => {
      const basePattern = [...faceGrainPattern];
      const numRows = numberOfCutsFace; // Each strip becomes a row
      const endPattern: string[] = [];
      
      for (let row = 0; row < numRows; row++) {
        if (row % 2 === 0) {
          // Even rows: keep original order
          endPattern.push(...basePattern);
        } else {
          // Odd rows: flip/reverse the pattern for brick-lay effect
          endPattern.push(...[...basePattern].reverse());
        }
      }
      
      return endPattern.slice(0, numRows * basePattern.length);
    };

    options.push({
      type: 'end-grain',
      id: 'end-grain-from-face',
      dimensions: {
        length: endGrainFromFaceLength,
        width: endGrainFromFaceWidth,
        thickness: endGrainFromFaceThickness
      },
      description: `Take face grain board, cut into ${segmentWidthFace}" segments, rotate 90°, and reglue. Wide strip pattern. Most knife-friendly!`,
      cuts: numberOfCutsFace,
      wasteFromKerf: totalKerfLossFace,
      pattern: generateEndGrainFromFacePattern(),
      // Default juice groove settings
      juiceGrooveEnabled: false,
      juiceGrooveWidth: 0.5,
      juiceGrooveDepth: 0.25,
      juiceGrooveDistance: 0.75,
      // Default handle holes settings
      handleHolesEnabled: false,
      handleHoleCount: 2,
      handleHoleDiameter: 1.25,
      handleHolePositionX: 50,
      handleHolePositionY: 50
    });

    setDesignOptions(options);
  };

  const regeneratePattern = (optionId: string) => {
    setDesignOptions(prevOptions => 
      prevOptions.map(option => {
        if (option.id !== optionId) return option;
        
        const availableWoods = woodPieces.filter(p => p.woodType.trim() !== '');
        if (availableWoods.length === 0) return option;
        
        const patternLength = option.pattern.length;
        let newPattern: string[] = [];
        
        if (option.type === 'end-grain') {
          // For end grain, create more complex flipping patterns
          const totalQuantity = woodPieces.reduce((sum, piece) => sum + piece.quantity, 0);
          // Calculate number of rows based on the existing option's dimensions and cuts
          const numRows = option.cuts || Math.floor(patternLength / totalQuantity);
          
          // Generate base pattern respecting quantities
          const basePattern: string[] = [];
          for (const wood of availableWoods) {
            for (let i = 0; i < wood.quantity; i++) {
              basePattern.push(wood.woodType);
            }
          }
          
          // Shuffle the base pattern for variation
          for (let i = basePattern.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [basePattern[i], basePattern[j]] = [basePattern[j], basePattern[i]];
          }
          
          // Choose random flip pattern
          const flipStyles = [
            // Style 1: Alternate rows flipped
            (row: number) => row % 2 === 0,
            // Style 2: Every third row flipped
            (row: number) => row % 3 === 0,
            // Style 3: Checkerboard flip (every other)
            (row: number) => row % 2 !== 0,
            // Style 4: Random flip
            (row: number) => Math.random() > 0.5
          ];
          
          const flipStyle = flipStyles[Math.floor(Math.random() * flipStyles.length)];
          
          for (let row = 0; row < numRows; row++) {
            if (flipStyle(row)) {
              newPattern.push(...basePattern); // Keep original
            } else {
              newPattern.push(...[...basePattern].reverse()); // Flip
            }
          }
          
          newPattern = newPattern.slice(0, numRows * basePattern.length);
        } else {
          // For face grain and edge grain, regenerate with quantities shuffled
          const basePattern: string[] = [];
          for (const wood of availableWoods) {
            for (let i = 0; i < wood.quantity; i++) {
              basePattern.push(wood.woodType);
            }
          }
          
          // Shuffle for variation
          for (let i = basePattern.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [basePattern[i], basePattern[j]] = [basePattern[j], basePattern[i]];
          }
          
          newPattern = basePattern;
        }
        
        return {
          ...option,
          pattern: newPattern
        };
      })
    );
  };

  // Save design to database
  const saveDesign = async () => {
    if (!projectName.trim()) {
      setSaveStatus({ type: 'error', message: 'Please enter a project name' });
      return;
    }

    if (designOptions.length === 0) {
      setSaveStatus({ type: 'error', message: 'Please generate designs before saving' });
      return;
    }

    setIsSaving(true);
    setSaveStatus({ type: null, message: '' });

    try {
      // Extract custom colors from wood pieces
      const customColors = woodPieces
        .filter(p => p.customColor)
        .reduce((acc, p) => {
          acc[p.woodType.toLowerCase()] = p.customColor!;
          return acc;
        }, {} as { [key: string]: string });

      const designData = {
        name: projectName,
        description: null,
        wood_pieces: woodPieces,
        design_options: designOptions,
        flip_alternating_rows: flipAlternatingRows,
        stagger_alternating_rows: staggerAlternatingRows,
        project_notes: projectNotes || null,
        custom_colors: Object.keys(customColors).length > 0 ? customColors : null,
        end_grain_segment_width: endGrainSegmentWidth
        // Note: juice_groove and handle_holes are now per-option in design_options
      };

      const endpoint = currentDesignId 
        ? `/api/cutting-board-designs/${currentDesignId}`
        : '/api/cutting-board-designs';
      
      const method = currentDesignId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(designData)
      });

      if (!response.ok) {
        throw new Error('Failed to save design');
      }

      const result = await response.json();
      
      if (!currentDesignId && result.id) {
        setCurrentDesignId(result.id);
      }

      setSaveStatus({ 
        type: 'success', 
        message: currentDesignId ? 'Design updated successfully!' : 'Design saved successfully!' 
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus({ type: null, message: '' });
      }, 3000);

    } catch (error) {
      console.error('Error saving design:', error);
      setSaveStatus({ type: 'error', message: 'Failed to save design. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch list of saved designs
  const fetchSavedDesigns = async () => {
    setIsLoadingDesigns(true);
    try {
      const response = await fetch('/api/cutting-board-designs');
      if (!response.ok) {
        throw new Error('Failed to fetch designs');
      }
      const designs = await response.json();
      setSavedDesigns(designs);
    } catch (error) {
      console.error('Error fetching saved designs:', error);
      setSaveStatus({ type: 'error', message: 'Failed to load saved designs' });
    } finally {
      setIsLoadingDesigns(false);
    }
  };

  // Load a specific design
  const loadDesign = async (designId: number) => {
    try {
      const response = await fetch(`/api/cutting-board-designs/${designId}`);
      if (!response.ok) {
        throw new Error('Failed to load design');
      }
      const design = await response.json();
      
      // Restore all state from the loaded design
      setProjectName(design.name);
      setProjectNotes(design.project_notes || '');
      setWoodPieces(design.wood_pieces);
      setDesignOptions(design.design_options);
      setFlipAlternatingRows(design.flip_alternating_rows);
      setStaggerAlternatingRows(design.stagger_alternating_rows);
      setCurrentDesignId(design.id);
      
      // Restore end grain segment width
      if (design.end_grain_segment_width) {
        setEndGrainSegmentWidth(design.end_grain_segment_width);
      }
      
      // Note: juice_groove and handle_holes are now restored per-option from design_options
      
      setLoadDialogOpen(false);
      setSaveStatus({ type: 'success', message: 'Design loaded successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus({ type: null, message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error loading design:', error);
      setSaveStatus({ type: 'error', message: 'Failed to load design' });
    }
  };

  // Open load dialog and fetch designs
  const openLoadDialog = () => {
    setLoadDialogOpen(true);
    setSelectedForComparison([]); // Reset comparison selection
    fetchSavedDesigns();
  };

  // Toggle design selection for comparison
  const toggleComparisonSelection = (designId: number) => {
    setSelectedForComparison(prev => {
      if (prev.includes(designId)) {
        return prev.filter(id => id !== designId);
      } else if (prev.length < 3) { // Limit to 3 designs
        return [...prev, designId];
      }
      return prev;
    });
  };

  // Open comparison view
  const openComparisonView = () => {
    if (selectedForComparison.length < 2) {
      setSaveStatus({ type: 'error', message: 'Please select at least 2 designs to compare' });
      return;
    }
    setLoadDialogOpen(false);
    setCompareDialogOpen(true);
  };

  // Export design as PNG
  const exportAsPNG = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found:', elementId);
      return;
    }

    try {
      // Add a small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Error exporting as PNG:', error);
      setSaveStatus({ type: 'error', message: 'Failed to export image' });
    }
  };

  const getWoodColor = (woodType: string, customColor?: string): string => {
    // If a custom color is provided, use it
    if (customColor) {
      return customColor;
    }

    // Check if this wood type has a custom color set in woodPieces
    const woodPiece = woodPieces.find(p => p.woodType.toLowerCase() === woodType.toLowerCase());
    if (woodPiece?.customColor) {
      return woodPiece.customColor;
    }

    // Otherwise use default colors
    const colors: { [key: string]: string } = {
      'walnut': '#5D4037',
      'maple': '#F5DEB3',
      'cherry': '#CD853F',
      'oak': '#D2B48C',
      'mahogany': '#8B4513',
      'purple heart': '#663399',
      'padauk': '#CC6633',
      'wenge': '#3E2723'
    };
    return colors[woodType.toLowerCase()] || '#8D6E63';
  };

  const renderBoardPreview = (option: DesignOption, zoomMultiplier: number = 1) => {
    const scale = 15 * zoomMultiplier; // pixels per inch for preview
    const previewWidth = Math.min(option.dimensions.width * scale, 400 * zoomMultiplier);
    const previewLength = Math.min(option.dimensions.length * scale, 500 * zoomMultiplier);

    if (option.type === 'face-grain') {
      // Face grain: Shows wide face - horizontal wood grain lines (running along length)
      const stripWidth = previewWidth / option.pattern.length;
      
      return (
        <Box sx={{ position: 'relative' }}>
          {/* Dimension labels */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, bgcolor: 'white', px: 1, borderRadius: 1 }}>
              {option.dimensions.width.toFixed(2)}"W
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Length label (left side) */}
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600, 
                bgcolor: 'white', 
                px: 0.5, 
                borderRadius: 1,
                mr: 0.5,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)'
              }}
            >
              {option.dimensions.length.toFixed(2)}"L
            </Typography>

            {/* Board preview - Face grain shows wide face with grain running lengthwise */}
            <Box
              sx={{
                width: previewWidth,
                height: previewLength,
                border: '2px solid #333',
                display: 'flex',
                flexDirection: 'row',
                overflow: 'hidden',
                borderRadius: '4px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}
            >
              {option.pattern.map((wood, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: stripWidth,
                    height: '100%',
                    backgroundColor: getWoodColor(wood),
                    borderRight: idx < option.pattern.length - 1 ? '1px solid rgba(0,0,0,0.2)' : 'none',
                    // Add prominent lengthwise grain pattern
                    backgroundImage: `
                      repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(0,0,0,0.05) 2px,
                        rgba(0,0,0,0.05) 3px
                      ),
                      linear-gradient(
                        0deg,
                        rgba(0,0,0,0.1) 0%,
                        transparent 10%,
                        transparent 90%,
                        rgba(0,0,0,0.1) 100%
                      )
                    `,
                    backgroundSize: '100% 100%'
                  }}
                />
              ))}
            </Box>

            {/* Thickness label (right side) */}
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600, 
                bgcolor: 'white', 
                px: 0.5, 
                borderRadius: 1,
                ml: 0.5,
                writingMode: 'vertical-rl'
              }}
            >
              {option.dimensions.thickness.toFixed(2)}"T
            </Typography>
          </Box>
        </Box>
      );
    } else if (option.type === 'edge-grain') {
      // Edge grain: Shows narrow edge - thin vertical strips
      const stripWidth = previewWidth / option.pattern.length;
      
      return (
        <Box sx={{ position: 'relative' }}>
          {/* Dimension labels */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, bgcolor: 'white', px: 1, borderRadius: 1 }}>
              {option.dimensions.width.toFixed(2)}"W
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Length label (left side) */}
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600, 
                bgcolor: 'white', 
                px: 0.5, 
                borderRadius: 1,
                mr: 0.5,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)'
              }}
            >
              {option.dimensions.length.toFixed(2)}"L
            </Typography>

            {/* Board preview - Edge grain shows narrow edges as vertical strips */}
            <Box
              sx={{
                width: previewWidth,
                height: previewLength,
                border: '2px solid #333',
                display: 'flex',
                flexDirection: 'row',
                overflow: 'hidden',
                borderRadius: '4px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
              }}
            >
              {option.pattern.map((wood, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: stripWidth,
                    height: '100%',
                    backgroundColor: getWoodColor(wood),
                    borderRight: idx < option.pattern.length - 1 ? '2px solid rgba(0,0,0,0.3)' : 'none',
                    // Add subtle vertical grain lines for edge grain
                    backgroundImage: `
                      repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 1px,
                        rgba(0,0,0,0.08) 1px,
                        rgba(0,0,0,0.08) 2px
                      ),
                      linear-gradient(
                        90deg,
                        rgba(0,0,0,0.15) 0%,
                        transparent 20%,
                        transparent 80%,
                        rgba(0,0,0,0.15) 100%
                      )
                    `,
                    backgroundSize: '6px 100%, 100% 100%'
                  }}
                />
              ))}
            </Box>

            {/* Thickness label (right side) */}
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600, 
                bgcolor: 'white', 
                px: 0.5, 
                borderRadius: 1,
                ml: 0.5,
                writingMode: 'vertical-rl'
              }}
            >
              {option.dimensions.thickness.toFixed(2)}"T
            </Typography>
          </Box>
        </Box>
      );
    } else {
      // End grain: Brick-lay pattern - alternating rows are offset by half the board thickness
      const totalQuantity = woodPieces.reduce((sum, piece) => sum + piece.quantity, 0);
      const avgThickness = woodPieces.reduce((sum, piece) => sum + piece.thickness, 0) / woodPieces.length; // Average thickness (0.75")
      const avgWidth = woodPieces.reduce((sum, piece) => sum + piece.width, 0) / woodPieces.length; // Average width (2")
      
      // Determine row height based on which end grain type
      // From Edge Grain: each row is 2" (avgWidth becomes length after rotation)
      // From Face Grain: each row is 0.75" (avgThickness becomes length after rotation)
      const isFromEdgeGrain = option.id === 'end-grain-from-edge';
      const rowThickness = isFromEdgeGrain ? avgWidth : avgThickness; // 2" or 0.75"
      const numRows = Math.round(option.dimensions.length / rowThickness); // Actual number of rows
      const rowHeight = (option.dimensions.length / numRows) * scale;
      const pieceWidth = (option.dimensions.width / totalQuantity) * scale; // Width of each piece in pixels
      
      // Stagger offset should be half of the wood piece width (perpendicular dimension)
      // From Edge Grain: pieces are avgThickness wide (0.75"), so offset = 0.375"
      // From Face Grain: pieces are avgWidth wide (2"), so offset = 1"
      const woodPieceWidth = isFromEdgeGrain ? avgThickness : avgWidth;
      const offsetAmount = (woodPieceWidth / 2) * scale; // Half of wood piece width for stagger offset
      
      return (
        <Box sx={{ position: 'relative' }}>
          {/* Dimension labels */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, bgcolor: 'white', px: 1, borderRadius: 1 }}>
              {option.dimensions.width.toFixed(2)}"W
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', px: 8 }}>
            {/* Length label (left side) - positioned to avoid row numbers */}
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600, 
                bgcolor: 'white', 
                px: 0.5, 
                borderRadius: 1,
                mr: 1,
                position: 'absolute',
                left: -5,
                top: '50%',
                transform: 'translateY(-50%) rotate(-90deg)',
                zIndex: 5
              }}
            >
              {option.dimensions.length.toFixed(2)}"L
            </Typography>

            {/* Board preview - End grain shows brick-lay pattern */}
            <Box
              sx={{
                width: previewWidth,
                height: previewLength,
                border: '2px solid #333',
                overflow: 'visible',
                borderRadius: '4px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                position: 'relative'
              }}
            >
              {/* Inner clipping container for wood pieces */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  borderRadius: '4px'
                }}
              >
                {/* Render each row */}
                {Array.from({ length: numRows }).map((_, rowIdx) => {
                  const isAlternateRow = rowIdx % 2 === 1;
                  const shouldFlip = flipAlternatingRows && isAlternateRow;
                  const shouldStagger = staggerAlternatingRows && isAlternateRow;
                  
                  // Get pattern - flip if needed
                  let rowPattern = option.pattern.slice(0, totalQuantity);
                  if (shouldFlip) {
                    rowPattern = [...rowPattern].reverse();
                  }
                  
                  return (
                    <Box
                      key={`row-${rowIdx}`}
                      sx={{
                        position: 'absolute',
                        top: rowIdx * rowHeight,
                        left: shouldStagger ? offsetAmount : 0, // Shift right by half thickness if staggered
                        width: previewWidth,
                        height: rowHeight,
                        display: 'flex',
                        flexDirection: 'row'
                      }}
                    >
                      {/* All rows show full pieces - no half pieces */}
                      {rowPattern.map((wood, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            width: pieceWidth,
                            height: '100%',
                            backgroundColor: getWoodColor(wood),
                            borderRight: idx < rowPattern.length - 1 ? '2px solid rgba(0,0,0,0.3)' : 'none',
                            backgroundImage: `
                              radial-gradient(circle at center, rgba(0,0,0,0.1) 0.5px, transparent 0.5px)
                            `,
                            backgroundSize: '3px 3px'
                          }}
                        />
                      ))}
                    </Box>
                  );
                })}
              </Box>

              {/* Row labels and cut lines - rendered outside clipping container */}
              {Array.from({ length: numRows }).map((_, rowIdx) => (
                <Box key={`labels-${rowIdx}`}>
                  {/* Row number label on the left */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: -30,
                      top: rowIdx * rowHeight + rowHeight / 2,
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      px: 0.5,
                      py: 0.25,
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#333',
                      zIndex: 10,
                      minWidth: '20px',
                      textAlign: 'center'
                    }}
                  >
                    {rowIdx + 1}
                  </Box>

                  {/* Row size label on the right */}
                  <Box
                    sx={{
                      position: 'absolute',
                      right: -55,
                      top: rowIdx * rowHeight + rowHeight / 2,
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #666',
                      borderRadius: '4px',
                      px: 0.5,
                      py: 0.25,
                      fontSize: '9px',
                      fontWeight: 600,
                      color: '#666',
                      zIndex: 10,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {rowThickness.toFixed(2)}"
                  </Box>
                </Box>
              ))}
              
              {/* Cut lines - show at actual cut positions (not affected by stagger) */}
              {Array.from({ length: numRows - 1 }).map((_, cutIdx) => (
                <Box
                  key={`cut-line-${cutIdx}`}
                  sx={{
                    position: 'absolute',
                    top: (cutIdx + 1) * rowHeight,
                    left: 0,
                    right: 0,
                    height: '2px',
                    bgcolor: 'rgba(255, 0, 0, 0.7)',
                    zIndex: 5,
                    boxShadow: '0 0 3px rgba(255, 0, 0, 0.8)'
                  }}
                />
              ))}
            </Box>

            {/* Juice Groove Overlay */}
            {option.juiceGrooveEnabled && (
              <Box
                sx={{
                  position: 'absolute',
                  top: option.juiceGrooveDistance * scale,
                  left: option.juiceGrooveDistance * scale,
                  right: option.juiceGrooveDistance * scale,
                  bottom: option.juiceGrooveDistance * scale,
                  border: `${option.juiceGrooveWidth * scale}px solid rgba(101, 67, 33, 0.6)`,
                  borderRadius: 1,
                  pointerEvents: 'none',
                  boxShadow: `inset 0 0 ${option.juiceGrooveDepth * scale * 2}px rgba(0,0,0,0.4)`
                }}
              />
            )}

            {/* Handle Holes Overlay */}
            {option.handleHolesEnabled && (
              <>
                {Array.from({ length: option.handleHoleCount }).map((_, idx) => {
                  const spacing = previewWidth / (option.handleHoleCount + 1);
                  const xPos = spacing * (idx + 1);
                  const yPos = (option.handleHolePositionY / 100) * previewLength;
                  const radius = (option.handleHoleDiameter / 2) * scale;
                  
                  return (
                    <Box
                      key={idx}
                      sx={{
                        position: 'absolute',
                        left: xPos - radius,
                        top: yPos - radius,
                        width: radius * 2,
                        height: radius * 2,
                        borderRadius: '50%',
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        border: '2px solid rgba(0, 0, 0, 0.9)',
                        pointerEvents: 'none',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                      }}
                    />
                  );
                })}
              </>
            )}

            {/* Thickness label (right side) - positioned to avoid row size labels */}
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600, 
                bgcolor: 'white', 
                px: 0.5, 
                borderRadius: 1,
                position: 'absolute',
                right: -65,
                top: '50%',
                transform: 'translateY(-50%) rotate(90deg)',
                zIndex: 5
              }}
            >
              {option.dimensions.thickness.toFixed(3)}"T
            </Typography>
          </Box>
        </Box>
      );
    }
  };

  const render3DView = (option: DesignOption, zoomMultiplier: number = 1) => {
    const scale = 12 * zoomMultiplier; // pixels per inch for 3D view
    const baseWidth = Math.min(option.dimensions.width * scale, 350 * zoomMultiplier);
    const baseLength = Math.min(option.dimensions.length * scale, 450 * zoomMultiplier);
    const thickness = option.dimensions.thickness * scale * 2; // Exaggerate thickness for visibility

    if (option.type === 'face-grain') {
      // Face grain 3D view - shows wide face with lengthwise grain
      const stripWidth = baseWidth / option.pattern.length;
      
      return (
        <Box
          sx={{
            perspective: '1000px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: baseWidth,
              height: baseLength,
              transformStyle: 'preserve-3d',
              transform: 'rotateX(60deg) rotateZ(-30deg)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'rotateX(65deg) rotateZ(-35deg)'
              }
            }}
          >
            {/* Top face (face grain pattern with horizontal grain lines) */}
            <Box
              sx={{
                position: 'absolute',
                width: baseWidth,
                height: baseLength,
                display: 'flex',
                flexDirection: 'row',
                transform: `translateZ(${thickness}px)`,
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                border: '2px solid rgba(0,0,0,0.3)'
              }}
            >
              {option.pattern.map((wood, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: stripWidth,
                    height: '100%',
                    backgroundColor: getWoodColor(wood),
                    backgroundImage: `
                      repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 3px,
                        rgba(0,0,0,0.1) 3px,
                        rgba(0,0,0,0.1) 4px
                      ),
                      linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)
                    `,
                    borderRight: idx < option.pattern.length - 1 ? '1px solid rgba(0,0,0,0.3)' : 'none'
                  }}
                />
              ))}
            </Box>

            {/* Front face (thickness) */}
            <Box
              sx={{
                position: 'absolute',
                width: baseWidth,
                height: thickness,
                bottom: 0,
                background: 'linear-gradient(90deg, ' + 
                  option.pattern.map((wood, idx) => {
                    const pos1 = (idx / option.pattern.length) * 100;
                    const pos2 = ((idx + 1) / option.pattern.length) * 100;
                    const color = getWoodColor(wood);
                    return `${color} ${pos1}%, ${color} ${pos2}%`;
                  }).join(', ') + ')',
                transform: `rotateX(-90deg)`,
                transformOrigin: 'bottom',
                filter: 'brightness(0.6)',
                borderRadius: '0 0 4px 4px',
                border: '1px solid rgba(0,0,0,0.5)'
              }}
            />

            {/* Left face (side) - ADDED FOR SOLID LOOK */}
            <Box
              sx={{
                position: 'absolute',
                width: thickness,
                height: baseLength,
                left: 0,
                background: getWoodColor(option.pattern[0]),
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)',
                transform: `rotateY(-90deg)`,
                transformOrigin: 'left',
                filter: 'brightness(0.5)',
                borderRadius: '4px 0 0 4px',
                border: '1px solid rgba(0,0,0,0.5)'
              }}
            />

            {/* Right face (side) */}
            <Box
              sx={{
                position: 'absolute',
                width: thickness,
                height: baseLength,
                right: 0,
                background: getWoodColor(option.pattern[option.pattern.length - 1]),
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)',
                transform: `rotateY(90deg)`,
                transformOrigin: 'right',
                filter: 'brightness(0.4)',
                borderRadius: '0 4px 4px 0',
                border: '1px solid rgba(0,0,0,0.5)'
              }}
            />
          </Box>
        </Box>
      );
    } else if (option.type === 'edge-grain') {
      // Edge grain 3D view - shows narrow edge strips
      const stripWidth = baseWidth / option.pattern.length;
      
      return (
        <Box
          sx={{
            perspective: '1000px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: baseWidth,
              height: baseLength,
              transformStyle: 'preserve-3d',
              transform: 'rotateX(60deg) rotateZ(-30deg)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'rotateX(65deg) rotateZ(-35deg)'
              }
            }}
          >
            {/* Top face (edge grain pattern) */}
            <Box
              sx={{
                position: 'absolute',
                width: baseWidth,
                height: baseLength,
                display: 'flex',
                flexDirection: 'row',
                transform: `translateZ(${thickness}px)`,
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                border: '2px solid rgba(0,0,0,0.3)'
              }}
            >
              {option.pattern.map((wood, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: stripWidth,
                    height: '100%',
                    backgroundColor: getWoodColor(wood),
                    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
                    borderRight: idx < option.pattern.length - 1 ? '1px solid rgba(0,0,0,0.3)' : 'none'
                  }}
                />
              ))}
            </Box>

            {/* Front face (thickness) */}
            <Box
              sx={{
                position: 'absolute',
                width: baseWidth,
                height: thickness,
                bottom: 0,
                background: 'linear-gradient(90deg, ' + 
                  option.pattern.map((wood, idx) => {
                    const pos1 = (idx / option.pattern.length) * 100;
                    const pos2 = ((idx + 1) / option.pattern.length) * 100;
                    const color = getWoodColor(wood);
                    return `${color} ${pos1}%, ${color} ${pos2}%`;
                  }).join(', ') + ')',
                transform: `rotateX(-90deg)`,
                transformOrigin: 'bottom',
                filter: 'brightness(0.6)',
                borderRadius: '0 0 4px 4px',
                border: '1px solid rgba(0,0,0,0.5)'
              }}
            />

            {/* Left face (side) - ADDED FOR SOLID LOOK */}
            <Box
              sx={{
                position: 'absolute',
                width: thickness,
                height: baseLength,
                left: 0,
                background: getWoodColor(option.pattern[0]),
                transform: `rotateY(-90deg)`,
                transformOrigin: 'left',
                filter: 'brightness(0.5)',
                borderRadius: '4px 0 0 4px',
                border: '1px solid rgba(0,0,0,0.5)'
              }}
            />

            {/* Right face (side) */}
            <Box
              sx={{
                position: 'absolute',
                width: thickness,
                height: baseLength,
                right: 0,
                background: getWoodColor(option.pattern[option.pattern.length - 1]),
                transform: `rotateY(90deg)`,
                transformOrigin: 'right',
                filter: 'brightness(0.4)',
                borderRadius: '0 4px 4px 0',
                border: '1px solid rgba(0,0,0,0.5)'
              }}
            />
          </Box>
        </Box>
      );
    } else {
      // End grain 3D view - Brick-lay pattern
      const totalQuantity = woodPieces.reduce((sum, piece) => sum + piece.quantity, 0);
      const avgThickness = woodPieces.reduce((sum, piece) => sum + piece.thickness, 0) / woodPieces.length; // Average thickness (0.75")
      const avgWidth = woodPieces.reduce((sum, piece) => sum + piece.width, 0) / woodPieces.length; // Average width (2")
      
      // Determine row height based on which end grain type (same as 2D view)
      // From Edge Grain: each row is 2" (avgWidth becomes length after rotation)
      // From Face Grain: each row is 0.75" (avgThickness becomes length after rotation)
      const isFromEdgeGrain = option.id === 'end-grain-from-edge';
      const rowThickness = isFromEdgeGrain ? avgWidth : avgThickness; // 2" or 0.75"
      const numRows = Math.round(option.dimensions.length / rowThickness); // Actual number of rows
      const rowHeight = baseLength / numRows;
      const pieceWidth = baseWidth / totalQuantity;
      
      // Stagger offset should be half of the wood piece width (perpendicular dimension)
      // From Edge Grain: pieces are avgThickness wide (0.75"), so offset = 0.375"
      // From Face Grain: pieces are avgWidth wide (2"), so offset = 1"
      const woodPieceWidth = isFromEdgeGrain ? avgThickness : avgWidth;
      const offsetAmount = (woodPieceWidth / 2) * scale; // Half of wood piece width for stagger offset
      
      return (
        <Box
          sx={{
            perspective: '1000px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: baseWidth,
              height: baseLength,
              transformStyle: 'preserve-3d',
              transform: 'rotateX(60deg) rotateZ(-30deg)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'rotateX(65deg) rotateZ(-35deg)'
              }
            }}
          >
            {/* Top face (end grain brick-lay pattern) */}
            <Box
              sx={{
                position: 'absolute',
                width: baseWidth,
                height: baseLength,
                transform: `translateZ(${thickness}px)`,
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                border: '2px solid rgba(0,0,0,0.3)'
              }}
            >
              {/* Render each row with brick-lay pattern */}
              {Array.from({ length: numRows }).map((_, rowIdx) => {
                const isAlternateRow = rowIdx % 2 === 1;
                const shouldFlip = flipAlternatingRows && isAlternateRow;
                const shouldStagger = staggerAlternatingRows && isAlternateRow;
                
                // Get pattern - flip if needed
                let rowPattern = option.pattern.slice(0, totalQuantity);
                if (shouldFlip) {
                  rowPattern = [...rowPattern].reverse();
                }
                
                return (
                  <Box
                    key={`3d-row-${rowIdx}`}
                    sx={{
                      position: 'absolute',
                      top: rowIdx * rowHeight,
                      left: shouldStagger ? offsetAmount : 0, // Shift right by half thickness if staggered
                      width: baseWidth,
                      height: rowHeight,
                      display: 'flex',
                      flexDirection: 'row',
                      overflow: 'visible'
                    }}
                  >
                    {/* All rows show full pieces - no half pieces */}
                    {rowPattern.map((wood, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          width: pieceWidth,
                          height: '100%',
                          backgroundColor: getWoodColor(wood),
                          borderRight: idx < rowPattern.length - 1 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                          backgroundImage: `radial-gradient(circle at center, rgba(0,0,0,0.1) 0.5px, transparent 0.5px)`,
                          backgroundSize: '3px 3px'
                        }}
                      />
                    ))}
                  </Box>
                );
              })}
              
              {/* Cut lines - show at actual cut positions (not affected by stagger) */}
              {Array.from({ length: numRows - 1 }).map((_, cutIdx) => (
                <Box
                  key={`3d-cut-line-${cutIdx}`}
                  sx={{
                    position: 'absolute',
                    top: (cutIdx + 1) * rowHeight,
                    left: 0,
                    width: baseWidth,
                    height: '2px',
                    bgcolor: 'rgba(255, 0, 0, 0.8)',
                    zIndex: 10,
                    boxShadow: '0 0 4px rgba(255, 0, 0, 0.9)',
                    pointerEvents: 'none'
                  }}
                />
              ))}
            </Box>

            {/* Front face (thickness) */}
            <Box
              sx={{
                position: 'absolute',
                width: baseWidth,
                height: thickness,
                bottom: 0,
                background: 'linear-gradient(90deg, ' + 
                  option.pattern.slice(0, totalQuantity).map((wood, idx) => {
                    const pos1 = (idx / totalQuantity) * 100;
                    const pos2 = ((idx + 1) / totalQuantity) * 100;
                    const color = getWoodColor(wood);
                    return `${color} ${pos1}%, ${color} ${pos2}%`;
                  }).join(', ') + ')',
                transform: `rotateX(-90deg)`,
                transformOrigin: 'bottom',
                filter: 'brightness(0.6)',
                borderRadius: '0 0 4px 4px',
                border: '1px solid rgba(0,0,0,0.5)'
              }}
            />

            {/* Left face (side) - Shows brick-lay pattern */}
            <Box
              sx={{
                position: 'absolute',
                width: thickness,
                height: baseLength,
                left: 0,
                background: 'linear-gradient(180deg, ' + 
                  Array.from({ length: numRows }).map((_, idx) => {
                    const pos1 = (idx / numRows) * 100;
                    const pos2 = ((idx + 1) / numRows) * 100;
                    const color = getWoodColor(option.pattern[idx % 2 === 0 ? 0 : option.pattern.length - 1]);
                    return `${color} ${pos1}%, ${color} ${pos2}%`;
                  }).join(', ') + ')',
                transform: `rotateY(-90deg)`,
                transformOrigin: 'left',
                filter: 'brightness(0.5)',
                borderRadius: '4px 0 0 4px',
                border: '1px solid rgba(0,0,0,0.5)'
              }}
            />

            {/* Right face (side) - Shows brick-lay pattern */}
            <Box
              sx={{
                position: 'absolute',
                width: thickness,
                height: baseLength,
                right: 0,
                background: 'linear-gradient(180deg, ' + 
                  Array.from({ length: numRows }).map((_, idx) => {
                    const pos1 = (idx / numRows) * 100;
                    const pos2 = ((idx + 1) / numRows) * 100;
                    const color = getWoodColor(option.pattern[idx % 2 === 0 ? totalQuantity - 1 : 0]);
                    return `${color} ${pos1}%, ${color} ${pos2}%`;
                  }).join(', ') + ')',
                transform: `rotateY(90deg)`,
                transformOrigin: 'right',
                filter: 'brightness(0.4)',
                borderRadius: '0 4px 4px 0',
                border: '1px solid rgba(0,0,0,0.5)'
              }}
            />
          </Box>
        </Box>
      );
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      <Paper elevation={3} sx={{ p: 4, mb: 3, background: 'linear-gradient(135deg, #6B4423 0%, #8D6E63 100%)' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          🪵 Cutting Board Designer
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
          Enter your available wood pieces and get professional design options for edge grain and end grain cutting boards
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Panel - Input */}
        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ p: 3 }}>
            {/* Calculator Buttons */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CalculateIcon />}
                onClick={() => setFractionCalcOpen(true)}
                sx={{ flex: 1 }}
              >
                Fraction Calculator
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<StraightenIcon />}
                onClick={() => setBoardCalcOpen(true)}
                sx={{ flex: 1 }}
              >
                Board Calculator
              </Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Project Metadata */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Project Details</Typography>
              <TextField
                fullWidth
                label="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Walnut & Maple Board"
                size="small"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Notes"
                value={projectNotes}
                onChange={(e) => setProjectNotes(e.target.value)}
                placeholder="Add notes about this design..."
                multiline
                rows={2}
                size="small"
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Available Wood</Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
                onClick={addWoodPiece}
              >
                Add Wood
              </Button>
            </Box>

            <Alert severity="info" icon={false} sx={{ mb: 2, fontSize: '0.875rem' }}>
              💡 <strong>Tip:</strong> Mix different wood widths for more interesting patterns!
            </Alert>

            <Stack spacing={2}>
              {woodPieces.map((piece) => (
                <Card key={piece.id} variant="outlined" sx={{ position: 'relative' }}>
                  <CardContent>
                    <IconButton
                      size="small"
                      onClick={() => removeWoodPiece(piece.id)}
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Wood Type"
                          value={piece.woodType}
                          onChange={(e) => updateWoodPiece(piece.id, 'woodType', e.target.value)}
                          placeholder="e.g., Walnut, Maple, Cherry"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Quantity"
                          type="number"
                          value={piece.quantity}
                          onChange={(e) => updateWoodPiece(piece.id, 'quantity', parseInt(e.target.value) || 1)}
                          size="small"
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label='Thickness (")'
                          type="number"
                          value={piece.thickness}
                          onChange={(e) => updateWoodPiece(piece.id, 'thickness', parseFloat(e.target.value) || 0.75)}
                          size="small"
                          inputProps={{ step: 0.125, min: 0.25 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label='Width (")'
                          type="number"
                          value={piece.width}
                          onChange={(e) => updateWoodPiece(piece.id, 'width', parseFloat(e.target.value) || 2)}
                          size="small"
                          inputProps={{ step: 0.125, min: 0.25 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label='Length (")'
                          type="number"
                          value={piece.length}
                          onChange={(e) => updateWoodPiece(piece.id, 'length', parseFloat(e.target.value) || 24)}
                          size="small"
                          inputProps={{ step: 0.5, min: 1 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <TextField
                            label="Custom Color (optional)"
                            type="color"
                            value={piece.customColor || getWoodColor(piece.woodType)}
                            onChange={(e) => updateWoodPiece(piece.id, 'customColor', e.target.value)}
                            size="small"
                            sx={{ width: 120 }}
                            InputLabelProps={{ shrink: true }}
                          />
                          {piece.customColor && (
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => updateWoodPiece(piece.id, 'customColor', undefined)}
                              sx={{ textTransform: 'none' }}
                            >
                              Reset to Default
                            </Button>
                          )}
                          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                            Override the default color for this wood type
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`${piece.quantity} × ${piece.thickness}" × ${piece.width}" × ${piece.length}"`}
                        size="small"
                        sx={{ backgroundColor: getWoodColor(piece.woodType), color: 'white' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>

            {/* End Grain Segment Width Control */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(107, 68, 35, 0.1)', borderRadius: 2, border: '1px solid rgba(107, 68, 35, 0.3)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#6B4423' }}>
                🪚 End Grain Cut Width
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Width of strips when cutting for end grain boards (affects final dimensions) (add .125" for saw blade kerf)
              </Typography>
              <TextField
                fullWidth
                label='Segment Width (")'
                type="number"
                value={endGrainSegmentWidth}
                onChange={(e) => setEndGrainSegmentWidth(parseFloat(e.target.value) || 2)}
                size="small"
                inputProps={{ step: 0.25, min: 0.5, max: 4 }}
                helperText={`Smaller = longer board, larger = thicker board`}
              />
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'white', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Examples:
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  • 1" cuts = More rows, longer & thinner board
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  • 2" cuts = Medium rows, balanced dimensions
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  • 3" cuts = Fewer rows, shorter & thicker board
                </Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<AutoFixHighIcon />}
              onClick={generateDesigns}
              sx={{ mt: 3 }}
              disabled={
                woodPieces.length === 0 || 
                woodPieces.some(p => !p.woodType || p.woodType.trim() === '')
              }
            >
              Generate Design Options
            </Button>

            {/* Save and Load Buttons */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={saveDesign}
                  disabled={designOptions.length === 0 || !projectName.trim() || isSaving}
                >
                  {isSaving ? 'Saving...' : (currentDesignId ? 'Update' : 'Save Design')}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FolderOpenIcon />}
                  onClick={openLoadDialog}
                >
                  Load Design
                </Button>
              </Grid>
            </Grid>

            {/* Save Status Feedback */}
            {saveStatus.type && (
              <Alert severity={saveStatus.type} sx={{ mt: 2 }}>
                {saveStatus.message}
              </Alert>
            )}

            {woodPieces.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Add wood pieces to get started
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Right Panel - Design Options */}
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Design Options
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {designOptions.length === 0 ? (
              <Alert severity="info">
                Click "Generate Design Options" to see your cutting board designs
              </Alert>
            ) : (
              <Stack spacing={3}>
                {designOptions.map((option, idx) => (
                  <Card key={idx} elevation={3}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ textTransform: 'uppercase', color: '#6B4423' }}>
                          {option.type === 'face-grain' ? '📏 Face Grain' : option.type === 'edge-grain' ? '🪚 Edge Grain' : '🎯 End Grain'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AutoFixHighIcon />}
                            onClick={() => regeneratePattern(option.id)}
                            sx={{ 
                              borderColor: '#6B4423',
                              color: '#6B4423',
                              '&:hover': {
                                borderColor: '#8D6E63',
                                backgroundColor: 'rgba(107, 68, 35, 0.1)'
                              }
                            }}
                          >
                            Regenerate Pattern
                          </Button>
                          <Chip
                            label={getOptionTitle(option)}
                            color={option.type === 'face-grain' ? 'info' : option.type === 'edge-grain' ? 'primary' : 'secondary'}
                          />
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {option.description}
                      </Typography>

                      <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Final Dimensions:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {option.dimensions.length.toFixed(2)}" L × {option.dimensions.width.toFixed(2)}" W × {option.dimensions.thickness.toFixed(3)}" T
                        </Typography>
                        
                        {option.type === 'end-grain' && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Cuts required: {option.cuts} | Kerf loss: {option.wasteFromKerf.toFixed(3)}"
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* End Grain Options - Only show for end grain */}
                      {option.type === 'end-grain' && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(139, 110, 99, 0.1)', borderRadius: 2, border: '1px solid rgba(139, 110, 99, 0.3)' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>
                            🎨 Pattern Options
                          </Typography>
                          
                          {/* Flip Alternating Rows Toggle */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Flip Alternating Rows
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Reverses pattern: W-M-C → C-M-W
                              </Typography>
                            </Box>
                            <Button
                              variant={flipAlternatingRows ? "contained" : "outlined"}
                              size="small"
                              onClick={() => setFlipAlternatingRows(!flipAlternatingRows)}
                              sx={{ minWidth: 80 }}
                            >
                              {flipAlternatingRows ? "ON" : "OFF"}
                            </Button>
                          </Box>

                          {/* Stagger Alternating Rows Toggle */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Stagger Alternating Rows
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Shifts row by half width (
                                {woodPieces.length > 0 
                                  ? (option.id === 'end-grain-from-edge' 
                                      ? (woodPieces[0].thickness / 2).toFixed(3) // Edge grain: shift by half of 0.75" = 0.375"
                                      : (woodPieces[0].width / 2).toFixed(3))    // Face grain: shift by half of 2" = 1"
                                  : '0.375'}″)
                              </Typography>
                            </Box>
                            <Button
                              variant={staggerAlternatingRows ? "contained" : "outlined"}
                              size="small"
                              onClick={() => setStaggerAlternatingRows(!staggerAlternatingRows)}
                              sx={{ minWidth: 80 }}
                            >
                              {staggerAlternatingRows ? "ON" : "OFF"}
                            </Button>
                          </Box>

                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2, fontStyle: 'italic', textAlign: 'center' }}>
                            💡 Combine both for a flipped brick-lay pattern
                          </Typography>
                        </Box>
                      )}

                      {/* Juice Groove Settings - Per Design Option */}
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(33, 150, 243, 0.08)', borderRadius: 2, border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            🌊 Juice Groove
                          </Typography>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={option.juiceGrooveEnabled}
                                onChange={(e) => updateOptionJuiceGroove(option.id, { juiceGrooveEnabled: e.target.checked })}
                                color="primary"
                                size="small"
                              />
                            }
                            label={option.juiceGrooveEnabled ? "On" : "Off"}
                          />
                        </Box>
                        
                        {option.juiceGrooveEnabled && (
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <TextField
                                fullWidth
                                label='Width (")'
                                type="number"
                                value={option.juiceGrooveWidth}
                                onChange={(e) => updateOptionJuiceGroove(option.id, { juiceGrooveWidth: parseFloat(e.target.value) || 0.5 })}
                                size="small"
                                inputProps={{ step: 0.125, min: 0.25, max: 1 }}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <TextField
                                fullWidth
                                label='Depth (")'
                                type="number"
                                value={option.juiceGrooveDepth}
                                onChange={(e) => updateOptionJuiceGroove(option.id, { juiceGrooveDepth: parseFloat(e.target.value) || 0.25 })}
                                size="small"
                                inputProps={{ step: 0.0625, min: 0.125, max: 0.5 }}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <TextField
                                fullWidth
                                label='From Edge (")'
                                type="number"
                                value={option.juiceGrooveDistance}
                                onChange={(e) => updateOptionJuiceGroove(option.id, { juiceGrooveDistance: parseFloat(e.target.value) || 0.75 })}
                                size="small"
                                inputProps={{ step: 0.125, min: 0.5, max: 2 }}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Box>

                      {/* Handle Holes Settings - Per Design Option */}
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(156, 39, 176, 0.08)', borderRadius: 2, border: '1px solid rgba(156, 39, 176, 0.3)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            🔘 Handle Holes
                          </Typography>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={option.handleHolesEnabled}
                                onChange={(e) => updateOptionHandleHoles(option.id, { handleHolesEnabled: e.target.checked })}
                                color="secondary"
                                size="small"
                              />
                            }
                            label={option.handleHolesEnabled ? "On" : "Off"}
                          />
                        </Box>
                        
                        {option.handleHolesEnabled && (
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <TextField
                                fullWidth
                                label="Count"
                                type="number"
                                value={option.handleHoleCount}
                                onChange={(e) => updateOptionHandleHoles(option.id, { handleHoleCount: parseInt(e.target.value) || 2 })}
                                size="small"
                                inputProps={{ min: 1, max: 4 }}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <TextField
                                fullWidth
                                label='Diameter (")'
                                type="number"
                                value={option.handleHoleDiameter}
                                onChange={(e) => updateOptionHandleHoles(option.id, { handleHoleDiameter: parseFloat(e.target.value) || 1.25 })}
                                size="small"
                                inputProps={{ step: 0.125, min: 0.5, max: 3 }}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <TextField
                                fullWidth
                                label="Position Y (%)"
                                type="number"
                                value={option.handleHolePositionY}
                                onChange={(e) => updateOptionHandleHoles(option.id, { handleHolePositionY: parseFloat(e.target.value) || 50 })}
                                size="small"
                                inputProps={{ min: 10, max: 90 }}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Box>

                      <Box sx={{ position: 'relative' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Top View
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DownloadIcon />}
                              onClick={() => {
                                const fileName = `${projectName || 'cutting-board'}-${option.type}-top-view`;
                                exportAsPNG(`preview-2d-${option.id}`, fileName);
                              }}
                              sx={{ minWidth: 'auto', px: 1 }}
                            >
                              PNG
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => setZoomedView({ option, viewType: '2d' })}
                              sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' },
                                width: 28,
                                height: 28
                              }}
                            >
                              <ZoomInIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Box 
                          id={`preview-2d-${option.id}`}
                          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 1, cursor: 'pointer' }}
                          onClick={() => setZoomedView({ option, viewType: '2d' })}
                        >
                          {renderBoardPreview(option)}
                        </Box>
                      </Box>

                      <Box sx={{ position: 'relative' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            3D Perspective View
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DownloadIcon />}
                              onClick={() => {
                                const fileName = `${projectName || 'cutting-board'}-${option.type}-3d-view`;
                                exportAsPNG(`preview-3d-${option.id}`, fileName);
                              }}
                              sx={{ minWidth: 'auto', px: 1 }}
                            >
                              PNG
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => setZoomedView({ option, viewType: '3d' })}
                              sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' },
                                width: 28,
                                height: 28
                              }}
                            >
                              <ZoomInIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Box 
                          id={`preview-3d-${option.id}`}
                          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#e3f2fd', borderRadius: 1, cursor: 'pointer' }}
                          onClick={() => setZoomedView({ option, viewType: '3d' })}
                        >
                          {render3DView(option)}
                        </Box>
                      </Box>

                      {option.type === 'end-grain' && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          <strong>Pro Tip:</strong> End grain boards are gentler on knife edges and self-heal minor cut marks!
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Zoom Dialog */}
      <Dialog
        open={zoomedView !== null}
        onClose={() => setZoomedView(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {zoomedView?.viewType === '2d' ? 'Top View (Zoomed)' : '3D Perspective View (Zoomed)'}
            </Typography>
            <IconButton onClick={() => setZoomedView(null)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, bgcolor: zoomedView?.viewType === '2d' ? '#f5f5f5' : '#e3f2fd', borderRadius: 1, minHeight: 400 }}>
            {zoomedView && zoomedView.viewType === '2d' && renderBoardPreview(zoomedView.option, 2.5)}
            {zoomedView && zoomedView.viewType === '3d' && render3DView(zoomedView.option, 2.0)}
          </Box>
          {zoomedView && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(139, 110, 99, 0.1)', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {getOptionTitle(zoomedView.option)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {zoomedView.option.description}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Dimensions:</strong> {zoomedView.option.dimensions.length.toFixed(2)}"L × {zoomedView.option.dimensions.width.toFixed(2)}"W × {zoomedView.option.dimensions.thickness.toFixed(2)}"T
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setZoomedView(null)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Load Designs Dialog */}
      <Dialog
        open={loadDialogOpen}
        onClose={() => setLoadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Load Saved Design</Typography>
            <IconButton onClick={() => setLoadDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {isLoadingDesigns ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography>Loading designs...</Typography>
            </Box>
          ) : savedDesigns.length === 0 ? (
            <Alert severity="info">
              No saved designs found. Create and save a design to see it here.
            </Alert>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {savedDesigns.map((design) => (
                <Card key={design.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'start', flex: 1, gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => toggleComparisonSelection(design.id)}
                          sx={{ mt: 0.5 }}
                        >
                          {selectedForComparison.includes(design.id) ? (
                            <CheckBoxIcon color="primary" />
                          ) : (
                            <CheckBoxOutlineBlankIcon />
                          )}
                        </IconButton>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 0.5 }}>
                            {design.name}
                          </Typography>
                          {design.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {design.description}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Last updated: {new Date(design.updated_at).toLocaleDateString()} at {new Date(design.updated_at).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => loadDesign(design.id)}
                      >
                        Load
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              {selectedForComparison.length > 0 && `${selectedForComparison.length} selected for comparison`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                onClick={openComparisonView} 
                variant="contained"
                startIcon={<CompareArrowsIcon />}
                disabled={selectedForComparison.length < 2}
              >
                Compare ({selectedForComparison.length})
              </Button>
              <Button onClick={() => setLoadDialogOpen(false)} variant="outlined">
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Comparison Dialog */}
      <Dialog
        open={compareDialogOpen}
        onClose={() => setCompareDialogOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Design Comparison</Typography>
            <IconButton onClick={() => setCompareDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {selectedForComparison.map((designId) => {
              const design = savedDesigns.find(d => d.id === designId);
              if (!design) return null;
              
              return (
                <Grid item xs={12} md={selectedForComparison.length === 2 ? 6 : 4} key={designId}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white', py: 1, borderRadius: 1 }}>
                        {design.name}
                      </Typography>
                      
                      {design.design_options && design.design_options.map((option: any, idx: number) => (
                        <Box key={idx} sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            {option.id === 'end-grain-from-edge' ? 'END GRAIN (FROM EDGE GRAIN)' : 
                             option.id === 'end-grain-from-face' ? 'END GRAIN (FROM FACE GRAIN)' : 
                             option.type.toUpperCase().replace(/-/g, ' ')}
                          </Typography>
                          <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1, mb: 1 }}>
                            <Typography variant="body2">
                              <strong>Dimensions:</strong> {option.dimensions.length.toFixed(2)}" L × {option.dimensions.width.toFixed(2)}" W × {option.dimensions.thickness.toFixed(3)}" T
                            </Typography>
                            <Typography variant="body2">
                              <strong>Wood Pieces:</strong> {design.wood_pieces.length} types
                            </Typography>
                            {option.cuts && (
                              <Typography variant="body2">
                                <strong>Cuts:</strong> {option.cuts} | <strong>Kerf Loss:</strong> {option.wasteFromKerf.toFixed(3)}"
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Wood Types Used:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {design.wood_pieces.map((piece: any, idx: number) => (
                          <Chip
                            key={idx}
                            label={piece.woodType}
                            size="small"
                            sx={{ bgcolor: piece.customColor || '#8D6E63', color: 'white' }}
                          />
                        ))}
                      </Box>
                      
                      {design.juice_groove && design.juice_groove.enabled && (
                        <Box sx={{ mt: 2 }}>
                          <Chip label="🌊 Juice Groove" size="small" color="info" />
                        </Box>
                      )}
                      
                      {design.handle_holes && design.handle_holes.enabled && (
                        <Box sx={{ mt: 1 }}>
                          <Chip label={`🔘 ${design.handle_holes.count} Handle Holes`} size="small" color="secondary" />
                        </Box>
                      )}
                      
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                        <Typography variant="caption" color="text.secondary">
                          Updated: {new Date(design.updated_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Calculator Components */}
      <FractionCalculator 
        open={fractionCalcOpen} 
        onClose={() => setFractionCalcOpen(false)} 
      />
      <BoardCalculator 
        open={boardCalcOpen} 
        onClose={() => setBoardCalcOpen(false)} 
      />
    </Box>
  );
};

export default CuttingBoardDesigner;
