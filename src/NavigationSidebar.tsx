
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
} from '@mui/icons-material';
import { useMsal } from '@azure/msal-react';

const drawerWidth = 280;

type AppView = 'dashboard' | 'chat' | 'shop' | 'halloween' | 'woodworking' | 'converter';

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
    { id: 'chat', label: 'Test Chat App', icon: <ChatIcon />, color: '#4CAF50' },
    { id: 'shop', label: 'My Shop Tools', icon: <StoreIcon />, color: '#6366f1' },
    { id: 'woodworking', label: 'Woodworking Projects', icon: <CarpenterIcon />, color: '#f59e0b' },
    { id: 'halloween', label: 'Halloween Movies', icon: <MovieIcon />, color: '#ff9800' },
    { id: 'converter', label: 'Excel to JSON Converter', icon: <ConverterIcon />, color: '#9c27b0' },
  ];

  // Don't show sidebar on dashboard unless explicitly requested
  if (currentView === 'dashboard' && !showOnDashboard) {
    return null;
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#f8fafc',
          borderRight: '1px solid #e2e8f0',
        },
      }}
    >
      {/* App Title */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" component="h1" fontWeight="bold" color="primary">
          Secret App
        </Typography>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ px: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => onNavigate(item.id as AppView)}
              selected={currentView === item.id}
              sx={{
                borderRadius: 2,
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
              <ListItemIcon sx={{ color: item.color, minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: currentView === item.id ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* User Profile Section */}
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            <AccountIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap fontWeight={600}>
              {userName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
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
          sx={{ textTransform: 'none' }}
        >
          Sign Out
        </Button>
      </Box>
    </Drawer>
  );
}