
import React, { useState, useEffect } from 'react';
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
  Collapse,
  IconButton,
  Tooltip,
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
  HomeRepairService as MaintenanceIcon,
  Restaurant as RecipeIcon,
  Kitchen as PantryIcon,
  ShoppingCart as ShoppingListIcon,
  ExpandLess,
  ExpandMore,
  MenuOpen as MenuOpenIcon,
  Menu as MenuIcon,
  Build as WorkshopIcon,
  SmartToy as AIIcon,
  Storage as DataIcon,
  Dashboard as BoardIcon,
} from '@mui/icons-material';
import { useMsal } from '@azure/msal-react';

const drawerWidth = 280;
const collapsedDrawerWidth = 72;

type AppView = 'dashboard' | 'chat' | 'shop' | 'halloween' | 'woodworking' | 'converter' | 'plex-api' | 'playlist-creator' | 'home-maintenance' | 'recipe-manager' | 'pantry-manager' | 'shopping-lists' | 'cutting-board-designer';

interface NavigationSidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  showOnDashboard?: boolean;
}

interface MenuCategory {
  id: string;
  label: string;
  icon: React.ReactElement;
  color: string;
  items: Array<{
    id: AppView;
    label: string;
    icon: React.ReactElement;
    color: string;
  }>;
}

export default function NavigationSidebar({ currentView, onNavigate, showOnDashboard = false }: NavigationSidebarProps) {
  const { instance, accounts } = useMsal();
  
  // State for sidebar collapse and category expansions
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    home: true,
    workshop: true,
    kitchen: true,
    ai: true,
    data: true,
  });

  // Load state from localStorage on mount
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    const savedExpanded = localStorage.getItem('sidebar-expanded-categories');
    
    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
    if (savedExpanded !== null) {
      setExpandedCategories(JSON.parse(savedExpanded));
    }
  }, []);

  // Save state to localStorage when changed
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('sidebar-expanded-categories', JSON.stringify(expandedCategories));
  }, [expandedCategories]);

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const account = accounts[0];
  const userName = account?.name || 'User';
  const userEmail = account?.username || '';

  // Organized menu categories
  const menuCategories: MenuCategory[] = [
    {
      id: 'home',
      label: 'Home & Maintenance',
      icon: <HomeIcon />,
      color: '#10b981',
      items: [
        { id: 'dashboard', label: 'Home', icon: <HomeIcon />, color: '#2196F3' },
        { id: 'home-maintenance', label: 'Home Maintenance', icon: <MaintenanceIcon />, color: '#10b981' },
        { id: 'pantry-manager', label: 'Pantry Manager', icon: <PantryIcon />, color: '#4caf50' },
      ]
    },
    {
      id: 'workshop',
      label: 'Workshop & Projects',
      icon: <WorkshopIcon />,
      color: '#f59e0b',
      items: [
        { id: 'shop', label: 'Shop Tools Manager', icon: <StoreIcon />, color: '#6366f1' },
        { id: 'woodworking', label: 'Project Workshop', icon: <CarpenterIcon />, color: '#f59e0b' },
        { id: 'cutting-board-designer', label: 'Cutting Board Designer', icon: <BoardIcon />, color: '#6B4423' },
        { id: 'halloween', label: 'Media Library', icon: <MovieIcon />, color: '#ff9800' },
      ]
    },
    {
      id: 'kitchen',
      label: 'Kitchen & Recipes',
      icon: <RecipeIcon />,
      color: '#ff5722',
      items: [
        { id: 'recipe-manager', label: 'Recipe Manager', icon: <RecipeIcon />, color: '#ff5722' },
        { id: 'shopping-lists', label: 'Shopping Lists', icon: <ShoppingListIcon />, color: '#2196F3' },
      ]
    },
    {
      id: 'ai',
      label: 'AI & Automation',
      icon: <AIIcon />,
      color: '#4CAF50',
      items: [
        { id: 'chat', label: 'AI Assistant', icon: <ChatIcon />, color: '#4CAF50' },
        { id: 'plex-api', label: 'Plex API Client', icon: <ApiIcon />, color: '#e74c3c' },
        { id: 'playlist-creator', label: 'Playlist Creator', icon: <PlaylistAddIcon />, color: '#8b5cf6' },
      ]
    },
    {
      id: 'data',
      label: 'Data & Utilities',
      icon: <DataIcon />,
      color: '#9c27b0',
      items: [
        { id: 'converter', label: 'Data Converter', icon: <ConverterIcon />, color: '#9c27b0' },
      ]
    }
  ];

  const currentWidth = isCollapsed ? collapsedDrawerWidth : drawerWidth;

  // Don't show sidebar on dashboard unless explicitly requested
  if (currentView === 'dashboard' && !showOnDashboard) {
    return null;
  }

  // Render menu item with tooltip for collapsed mode
  const renderMenuItem = (item: { id: AppView; label: string; icon: React.ReactElement; color: string }, isIndented = false) => {
    const menuButton = (
      <ListItemButton
        onClick={() => onNavigate(item.id)}
        selected={currentView === item.id}
        sx={{
          borderRadius: 2,
          minHeight: 44,
          pl: isIndented && !isCollapsed ? 4 : 2,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
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
        <ListItemIcon sx={{ 
          color: item.color, 
          minWidth: isCollapsed ? 'auto' : 40,
          justifyContent: 'center'
        }}>
          {item.icon}
        </ListItemIcon>
        {!isCollapsed && (
          <ListItemText 
            primary={item.label}
            primaryTypographyProps={{
              fontSize: '0.95rem',
              fontWeight: currentView === item.id ? 600 : 400,
            }}
          />
        )}
      </ListItemButton>
    );

    if (isCollapsed) {
      return (
        <Tooltip title={item.label} placement="right" arrow>
          {menuButton}
        </Tooltip>
      );
    }

    return menuButton;
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: { xs: '100%', md: currentWidth },
        flexShrink: 0,
        display: { xs: 'block', md: 'block' },
        '& .MuiDrawer-paper': {
          width: { xs: '100%', md: currentWidth },
          boxSizing: 'border-box',
          backgroundColor: '#f8fafc',
          borderRight: { xs: 'none', md: '1px solid #e2e8f0' },
          borderBottom: { xs: '1px solid #e2e8f0', md: 'none' },
          position: { xs: 'relative', md: 'fixed' },
          height: { xs: 'auto', md: '100vh' },
          transition: 'width 0.2s ease-in-out',
        },
      }}
    >
      {/* App Title and Collapse Toggle */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between'
      }}>
        {!isCollapsed && (
          <Typography 
            variant="h6" 
            component="h1" 
            fontWeight="bold" 
            color="primary"
            sx={{ fontSize: '1.25rem' }}
          >
            Workshop Studio
          </Typography>
        )}
        <IconButton 
          onClick={toggleSidebar}
          size="small"
          sx={{ 
            color: 'primary.main',
            '&:hover': { backgroundColor: 'primary.light' + '10' }
          }}
        >
          {isCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
        </IconButton>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ px: 1, py: 1, flex: 1 }}>
        {menuCategories.map((category) => (
          <Box key={category.id}>
            {!isCollapsed && (
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => toggleCategory(category.id)}
                  sx={{
                    borderRadius: 1,
                    minHeight: 36,
                    '&:hover': {
                      backgroundColor: `${category.color}10`,
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: category.color, minWidth: 36 }}>
                    {category.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={category.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'text.secondary',
                    }}
                  />
                  {expandedCategories[category.id] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
            )}
            
            {/* Category Items */}
            {isCollapsed ? (
              // In collapsed mode, show all items as top-level
              category.items.map((item) => (
                <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                  {renderMenuItem(item)}
                </ListItem>
              ))
            ) : (
              <Collapse in={expandedCategories[category.id]} timeout="auto">
                <List disablePadding>
                  {category.items.map((item) => (
                    <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                      {renderMenuItem(item, true)}
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </List>

      {/* User Profile Section */}
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        {isCollapsed ? (
          // Collapsed user section - just avatar with tooltip
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Tooltip title={`${userName}\n${userEmail}`} placement="right" arrow>
              <Avatar sx={{ 
                bgcolor: 'primary.main',
                width: 40,
                height: 40,
                cursor: 'pointer'
              }}>
                <AccountIcon />
              </Avatar>
            </Tooltip>
            <Tooltip title="Sign Out" placement="right" arrow>
              <IconButton
                onClick={handleLogout}
                size="small"
                sx={{ 
                  color: 'error.main',
                  '&:hover': { backgroundColor: 'error.light' + '10' }
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          // Expanded user section
          <>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2,
            }}>
              <Avatar sx={{ 
                mr: 2, 
                bgcolor: 'primary.main',
                width: 40,
                height: 40
              }}>
                <AccountIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography 
                  variant="subtitle2" 
                  noWrap 
                  fontWeight={600}
                  sx={{ fontSize: '0.875rem' }}
                >
                  {userName}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  noWrap
                  sx={{ fontSize: '0.75rem' }}
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
                minHeight: '36px',
                fontSize: '0.875rem'
              }}
            >
              Sign Out
            </Button>
          </>
        )}
      </Box>
    </Drawer>
  );
}