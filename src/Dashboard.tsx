import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Store as StoreIcon,
  Movie as MovieIcon,
  Carpenter as CarpenterIcon,
  TableChart as ConverterIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { useMsal } from '@azure/msal-react';
import NavigationSidebar from './NavigationSidebar';
import VersionDisplay from './components/VersionDisplay';

type AppView = 'dashboard' | 'chat' | 'shop' | 'halloween' | 'woodworking' | 'converter';

interface DashboardProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export default function Dashboard({ currentView, onNavigate }: DashboardProps) {
  const { accounts } = useMsal();

  const account = accounts[0];
  const userName = account?.name || 'User';
  const userEmail = account?.username || '';

  const menuItems = [
    { id: 'chat', label: 'AI Assistant', icon: <ChatIcon />, color: '#4CAF50' },
    { id: 'shop', label: 'Shop Tools Manager', icon: <StoreIcon />, color: '#6366f1' },
    { id: 'woodworking', label: 'Project Workshop', icon: <CarpenterIcon />, color: '#f59e0b' },
    { id: 'halloween', label: 'Media Library', icon: <MovieIcon />, color: '#ff9800' },
    { id: 'converter', label: 'Data Converter', icon: <ConverterIcon />, color: '#9c27b0' },
  ];

  if (currentView !== 'dashboard') {
    return null; // Don't render dashboard when on other pages
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Navigation Sidebar */}
      <NavigationSidebar currentView={currentView} onNavigate={onNavigate} showOnDashboard={true} />

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: '#f1f5f9' }}>
        {/* Top App Bar */}
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            bgcolor: 'white', 
            color: 'text.primary',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              Workshop Studio
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <VersionDisplay variant="chip" size="small" />
              <Typography variant="body2" color="text.secondary">
                Welcome, {userName}!
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Dashboard Content */}
        <Box sx={{ p: 4 }}>
          {/* Welcome Section */}
          <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                <AccountIcon sx={{ fontSize: 48, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                    Welcome to Workshop Studio
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    🛠️ Your Personal Productivity & Maker's Hub
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, opacity: 0.8 }}>
                    Manage your projects, tools, media library, and more - all in one place.
                  </Typography>
                  <Box sx={{ mt: 2, opacity: 0.7 }}>
                    <VersionDisplay variant="text" size="medium" />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AccountIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Your Account Information
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Name:
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {userName}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Email:
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {userEmail}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Account ID:
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: '#f8fafc',
                      borderRadius: 1,
                      border: '1px solid #e2e8f0',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      wordBreak: 'break-all',
                      color: 'text.secondary',
                    }}
                  >
                    {account?.localAccountId || account?.homeAccountId || 'N/A'}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Access Apps */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
            Quick Access
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 2 
          }}>
            {menuItems.map((item) => (
              <Card 
                key={item.id}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  }
                }}
                onClick={() => onNavigate(item.id as AppView)}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ color: item.color, mb: 1 }}>
                    {React.cloneElement(item.icon, { sx: { fontSize: 32 } })}
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {item.label}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ 
                      borderColor: item.color,
                      color: item.color,
                      '&:hover': {
                        borderColor: item.color,
                        backgroundColor: `${item.color}10`,
                      }
                    }}
                  >
                    Open App
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}