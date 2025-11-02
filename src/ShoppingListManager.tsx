/**
 * ShoppingListManager.tsx - Smart Shopping List Generation and Management
 * Generate lists from recipes, integrate with pantry, track purchases
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Stack,
  Divider,
  ListItem,
  ListItemText,
  List,
  ListItemIcon
} from '@mui/material'

import {
  Add as AddIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Restaurant as RestaurantIcon,
  GeneratingTokens as GenerateIcon
} from '@mui/icons-material'

import { decimalToCookingFraction } from './utils/fractionUtils'

// TypeScript interfaces
interface Recipe {
  id: number
  title: string
  servings: number
}

interface ShoppingListItem {
  id?: number
  shopping_list_id?: number
  item_name: string
  quantity: number
  unit: string
  category?: string
  estimated_cost: number
  is_purchased: boolean
  priority?: 'low' | 'medium' | 'high'
  notes?: string
}

interface ShoppingList {
  id?: number
  name: string
  description?: string
  status?: 'active' | 'completed' | 'archived'
  total_estimated_cost: number
  created_at?: string
  updated_at?: string
  items?: ShoppingListItem[]
}

export default function ShoppingListManager() {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null)
  
  // Generation form state
  const [selectedRecipes, setSelectedRecipes] = useState<number[]>([])
  const [servingsMultiplier, setServingsMultiplier] = useState(1)
  const [newListName, setNewListName] = useState('')
  
  // Manual list creation
  const [manualList, setManualList] = useState<ShoppingList>({
    name: '',
    description: '',
    total_estimated_cost: 0,
    status: 'active'
  })

  // Load shopping lists
  const loadShoppingLists = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shopping-lists')
      
      if (!response.ok) {
        throw new Error('Failed to fetch shopping lists')
      }
      
      const data = await response.json()
      setShoppingLists(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load recipes for selection
  const loadRecipes = async () => {
    try {
      const response = await fetch('/api/recipes')
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipes')
      }
      
      const data = await response.json()
      setRecipes(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadShoppingLists()
    loadRecipes()
  }, [])

  // Generate shopping list from recipes
  const handleGenerateList = async () => {
    try {
      if (selectedRecipes.length === 0) {
        setError('Please select at least one recipe')
        return
      }

      if (!newListName.trim()) {
        setError('Please enter a list name')
        return
      }

      const response = await fetch('/api/shopping-lists/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_ids: selectedRecipes,
          servings_multiplier: servingsMultiplier,
          list_name: newListName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate shopping list')
      }

      setSuccess('Shopping list generated successfully!')
      setGenerateDialogOpen(false)
      setSelectedRecipes([])
      setServingsMultiplier(1)
      setNewListName('')
      
      // Refresh the shopping lists after a short delay to ensure dialog closes first
      setTimeout(() => {
        loadShoppingLists()
      }, 100)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Create manual shopping list
  const handleCreateManualList = async () => {
    try {
      if (!manualList.name.trim()) {
        setError('Please enter a list name')
        return
      }

      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualList)
      })

      if (!response.ok) {
        throw new Error('Failed to create shopping list')
      }

      setSuccess('Shopping list created successfully!')
      setCreateDialogOpen(false)
      setManualList({
        name: '',
        description: '',
        total_estimated_cost: 0,
        status: 'active'
      })
      loadShoppingLists()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Load shopping list details
  const loadListDetails = async (listId: number) => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch shopping list details')
      }
      
      const data = await response.json()
      setSelectedList(data)
      setViewDialogOpen(true)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Toggle item purchased status
  const toggleItemPurchased = async (item: ShoppingListItem) => {
    try {
      const response = await fetch(`/api/shopping-lists/${selectedList?.id}/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_purchased: !item.is_purchased })
      })

      if (!response.ok) {
        throw new Error('Failed to update item status')
      }

      // Refresh the list details
      if (selectedList) {
        loadListDetails(selectedList.id!)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Delete shopping list
  const deleteShoppingList = async (listId: number) => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete shopping list')
      }

      setSuccess('Shopping list deleted successfully!')
      loadShoppingLists()
      setViewDialogOpen(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Calculate list progress
  const getListProgress = (list: ShoppingList) => {
    if (!list.items || list.items.length === 0) return 0
    const purchasedCount = list.items.filter(item => item.is_purchased).length
    return Math.round((purchasedCount / list.items.length) * 100)
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'default'
    }
  }

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
        <ShoppingCartIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Shopping Lists
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<GenerateIcon />}
            onClick={() => setGenerateDialogOpen(true)}
          >
            Generate from Recipes
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create List
          </Button>
        </Box>
      </Box>

      {/* Shopping Lists */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {shoppingLists.map((list) => {
          const progress = getListProgress(list)
          const itemCount = list.items?.length || 0
          const purchasedCount = list.items?.filter(item => item.is_purchased).length || 0

          return (
            <Card
              key={list.id}
              sx={{ 
                width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 11px)' },
                minWidth: 300,
                cursor: 'pointer',
                '&:hover': { boxShadow: 4 }
              }}
              onClick={() => loadListDetails(list.id!)}
            >
              <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {list.name}
                  </Typography>
                  {list.status === 'completed' && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="COMPLETED"
                      color="success"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  )}
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteShoppingList(list.id!)
                    }}
                    title="Delete list"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                {/* Description */}
                {list.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {list.description}
                  </Typography>
                )}

                {/* Progress */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Progress: {purchasedCount}/{itemCount} items ({progress}%)
                  </Typography>
                  <Box sx={{ 
                    width: '100%', 
                    height: 8, 
                    backgroundColor: 'grey.300', 
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: progress === 100 ? 'success.main' : 'primary.main',
                      transition: 'width 0.3s ease'
                    }} />
                  </Box>
                </Box>

                {/* Details */}
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip label={list.status || 'active'} size="small" />
                  {list.created_at && (
                    <Chip 
                      label={new Date(list.created_at).toLocaleDateString()} 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </Stack>

                {/* Cost */}
                <Typography variant="h6" color="primary.main" sx={{ textAlign: 'center' }}>
                  Total: ${Number(list.total_estimated_cost || 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          )
        })}
      </Box>

      {shoppingLists.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No shopping lists yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first shopping list or generate one from recipes
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<GenerateIcon />}
              onClick={() => setGenerateDialogOpen(true)}
            >
              Generate from Recipes
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create List
            </Button>
          </Box>
        </Box>
      )}

      {/* Generate from Recipes Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Shopping List from Recipes</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Shopping List Name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              required
            />
            
            <TextField
              label="Recipe Multiplier"
              type="number"
              value={servingsMultiplier}
              onChange={(e) => setServingsMultiplier(parseFloat(e.target.value) || 1)}
              inputProps={{ min: 0.1, step: 0.1 }}
              helperText="1 = full recipe, 2 = double recipe, 0.5 = half recipe"
            />

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Select Recipes ({selectedRecipes.length} selected)
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {recipes.map((recipe) => (
                  <Box key={recipe.id} sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    mb: 1, 
                    p: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}>
                    <Checkbox
                      checked={selectedRecipes.includes(recipe.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecipes([...selectedRecipes, recipe.id])
                        } else {
                          setSelectedRecipes(selectedRecipes.filter(id => id !== recipe.id))
                        }
                      }}
                      sx={{ mt: 0, mr: 1 }}
                    />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ 
                        wordWrap: 'break-word',
                        lineHeight: 1.3,
                        fontWeight: selectedRecipes.includes(recipe.id) ? 600 : 400
                      }}>
                        {recipe.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Serves {recipe.servings}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerateList} variant="contained">
            Generate List
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Manual List Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Shopping List</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="List Name"
              value={manualList.name}
              onChange={(e) => setManualList({ ...manualList, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={manualList.description}
              onChange={(e) => setManualList({ ...manualList, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateManualList} variant="contained">
            Create List
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Shopping List Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {selectedList?.name}
            {selectedList?.status === 'completed' && (
              <Chip icon={<CheckCircleIcon />} label="COMPLETED" color="success" />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedList && (
            <Box>
              {/* Info */}
              <Box sx={{ mb: 3 }}>
                {selectedList.description && (
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {selectedList.description}
                  </Typography>
                )}
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Chip label={`Status: ${selectedList.status || 'active'}`} />
                  {selectedList.created_at && (
                    <Chip label={`Created: ${new Date(selectedList.created_at).toLocaleDateString()}`} />
                  )}
                </Stack>
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Typography variant="h6" color="primary.main">
                    Estimated Total: ${Number(selectedList.total_estimated_cost || 0).toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Items */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Shopping Items ({selectedList.items?.length || 0})
              </Typography>
              
              {selectedList.items && selectedList.items.length > 0 ? (
                <List>
                  {selectedList.items.map((item, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        backgroundColor: item.is_purchased ? 'success.50' : 'background.paper'
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          checked={item.is_purchased}
                          onChange={() => toggleItemPurchased(item)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography
                              variant="body1"
                              sx={{
                                textDecoration: item.is_purchased ? 'line-through' : 'none',
                                opacity: item.is_purchased ? 0.7 : 1
                              }}
                            >
                              <strong>{decimalToCookingFraction(item.quantity)} {item.unit}</strong> {item.item_name}
                            </Typography>
                            {item.priority && (
                              <Chip
                                label={item.priority.toUpperCase()}
                                size="small"
                                color={getPriorityColor(item.priority) as any}
                              />
                            )}
                            {item.category && (
                              <Chip label={item.category} size="small" variant="outlined" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <Typography variant="caption" color="primary.main">
                              ${Number(item.estimated_cost || 0).toFixed(2)}
                            </Typography>
                            {item.notes && (
                              <Typography variant="caption" color="text.secondary">
                                {item.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No items in this shopping list
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
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