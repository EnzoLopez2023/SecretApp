import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

interface PDFFile {
  name: string;
  path: string;
}

const PDFViewer: React.FC = () => {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<PDFFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [selectedPdfName, setSelectedPdfName] = useState<string>('');
  
  // Pagination for file list
  const [page, setPage] = useState(1);
  const itemsPerPage = 24;

  useEffect(() => {
    loadPDFFiles();
  }, []);

  useEffect(() => {
    // Filter files based on search term
    if (searchTerm.trim() === '') {
      setFilteredFiles(pdfFiles);
    } else {
      const filtered = pdfFiles.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFiles(filtered);
      setPage(1); // Reset to first page when searching
    }
  }, [searchTerm, pdfFiles]);

  const loadPDFFiles = async () => {
    try {
      // Fetch the list of PDF files from the server
      const response = await fetch('/api/pdf-files');
      if (!response.ok) {
        throw new Error('Failed to load PDF files');
      }
      const files = await response.json();
      setPdfFiles(files);
      setFilteredFiles(files);
    } catch (error) {
      console.error('Error loading PDF files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfClick = (pdfPath: string, pdfName: string) => {
    setSelectedPdf(pdfPath);
    setSelectedPdfName(pdfName);
  };

  const handleClosePdf = () => {
    setSelectedPdf(null);
    setSelectedPdfName('');
  };

  const handleDownload = (pdfPath: string, pdfName: string) => {
    const link = document.createElement('a');
    link.href = pdfPath;
    link.download = pdfName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate pagination
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFiles = filteredFiles.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 3, background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PictureAsPdfIcon sx={{ fontSize: 48, color: 'white' }} />
            <Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                PDF Document Viewer
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Browse and view all PDF files
              </Typography>
            </Box>
          </Box>
          <Chip
            label={`${filteredFiles.length} Documents`}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
              px: 2,
              py: 3
            }}
          />
        </Box>
      </Paper>

      {/* Search Bar */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search PDF files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      )}

      {/* PDF Grid */}
      {!loading && (
        <>
          <Grid container spacing={2}>
            {paginatedFiles.map((file) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={file.path}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardActionArea onClick={() => handlePdfClick(file.path, file.name)}>
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#f5f5f5',
                        borderBottom: '1px solid #e0e0e0'
                      }}
                    >
                      <PictureAsPdfIcon sx={{ fontSize: 80, color: '#d32f2f' }} />
                    </Box>
                    <CardContent>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {file.name}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}

          {/* No Results */}
          {filteredFiles.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PictureAsPdfIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No PDF files found
              </Typography>
              {searchTerm && (
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search terms
                </Typography>
              )}
            </Box>
          )}
        </>
      )}

      {/* PDF Viewer Dialog */}
      <Dialog
        open={selectedPdf !== null}
        onClose={handleClosePdf}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedPdfName}
            </Typography>
            <Box>
              <Tooltip title="Download PDF">
                <IconButton
                  onClick={() => {
                    if (selectedPdf) {
                      handleDownload(selectedPdf, selectedPdfName);
                    }
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={handleClosePdf}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {selectedPdf && (
            <Box sx={{ width: '100%', height: '100%' }}>
              <iframe
                src={selectedPdf}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title={selectedPdfName}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PDFViewer;
