import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CardMedia,
  TextField,
  InputAdornment,
  Pagination,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

interface ImageFile {
  name: string;
  path: string;
  pdfName: string;
  pageNumber: string;
}

const ImageViewer: React.FC = () => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<ImageFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [zoom, setZoom] = useState(1);
  
  // Touch/swipe state for mobile
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchEnd, setTouchEnd] = useState<number>(0);
  
  // Pagination for file list
  const [page, setPage] = useState(1);
  const itemsPerPage = 500;

  useEffect(() => {
    loadImageFiles();
  }, []);

  // Keyboard navigation for image dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedImage === null) return;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          navigateToNextImage();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          navigateToPreviousImage();
          break;
        case 'Escape':
          event.preventDefault();
          handleCloseDialog();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, selectedImageIndex, filteredFiles]);

  // Touch/swipe handlers for mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0); // Reset
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50; // Minimum swipe distance
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      navigateToNextImage(); // Swipe left = next image
    }
    if (isRightSwipe) {
      navigateToPreviousImage(); // Swipe right = previous image
    }
  };

  useEffect(() => {
    // Filter files based on search term
    if (searchTerm.trim() === '') {
      setFilteredFiles(imageFiles);
    } else {
      const filtered = imageFiles.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.pdfName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
    setPage(1); // Reset to first page when searching
  }, [searchTerm, imageFiles]);

  const loadImageFiles = async () => {
    try {
      const response = await fetch('/api/image-files');
      const data = await response.json();
      
      // Parse image filenames to extract PDF name and page number
      const parsedData = data.map((file: { name: string; path: string }) => {
        const match = file.name.match(/^(.+)_page_(\d+)\.jpg$/);
        if (match) {
          return {
            ...file,
            pdfName: match[1],
            pageNumber: match[2]
          };
        }
        return {
          ...file,
          pdfName: file.name,
          pageNumber: '1'
        };
      });
      
      setImageFiles(parsedData);
      setFilteredFiles(parsedData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading image files:', error);
      setLoading(false);
    }
  };

  const handleImageClick = (imagePath: string, imageName: string) => {
    const index = filteredFiles.findIndex(file => file.path === imagePath);
    setSelectedImage(imagePath);
    setSelectedImageName(imageName);
    setSelectedImageIndex(index);
    setZoom(1); // Reset zoom when opening new image
  };

  const handleCloseDialog = () => {
    setSelectedImage(null);
    setSelectedImageName('');
    setSelectedImageIndex(-1);
    setZoom(1);
  };

  const navigateToNextImage = () => {
    if (selectedImageIndex < filteredFiles.length - 1) {
      const nextIndex = selectedImageIndex + 1;
      const nextFile = filteredFiles[nextIndex];
      setSelectedImage(nextFile.path);
      setSelectedImageName(nextFile.name);
      setSelectedImageIndex(nextIndex);
      setZoom(1); // Reset zoom when changing image
    }
  };

  const navigateToPreviousImage = () => {
    if (selectedImageIndex > 0) {
      const prevIndex = selectedImageIndex - 1;
      const prevFile = filteredFiles[prevIndex];
      setSelectedImage(prevFile.path);
      setSelectedImageName(prevFile.name);
      setSelectedImageIndex(prevIndex);
      setZoom(1); // Reset zoom when changing image
    }
  };

  const handleDownload = () => {
    if (selectedImage) {
      const link = document.createElement('a');
      link.href = selectedImage;
      link.download = selectedImageName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFiles = filteredFiles.slice(startIndex, endIndex);

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ImageIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                PDF Image Viewer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Browse converted PDF pages as images
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={`${filteredFiles.length} images`} 
            color="primary" 
            variant="outlined"
            sx={{ fontSize: '1rem', px: 1 }}
          />
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by PDF name or page number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : filteredFiles.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <ImageIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No images found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'Try adjusting your search' : 'Run the converter to generate images'}
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {currentFiles.map((file, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardActionArea 
                      onClick={() => handleImageClick(file.path, file.name)}
                      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                      <CardMedia
                        component="img"
                        height="200"
                        image={file.path}
                        alt={file.name}
                        sx={{ 
                          objectFit: 'contain',
                          bgcolor: '#f5f5f5',
                          p: 1
                        }}
                      />
                      <CardContent sx={{ flexGrow: 1, width: '100%', pt: 1 }}>
                        <Tooltip title={file.pdfName}>
                          <Typography 
                            variant="body2" 
                            fontWeight="medium"
                            noWrap
                            sx={{ mb: 0.5 }}
                          >
                            {file.pdfName}
                          </Typography>
                        </Tooltip>
                        <Typography variant="caption" color="text.secondary">
                          Page {parseInt(file.pageNumber)}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Image Dialog */}
      <Dialog
        open={selectedImage !== null}
        onClose={handleCloseDialog}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#000',
            minHeight: '90vh'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            bgcolor: '#1a1a1a',
            color: 'white'
          }}
        >
          <Typography variant="h6">{selectedImageName}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Zoom Out">
              <IconButton 
                onClick={handleZoomOut} 
                disabled={zoom <= 0.5}
                sx={{ color: 'white' }}
              >
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Typography sx={{ color: 'white', alignSelf: 'center', minWidth: 60, textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </Typography>
            <Tooltip title="Zoom In">
              <IconButton 
                onClick={handleZoomIn} 
                disabled={zoom >= 3}
                sx={{ color: 'white' }}
              >
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton onClick={handleDownload} sx={{ color: 'white' }}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            bgcolor: '#000',
            overflow: 'auto',
            p: 2,
            height: 'calc(90vh - 64px)', // Subtract title bar height
            touchAction: 'pan-y' // Allow vertical scrolling but enable horizontal swipe
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt={selectedImageName}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                transform: zoom !== 1 ? `scale(${zoom})` : 'none',
                transformOrigin: 'center center',
                transition: 'transform 0.2s',
                cursor: zoom > 1 ? 'move' : 'default',
                display: 'block',
                userSelect: 'none' // Prevent image selection during swipe
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ImageViewer;
