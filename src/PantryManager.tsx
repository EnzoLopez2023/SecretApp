/**
 * PantryManager.tsx - Smart Kitchen Pantry Inventory Management
 * Track ingredients, quantities, expiry dates, and manage restocking
 */

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  LinearProgress
} from '@mui/material'

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Kitchen as KitchenIcon,
  ShoppingCart as ShoppingCartIcon,
  Category as CategoryIcon
} from '@mui/icons-material'

import { decimalToCookingFraction } from './utils/fractionUtils'

// TypeScript interfaces
interface PantryItem {
  id?: number
  item_name: string
  category: string
  current_quantity: number
  unit: string
  minimum_quantity: number
  purchase_location?: string
  average_price: number
  expiry_date?: string
  notes?: string
  last_purchased?: string
  is_staple: boolean
  created_at?: string
  updated_at?: string
}

const FOOD_CATEGORIES = [
  'Dairy', 'Meat', 'Vegetables', 'Fruits', 'Grains', 'Spices', 'Oils', 
  'Condiments', 'Baking', 'Canned Goods', 'Frozen', 'Snacks', 'Beverages', 'Other'
]

const COMMON_UNITS = [
  'cups', 'tbsp', 'tsp', 'lbs', 'oz', 'g', 'kg', 'ml', 'l', 'pieces', 'cloves', 'whole'
]

export default function PantryManager() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<PantryItem | null>(null)
  
  // Filter states
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All') // All, Low Stock, Expired, Staples
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form state
  const [currentItem, setCurrentItem] = useState<PantryItem>({
    item_name: '',
    category: 'Other',
    current_quantity: 0,
    unit: 'pieces',
    minimum_quantity: 0,
    purchase_location: '',
    average_price: 0,
    expiry_date: '',
    notes: '',
    is_staple: false
  })

  // Load pantry items
  const loadPantryItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pantry')
      
      if (!response.ok) {
        throw new Error('Failed to fetch pantry items')
      }
      
      const data = await response.json()
      setPantryItems(data)
      setFilteredItems(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPantryItems()
  }, [])

  // Filter items based on search and filters
  useEffect(() => {
    let filtered = pantryItems.filter(item => {
      const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory
      
      let matchesStatus = true
      if (filterStatus === 'Low Stock') {
        matchesStatus = item.current_quantity <= item.minimum_quantity
      } else if (filterStatus === 'Expired') {
        matchesStatus = item.expiry_date ? new Date(item.expiry_date) < new Date() : false
      } else if (filterStatus === 'Staples') {
        matchesStatus = item.is_staple
      }
      
      return matchesSearch && matchesCategory && matchesStatus
    })
    
    setFilteredItems(filtered)
  }, [pantryItems, searchTerm, filterCategory, filterStatus])

  // Add or update pantry item
  const handleSaveItem = async () => {
    try {
      if (!currentItem.item_name.trim() || currentItem.current_quantity < 0) {
        setError('Please enter item name and valid quantity')
        return
      }

      const method = editingItem ? 'PUT' : 'POST'
      const url = editingItem ? `/api/pantry/${editingItem.id}` : '/api/pantry'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentItem)
      })

      if (!response.ok) {
        throw new Error('Failed to save pantry item')
      }

      setSuccess(editingItem ? 'Pantry item updated!' : 'Pantry item added!')
      setDialogOpen(false)
      setEditingItem(null)
      setCurrentItem({
        item_name: '',
        category: 'Other',
        current_quantity: 0,
        unit: 'pieces',
        minimum_quantity: 0,
        purchase_location: '',
        average_price: 0,
        expiry_date: '',
        notes: '',
        is_staple: false
      })
      loadPantryItems()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Delete pantry item
  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`/api/pantry/${itemToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete pantry item')
      }

      setSuccess('Pantry item deleted!')
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      loadPantryItems()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Update quantity only
  const handleUpdateQuantity = async (item: PantryItem, newQuantity: number) => {
    try {
      const response = await fetch(`/api/pantry/${item.id}/quantity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_quantity: newQuantity })
      })

      if (!response.ok) {
        throw new Error('Failed to update quantity')
      }

      loadPantryItems()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Open edit dialog
  const openEditDialog = (item: PantryItem) => {
    setEditingItem(item)
    setCurrentItem({
      ...item,
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : ''
    })
    setDialogOpen(true)
  }

  // Get item status
  const getItemStatus = (item: PantryItem) => {
    const isLowStock = item.current_quantity <= item.minimum_quantity
    const isExpired = item.expiry_date ? new Date(item.expiry_date) < new Date() : false
    
    if (isExpired) return { status: 'expired', color: 'error', icon: <WarningIcon /> }
    if (isLowStock) return { status: 'low', color: 'warning', icon: <WarningIcon /> }
    return { status: 'good', color: 'success', icon: <CheckCircleIcon /> }
  }

  // Get stock level percentage
  const getStockLevel = (item: PantryItem) => {
    if (item.minimum_quantity === 0) return 100
    return Math.min((item.current_quantity / item.minimum_quantity) * 100, 100)
  }

  // Count items by status
  const lowStockCount = pantryItems.filter(item => item.current_quantity <= item.minimum_quantity).length
  const expiredCount = pantryItems.filter(item => 
    item.expiry_date ? new Date(item.expiry_date) < new Date() : false
  ).length

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <KitchenIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Pantry Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Item
        </Button>
      </Box>

      {/* Status Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6">{pantryItems.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Items</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={lowStockCount} color="warning">
                <Typography variant="h6">{lowStockCount}</Typography>
              </Badge>
              <Typography variant="body2" color="text.secondary">Low Stock</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={expiredCount} color="error">
                <Typography variant="h6">{expiredCount}</Typography>
              </Badge>
              <Typography variant="body2" color="text.secondary">Expired</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6">
                {pantryItems.filter(item => item.is_staple).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Staples</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="All">All Categories</MenuItem>
                  {FOOD_CATEGORIES.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="All">All Items</MenuItem>
                  <MenuItem value="Low Stock">Low Stock</MenuItem>
                  <MenuItem value="Expired">Expired</MenuItem>
                  <MenuItem value="Staples">Staples Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pantry Items Grid */}
      <Grid container spacing={2}>
        {filteredItems.map((item) => {
          const status = getItemStatus(item)
          const stockLevel = getStockLevel(item)
          
          return (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card sx={{ 
                height: '100%',
                border: status.status === 'expired' ? '2px solid' : '1px solid',
                borderColor: status.status === 'expired' ? 'error.main' : 'divider'
              }}>
                <CardContent>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      {item.item_name}
                    </Typography>
                    <Chip
                      icon={status.icon}
                      label={status.status.toUpperCase()}
                      color={status.color as any}
                      size="small"
                    />
                  </Box>

                  {/* Quantity and Stock Level */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>{decimalToCookingFraction(item.current_quantity)} {item.unit}</strong>
                      {item.minimum_quantity > 0 && (
                        <span style={{ color: '#666' }}>
                          {' '}(min: {decimalToCookingFraction(item.minimum_quantity)})
                        </span>
                      )}
                    </Typography>
                    {item.minimum_quantity > 0 && (
                      <LinearProgress
                        variant="determinate"
                        value={stockLevel}
                        color={stockLevel < 50 ? 'warning' : 'success'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    )}
                  </Box>

                  {/* Details */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      icon={<CategoryIcon />}
                      label={item.category}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    {item.is_staple && (
                      <Chip
                        label="Staple"
                        size="small"
                        color="primary"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    )}
                    {item.expiry_date && (
                      <Typography variant="caption" color="text.secondary">
                        Expires: {new Date(item.expiry_date).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleUpdateQuantity(item, Math.max(0, item.current_quantity - 1))}
                        disabled={item.current_quantity <= 0}
                      >
                        -
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleUpdateQuantity(item, item.current_quantity + 1)}
                      >
                        +
                      </IconButton>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(item)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setItemToDelete(item)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {filteredItems.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <KitchenIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {pantryItems.length === 0 ? 'Your pantry is empty' : 'No items match your filters'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {pantryItems.length === 0 ? 'Add your first pantry item to get started' : 'Try adjusting your search or filters'}
          </Typography>
          {pantryItems.length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Add First Item
            </Button>
          )}
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Pantry Item' : 'Add Pantry Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Name"
                value={currentItem.item_name}
                onChange={(e) => setCurrentItem({ ...currentItem, item_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={currentItem.category}
                  onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                  label="Category"
                >
                  {FOOD_CATEGORIES.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Current Quantity"
                type="number"
                value={currentItem.current_quantity}
                onChange={(e) => setCurrentItem({ ...currentItem, current_quantity: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={currentItem.unit}
                  onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                  label="Unit"
                >
                  {COMMON_UNITS.map(unit => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Minimum Quantity"
                type="number"
                value={currentItem.minimum_quantity}
                onChange={(e) => setCurrentItem({ ...currentItem, minimum_quantity: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Purchase Location"
                value={currentItem.purchase_location}
                onChange={(e) => setCurrentItem({ ...currentItem, purchase_location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Average Price"
                type="number"
                value={currentItem.average_price}
                onChange={(e) => setCurrentItem({ ...currentItem, average_price: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                value={currentItem.expiry_date}
                onChange={(e) => setCurrentItem({ ...currentItem, expiry_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Is Staple Item?</InputLabel>
                <Select
                  value={currentItem.is_staple ? 'yes' : 'no'}
                  onChange={(e) => setCurrentItem({ ...currentItem, is_staple: e.target.value === 'yes' })}
                  label="Is Staple Item?"
                >
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={currentItem.notes}
                onChange={(e) => setCurrentItem({ ...currentItem, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained">
            {editingItem ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Pantry Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{itemToDelete?.item_name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteItem} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  )
}