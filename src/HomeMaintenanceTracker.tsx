import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Avatar,
  Menu,
  MenuItem as MenuItemComponent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Home as HomeIcon,
  Assignment as TaskIcon,
  PhotoCamera as PhotoIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Analytics as AnalyticsIcon,
  SmartToy as AIIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface HomeItem {
  id: number;
  name: string;
  category: string;
  location: string;
  description: string;
  purchase_date: string;
  installation_date: string;
  manufacturer: string;
  model_number: string;
  serial_number: string;
  estimated_lifespan_years: number;
  replacement_cost: number;
  created_at: string;
  updated_at: string;
}

interface MaintenanceTask {
  id: number;
  item_id: number;
  item_name: string;
  item_location: string;
  title: string;
  description: string;
  task_type: string;
  priority: string;
  status: string;
  scheduled_date: string;
  due_date: string;
  completed_date: string;
  estimated_duration_hours: number;
  actual_duration_hours: number;
  recurring_interval_days: number;
  next_due_date: string;
  assigned_to: string;
  notes: string;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

interface Warranty {
  id: number;
  item_id: number;
  item_name: string;
  warranty_type: string;
  provider: string;
  warranty_number: string;
  start_date: string;
  end_date: string;
  coverage_description: string;
  claim_process: string;
  contact_info: string;
  is_active: boolean;
  ai_analyzed: boolean;
  ai_summary: string;
}

interface MaintenanceCost {
  id: number;
  item_id: number;
  item_name: string;
  task_id: number;
  task_title: string;
  cost_type: string;
  description: string;
  amount: number;
  vendor: string;
  cost_date: string;
  notes: string;
  tax_amount: number;
  warranty_covered: boolean;
}



interface DashboardStats {
  total_items: number;
  pending_tasks: number;
  overdue_tasks: number;
  active_warranties: number;
  year_costs: number;
}

const ITEM_CATEGORIES = [
  'HVAC', 'Plumbing', 'Electrical', 'Appliances', 
  'Exterior', 'Interior', 'Flooring', 'Security', 
  'Landscaping', 'Other'
];

const TASK_TYPES = [
  'Scheduled', 'Emergency', 'Preventive', 'Inspection', 'Repair', 'Replacement'
];

const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const TASK_STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled', 'Overdue'];

// Constants will be used in future updates
// const WARRANTY_TYPES = ['Manufacturer', 'Extended', 'Service Plan', 'Insurance'];
// const COST_TYPES = ['Labor', 'Materials', 'Tools', 'Professional Service', 'Parts', 'Emergency', 'Other'];
// const PHOTO_CATEGORIES = ['Before', 'After', 'During', 'Problem', 'Solution', 'Documentation', 'General'];

export default function HomeMaintenanceTracker() {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Data states
  const [items, setItems] = useState<HomeItem[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [costs, setCosts] = useState<MaintenanceCost[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  
  // Dialog states
  const [itemDialog, setItemDialog] = useState(false);
  const [taskDialog, setTaskDialog] = useState(false);
  const [photoDialog, setPhotoDialog] = useState(false);
  
  // Current editing items
  const [currentItem, setCurrentItem] = useState<Partial<HomeItem>>({});
  const [currentTask, setCurrentTask] = useState<Partial<MaintenanceTask>>({});
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  
  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<HomeItem | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchItems();
    fetchTasks();
    fetchWarranties();
    fetchCosts();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/maintenance/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      console.log('🏠 Fetching home items...');
      const response = await fetch('/api/maintenance/items');
      console.log('📡 Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Items loaded:', data.length);
        setItems(data);
      } else {
        console.error('❌ Response not ok:', response.statusText);
        throw new Error(`Failed to fetch items: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError(`Failed to load home items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      console.log('📋 Fetching tasks...');
      const response = await fetch('/api/maintenance/tasks');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Tasks loaded:', data.length);
        setTasks(data);
      } else {
        console.error('❌ Failed to fetch tasks:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
    }
  };

  const fetchWarranties = async () => {
    try {
      const response = await fetch('/api/maintenance/warranties');
      if (response.ok) {
        const data = await response.json();
        setWarranties(data);
      }
    } catch (error) {
      console.error('Failed to fetch warranties:', error);
    }
  };

  const fetchCosts = async () => {
    try {
      const response = await fetch('/api/maintenance/costs');
      if (response.ok) {
        const data = await response.json();
        setCosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch costs:', error);
    }
  };

  const fetchPhotos = async (itemId: number) => {
    try {
      const response = await fetch(`/api/maintenance/photos/${itemId}`);
      if (response.ok) {
        // Photos functionality removed for now
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    }
  };

  const handleSaveItem = async () => {
    try {
      setLoading(true);
      const method = currentItem.id ? 'PUT' : 'POST';
      const url = currentItem.id ? `/api/maintenance/items/${currentItem.id}` : '/api/maintenance/items';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentItem),
      });
      
      if (response.ok) {
        setSuccess(currentItem.id ? 'Item updated successfully' : 'Item created successfully');
        setItemDialog(false);
        setCurrentItem({});
        fetchItems();
        fetchDashboardData();
      } else {
        throw new Error('Failed to save item');
      }
    } catch (error) {
      setError('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async () => {
    try {
      setLoading(true);
      const method = currentTask.id ? 'PUT' : 'POST';
      const url = currentTask.id ? `/api/maintenance/tasks/${currentTask.id}` : '/api/maintenance/tasks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTask),
      });
      
      if (response.ok) {
        setSuccess(currentTask.id ? 'Task updated successfully' : 'Task created successfully');
        setTaskDialog(false);
        setCurrentTask({});
        fetchTasks();
        fetchDashboardData();
      } else {
        throw new Error('Failed to save task');
      }
    } catch (error) {
      setError('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item? This will also delete all associated tasks, warranties, photos, and costs.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/maintenance/items/${id}`, { method: 'DELETE' });
      
      if (response.ok) {
        setSuccess('Item deleted successfully');
        fetchItems();
        fetchTasks();
        fetchWarranties();
        fetchCosts();
        fetchDashboardData();
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      setError('Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAISuggestions = async (itemId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/maintenance/ai-suggestions/${itemId}`, { method: 'POST' });
      
      if (response.ok) {
        const insights = await response.json();
        setSuccess(`Generated ${insights.length} AI suggestions for maintenance`);
        // You might want to show these insights in a dialog or update the UI
      } else {
        throw new Error('Failed to generate AI suggestions');
      }
    } catch (error) {
      setError('Failed to generate AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !selectedItemId) return;
    
    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        const response = await fetch(`/api/maintenance/photos/${selectedItemId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photo_name: photoFile.name,
            photo_data: base64Data,
            photo_type: photoFile.type,
            photo_category: 'General',
            description: ''
          }),
        });
        
        if (response.ok) {
          setSuccess('Photo uploaded successfully');
          setPhotoDialog(false);
          setPhotoFile(null);
          setPhotoPreview('');
          fetchPhotos(selectedItemId);
        } else {
          throw new Error('Failed to upload photo');
        }
      };
      reader.readAsDataURL(photoFile);
    } catch (error) {
      setError('Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'info';
      case 'Overdue': return 'error';
      case 'Cancelled': return 'default';
      default: return 'warning';
    }
  };

  const renderDashboard = () => (
    <Box>
      {/* Stats Cards */}
      <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <HomeIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{dashboardStats?.total_items || 0}</Typography>
                <Typography color="text.secondary">Home Items</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <TaskIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{dashboardStats?.pending_tasks || 0}</Typography>
                <Typography color="text.secondary">Pending Tasks</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <WarningIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{dashboardStats?.overdue_tasks || 0}</Typography>
                <Typography color="text.secondary">Overdue Tasks</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <SecurityIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">{dashboardStats?.active_warranties || 0}</Typography>
                <Typography color="text.secondary">Active Warranties</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <MoneyIcon />
              </Avatar>
              <Box>
                <Typography variant="h4">${dashboardStats?.year_costs?.toLocaleString() || 0}</Typography>
                <Typography color="text.secondary">Year Costs</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Tasks and Quick Actions */}
      <Box display="flex" gap={3} flexWrap="wrap">
        <Card sx={{ flex: '2 1 400px', minWidth: 400 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Upcoming Tasks</Typography>
              <Button
                size="small"
                onClick={() => setCurrentTab(2)}
                endIcon={<TaskIcon />}
              >
                View All
              </Button>
            </Box>
            <List>
              {tasks.filter(t => t.status !== 'Completed').slice(0, 5).map((task) => (
                <ListItem key={task.id} divider>
                  <ListItemText
                    primary={task.title}
                    secondary={`${task.item_name} • Due: ${new Date(task.due_date).toLocaleDateString()}`}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={task.priority}
                      color={getPriorityColor(task.priority) as any}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setCurrentItem({});
                  setItemDialog(true);
                }}
                fullWidth
              >
                Add Home Item
              </Button>
              <Button
                variant="outlined"
                startIcon={<TaskIcon />}
                onClick={() => {
                  setCurrentTask({});
                  setTaskDialog(true);
                }}
                fullWidth
              >
                Create Task
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoIcon />}
                onClick={() => setPhotoDialog(true)}
                fullWidth
              >
                Upload Photo
              </Button>
              <Button
                variant="outlined"
                startIcon={<AIIcon />}
                color="secondary"
                fullWidth
              >
                AI Insights
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  const renderItems = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Home Items</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setCurrentItem({});
            setItemDialog(true);
          }}
        >
          Add Item
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {items.map((item) => (
          <Box key={item.id} sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' } }}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" noWrap>{item.name}</Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      setAnchorEl(e.currentTarget);
                      setSelectedItem(item);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                
                <Chip label={item.category} size="small" sx={{ mb: 1 }} />
                <Typography color="text.secondary" gutterBottom>
                  📍 {item.location}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {item.description}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {item.manufacturer}
                  </Typography>
                  {item.replacement_cost && (
                    <Typography variant="caption" color="primary">
                      ${item.replacement_cost.toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </CardContent>
              
              <CardActions>
                <Button size="small" startIcon={<TaskIcon />}>
                  Tasks ({tasks.filter(t => t.item_id === item.id).length})
                </Button>
                <Button 
                  size="small" 
                  startIcon={<AIIcon />}
                  onClick={() => handleGenerateAISuggestions(item.id)}
                >
                  AI Insights
                </Button>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Item Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItemComponent
          onClick={() => {
            setCurrentItem(selectedItem || {});
            setItemDialog(true);
            setAnchorEl(null);
          }}
        >
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItemComponent>
        <MenuItemComponent
          onClick={() => {
            if (selectedItem) {
              setSelectedItemId(selectedItem.id);
              fetchPhotos(selectedItem.id);
              setPhotoDialog(true);
            }
            setAnchorEl(null);
          }}
        >
          <PhotoIcon sx={{ mr: 1 }} /> Photos
        </MenuItemComponent>
        <Divider />
        <MenuItemComponent
          onClick={() => {
            if (selectedItem) {
              handleDeleteItem(selectedItem.id);
            }
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItemComponent>
      </Menu>
    </Box>
  );

  const renderTasks = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Maintenance Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setCurrentTask({});
            setTaskDialog(true);
          }}
        >
          Create Task
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Typography variant="subtitle2">{task.title}</Typography>
                  {task.ai_generated && (
                    <Chip label="AI Generated" size="small" color="secondary" sx={{ mt: 0.5 }} />
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{task.item_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {task.item_location}
                  </Typography>
                </TableCell>
                <TableCell>{task.task_type}</TableCell>
                <TableCell>
                  <Chip
                    label={task.priority}
                    color={getPriorityColor(task.priority) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.status}
                    color={getStatusColor(task.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setCurrentTask(task);
                      setTaskDialog(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderWarranties = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Warranties</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            // Warranty dialog functionality removed for now
          }}
        >
          Add Warranty
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {warranties.map((warranty) => (
          <Box key={warranty.id} sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6">{warranty.item_name}</Typography>
                  <Chip
                    label={warranty.is_active ? 'Active' : 'Expired'}
                    color={warranty.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {warranty.warranty_type} • {warranty.provider}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Valid until: {new Date(warranty.end_date).toLocaleDateString()}
                  </Typography>
                </Box>
                
                {warranty.coverage_description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {warranty.coverage_description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderCosts = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Maintenance Costs</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            // Cost dialog functionality removed for now
          }}
        >
          Add Cost
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Vendor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {costs.map((cost) => (
              <TableRow key={cost.id}>
                <TableCell>{new Date(cost.cost_date).toLocaleDateString()}</TableCell>
                <TableCell>{cost.item_name}</TableCell>
                <TableCell>{cost.description}</TableCell>
                <TableCell>{cost.cost_type}</TableCell>
                <TableCell>${cost.amount.toLocaleString()}</TableCell>
                <TableCell>{cost.vendor || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🏠 Home Maintenance Tracker
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab icon={<AnalyticsIcon />} label="Dashboard" />
          <Tab icon={<HomeIcon />} label="Home Items" />
          <Tab icon={<TaskIcon />} label="Tasks" />
          <Tab icon={<SecurityIcon />} label="Warranties" />
          <Tab icon={<MoneyIcon />} label="Costs" />
        </Tabs>
      </Paper>

      <TabPanel value={currentTab} index={0}>
        {renderDashboard()}
      </TabPanel>
      
      <TabPanel value={currentTab} index={1}>
        {renderItems()}
      </TabPanel>
      
      <TabPanel value={currentTab} index={2}>
        {renderTasks()}
      </TabPanel>
      
      <TabPanel value={currentTab} index={3}>
        {renderWarranties()}
      </TabPanel>
      
      <TabPanel value={currentTab} index={4}>
        {renderCosts()}
      </TabPanel>

        {/* Item Dialog */}
        <Dialog open={itemDialog} onClose={() => setItemDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {currentItem.id ? 'Edit Home Item' : 'Add Home Item'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <TextField
                  fullWidth
                  label="Name"
                  value={currentItem.name || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                  required
                />
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={currentItem.category || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                    required
                  >
                    {ITEM_CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <TextField
                  fullWidth
                  label="Location"
                  value={currentItem.location || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, location: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Manufacturer"
                  value={currentItem.manufacturer || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, manufacturer: e.target.value })}
                />
              </Box>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={currentItem.description || ''}
                onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
              />
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <TextField
                  fullWidth
                  label="Model Number"
                  value={currentItem.model_number || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, model_number: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Serial Number"
                  value={currentItem.serial_number || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, serial_number: e.target.value })}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <TextField
                  fullWidth
                  label="Estimated Lifespan (years)"
                  type="number"
                  value={currentItem.estimated_lifespan_years || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, estimated_lifespan_years: parseInt(e.target.value) })}
                  sx={{ flex: 1 }}
                />
                <TextField
                  fullWidth
                  label="Replacement Cost"
                  type="number"
                  value={currentItem.replacement_cost || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, replacement_cost: parseFloat(e.target.value) })}
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setItemDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Task Dialog */}
        <Dialog open={taskDialog} onClose={() => setTaskDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {currentTask.id ? 'Edit Task' : 'Create Task'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <FormControl fullWidth>
                  <InputLabel>Home Item</InputLabel>
                  <Select
                    value={currentTask.item_id || ''}
                    onChange={(e) => setCurrentTask({ ...currentTask, item_id: e.target.value as number })}
                    required
                  >
                    {items.map((item) => (
                      <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Task Title"
                  value={currentTask.title || ''}
                  onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
                  required
                />
              </Box>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={currentTask.description || ''}
                onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
              />
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <FormControl fullWidth>
                  <InputLabel>Task Type</InputLabel>
                  <Select
                    value={currentTask.task_type || ''}
                    onChange={(e) => setCurrentTask({ ...currentTask, task_type: e.target.value })}
                  >
                    {TASK_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={currentTask.priority || ''}
                    onChange={(e) => setCurrentTask({ ...currentTask, priority: e.target.value })}
                  >
                    {TASK_PRIORITIES.map((priority) => (
                      <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={currentTask.status || 'Pending'}
                    onChange={(e) => setCurrentTask({ ...currentTask, status: e.target.value })}
                  >
                    {TASK_STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={currentTask.due_date || ''}
                  onChange={(e) => setCurrentTask({ ...currentTask, due_date: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Recurring Interval (days)"
                  type="number"
                  value={currentTask.recurring_interval_days || ''}
                  onChange={(e) => setCurrentTask({ ...currentTask, recurring_interval_days: parseInt(e.target.value) })}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTaskDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveTask} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Photo Dialog */}
        <Dialog open={photoDialog} onClose={() => setPhotoDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload Photo</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPhotoFile(file);
                    const reader = new FileReader();
                    reader.onload = () => setPhotoPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: 'none' }}
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button variant="outlined" component="span" startIcon={<UploadIcon />} fullWidth>
                  Select Photo
                </Button>
              </label>
              
              {photoPreview && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPhotoDialog(false)}>Cancel</Button>
            <Button 
              onClick={handlePhotoUpload} 
              variant="contained" 
              disabled={!photoFile || loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Loading indicator */}
        {loading && (
          <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Snackbars */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError('')} severity="error">
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccess('')} severity="success">
            {success}
          </Alert>
        </Snackbar>
      </Box>
  );
}