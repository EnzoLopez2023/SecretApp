
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Button,
  Typography,
} from '@mui/material';
import {
  Home as HomeIcon,
  Chat as ChatIcon,
  Store as StoreIcon,
  Movie as MovieIcon,
  Carpenter as CarpenterIcon,
  TableChart as ConverterIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Api as ApiIcon,
  PlaylistAdd as PlaylistAddIcon,
} from '@mui/icons-material';
import { useMsal } from '@azure/msal-react';

const drawerWidth = 280;

type AppView = 'dashboard' | 'chat' | 'shop' | 'halloween' | 'woodworking' | 'converter' | 'plex-api' | 'playlist-creator';

interface NavigationSidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  showOnDashboard?: boolean;
}

export default function NavigationSidebar({ currentView, onNavigate, showOnDashboard = false }: NavigationSidebarProps) {
  const { instance, accounts } = useMsal();

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  const account = accounts[0];
  const userName = account?.name || 'User';
  const userEmail = account?.username || '';

  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: <HomeIcon />, color: '#2196F3' },
    { id: 'chat', label: 'AI Assistant', icon: <ChatIcon />, color: '#4CAF50' },
    { id: 'shop', label: 'Shop Tools Manager', icon: <StoreIcon />, color: '#6366f1' },
    { id: 'woodworking', label: 'Project Workshop', icon: <CarpenterIcon />, color: '#f59e0b' },
    { id: 'halloween', label: 'Media Library', icon: <MovieIcon />, color: '#ff9800' },
    { id: 'converter', label: 'Data Converter', icon: <ConverterIcon />, color: '#9c27b0' },
    { id: 'plex-api', label: 'Plex API Client', icon: <ApiIcon />, color: '#e74c3c' },
    { id: 'playlist-creator', label: 'Playlist Creator', icon: <PlaylistAddIcon />, color: '#8b5cf6' },
  ];

  // Don't show sidebar on dashboard unless explicitly requested
  if (currentView === 'dashboard' && !showOnDashboard) {
    return null;
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: { xs: '100%', md: drawerWidth },
        flexShrink: 0,
        display: { xs: 'block', md: 'block' },
        '& .MuiDrawer-paper': {
          width: { xs: '100%', md: drawerWidth },
          boxSizing: 'border-box',
          backgroundColor: '#f8fafc',
          borderRight: { xs: 'none', md: '1px solid #e2e8f0' },
          borderBottom: { xs: '1px solid #e2e8f0', md: 'none' },
          position: { xs: 'relative', md: 'fixed' },
          height: { xs: 'auto', md: '100vh' },
        },
      }}
    >
      {/* App Title */}
      <Box sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}>
        <Typography 
          variant="h5" 
          component="h1" 
          fontWeight="bold" 
          color="primary"
          sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
        >
          Workshop Studio
        </Typography>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ px: { xs: 1, md: 2 }, py: { xs: 1, md: 2 } }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: { xs: 0.5, md: 1 } }}>
            <ListItemButton
              onClick={() => onNavigate(item.id as AppView)}
              selected={currentView === item.id}
              sx={{
                borderRadius: 2,
                minHeight: { xs: '48px', md: '44px' }, // Touch-friendly on mobile
                py: { xs: 1.5, md: 1 },
                '&.Mui-selected': {
                  backgroundColor: `${item.color}15`,
                  '& .MuiListItemIcon-root': {
                    color: item.color,
                  },
                  '&:hover': {
                    backgroundColor: `${item.color}25`,
                  },
                },
                '&:hover': {
                  backgroundColor: `${item.color}10`,
                },
              }}
            >
              <ListItemIcon sx={{ color: item.color, minWidth: { xs: 36, md: 40 } }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: { xs: '0.9rem', md: '0.95rem' },
                  fontWeight: currentView === item.id ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* User Profile Section */}
      <Box sx={{ mt: 'auto', p: { xs: 1.5, md: 2 } }}>
        <Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: { xs: 1.5, md: 2 },
          flexDirection: { xs: 'column', md: 'row' },
          textAlign: { xs: 'center', md: 'left' }
        }}>
          <Avatar sx={{ 
            mr: { xs: 0, md: 2 }, 
            mb: { xs: 1, md: 0 },
            bgcolor: 'primary.main',
            width: { xs: 36, md: 40 },
            height: { xs: 36, md: 40 }
          }}>
            <AccountIcon sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }} />
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle2" 
              noWrap 
              fontWeight={600}
              sx={{ fontSize: { xs: '0.875rem', md: '0.875rem' } }}
            >
              {userName}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              noWrap
              sx={{ fontSize: { xs: '0.75rem', md: '0.75rem' } }}
            >
              {userEmail}
            </Typography>
          </Box>
        </Box>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          size="small"
          sx={{ 
            textTransform: 'none',
            minHeight: { xs: '44px', md: '36px' }, // Touch-friendly on mobile
            fontSize: { xs: '0.875rem', md: '0.875rem' }
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Drawer>
  );
}