/**
 * RecipeManager.tsx - AI-Powered Smart Recipe Management System
 */

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActions,
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
  Fab
} from '@mui/material'

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Restaurant as RestaurantIcon
} from '@mui/icons-material'

// Import fraction utility
import { decimalToCookingFraction } from './utils/fractionUtils'

// TypeScript interfaces
interface Ingredient {
  id?: number
  ingredient_name: string
  quantity: number
  unit: string
  notes?: string
}

interface Recipe {
  id?: number
  title: string
  description?: string
  cuisine_type?: string
  meal_type?: string
  prep_time_minutes?: number
  cook_time_minutes?: number
  total_time_minutes?: number
  servings?: number
  difficulty_level?: string
  instructions?: string
  tags?: string
  is_favorite?: boolean
  rating?: number
  created_at?: string
  updated_at?: string
  ingredients?: Ingredient[]
}

// Main component
export default function RecipeManager() {
  // State for recipes
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // State for search
  const [searchTerm, setSearchTerm] = useState('')
  
  // State for UI
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // State for recipe form
  const [recipeForm, setRecipeForm] = useState<Recipe>({
    title: '',
    description: '',
    cuisine_type: '',
    meal_type: 'dinner',
    prep_time_minutes: 0,
    cook_time_minutes: 0,
    servings: 4,
    difficulty_level: 'medium',
    instructions: '',
    tags: '',
    is_favorite: false,
    rating: 0,
    ingredients: []
  })
  
  // State for ingredients management
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient>({
    ingredient_name: '',
    quantity: 1,
    unit: 'cup',
    notes: ''
  })
  
  // State for import functionality
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  
  // Load data on component mount
  useEffect(() => {
    loadRecipes()
  }, [])
  
  // API Functions
  const loadRecipes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/recipes?${params}`)
      if (!response.ok) throw new Error('Failed to load recipes')
      
      const data = await response.json()
      setRecipes(data)
    } catch (err) {
      setError(`Failed to load recipes: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }
  
  const saveRecipe = async () => {
    try {
      setLoading(true)
      const method = isEditMode ? 'PUT' : 'POST'
      const url = isEditMode ? `/api/recipes/${selectedRecipe?.id}` : '/api/recipes'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeForm)
      })
      
      if (!response.ok) throw new Error('Failed to save recipe')
      
      setSuccess(isEditMode ? 'Recipe updated successfully!' : 'Recipe created successfully!')
      closeRecipeDialog()
      loadRecipes()
    } catch (err) {
      setError(`Failed to save recipe: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }
  
  const deleteRecipe = async (id: number) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete recipe')
      
      // Close any open dialogs for this recipe
      if (selectedRecipe?.id === id) {
        setSelectedRecipe(null)
        setIsViewDialogOpen(false)
        setIsRecipeDialogOpen(false)
      }
      
      setSuccess('Recipe deleted successfully!')
      loadRecipes()
    } catch (err) {
      setError(`Failed to delete recipe: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }
  
  const toggleFavorite = async (recipe: Recipe) => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...recipe, is_favorite: !recipe.is_favorite })
      })
      
      if (!response.ok) throw new Error('Failed to update favorite')
      
      loadRecipes()
    } catch (err) {
      setError(`Failed to update favorite: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }
  
  // UI Helper Functions
  const openRecipeDialog = (recipe?: Recipe) => {
    if (recipe) {
      console.log('Opening recipe dialog with:', recipe) // Debug log
      setSelectedRecipe(recipe)
      setRecipeForm({
        ...recipe,
        // Ensure all fields have non-null values for controlled inputs
        title: recipe.title || '',
        description: recipe.description || '',
        cuisine_type: recipe.cuisine_type || '',
        meal_type: recipe.meal_type || 'dinner',
        prep_time_minutes: recipe.prep_time_minutes || 0,
        cook_time_minutes: recipe.cook_time_minutes || 0,
        servings: recipe.servings || 4,
        difficulty_level: recipe.difficulty_level || 'medium',
        instructions: recipe.instructions || '',
        tags: recipe.tags || '',
        is_favorite: recipe.is_favorite || false,
        rating: recipe.rating || 0,
        ingredients: recipe.ingredients || []
      })
      setIsEditMode(true)
    } else {
      setSelectedRecipe(null)
      setRecipeForm({
        title: '',
        description: '',
        cuisine_type: '',
        meal_type: 'dinner',
        prep_time_minutes: 0,
        cook_time_minutes: 0,
        servings: 4,
        difficulty_level: 'medium',
        instructions: '',
        tags: '',
        is_favorite: false,
        rating: 0,
        ingredients: []
      })
      setIsEditMode(false)
    }
    setIsRecipeDialogOpen(true)
  }
  
  const closeRecipeDialog = () => {
    setIsRecipeDialogOpen(false)
    setSelectedRecipe(null)
    setIsEditMode(false)
  }

  const viewRecipe = async (recipe: Recipe) => {
    try {
      // Fetch full recipe details including ingredients
      const response = await fetch(`/api/recipes/${recipe.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Recipe not found. It may have been deleted.')
          loadRecipes() // Refresh the list
          return
        }
        throw new Error('Failed to load recipe details')
      }
      
      const fullRecipe = await response.json()
      setSelectedRecipe(fullRecipe)
      setIsViewDialogOpen(true)
    } catch (err) {
      setError(`Failed to load recipe: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const closeViewDialog = () => {
    setIsViewDialogOpen(false)
    setSelectedRecipe(null)
  }

  // Ingredient helper functions
  const addIngredient = () => {
    if (!currentIngredient.ingredient_name.trim() || currentIngredient.quantity <= 0) {
      setError('Please enter ingredient name and quantity')
      return
    }
    
    const newIngredients = [...(recipeForm.ingredients || []), { ...currentIngredient }]
    setRecipeForm({ ...recipeForm, ingredients: newIngredients })
    setCurrentIngredient({
      ingredient_name: '',
      quantity: 1,
      unit: 'cup',
      notes: ''
    })
  }

  const removeIngredient = (index: number) => {
    const newIngredients = (recipeForm.ingredients || []).filter((_, i) => i !== index)
    setRecipeForm({ ...recipeForm, ingredients: newIngredients })
  }

  // Import functionality
  const importRecipeFromUrl = async () => {
    if (!importUrl.trim()) {
      setError('Please enter a URL')
      return
    }

    try {
      setIsImporting(true)
      
      // Call new recipe extraction endpoint
      const response = await fetch('/api/recipes/extract-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      })

      if (!response.ok) throw new Error('Failed to extract recipe from URL')

      const extractedRecipe = await response.json()
      
      // Close import dialog and open recipe dialog with extracted data
      setIsImportDialogOpen(false)
      setImportUrl('')
      
      // Set the form with extracted data
      setRecipeForm({
        ...extractedRecipe,
        // Ensure all fields have non-null values
        title: extractedRecipe.title || '',
        description: extractedRecipe.description || '',
        cuisine_type: extractedRecipe.cuisine_type || '',
        meal_type: extractedRecipe.meal_type || 'dinner',
        prep_time_minutes: extractedRecipe.prep_time_minutes || 0,
        cook_time_minutes: extractedRecipe.cook_time_minutes || 0,
        servings: extractedRecipe.servings || 4,
        difficulty_level: extractedRecipe.difficulty_level || 'medium',
        instructions: extractedRecipe.instructions || '',
        tags: extractedRecipe.tags || '',
        is_favorite: false,
        rating: 0,
        ingredients: extractedRecipe.ingredients || []
      })
      
      setIsEditMode(false)
      setIsRecipeDialogOpen(true)
      setSuccess('Recipe extracted successfully! Review and save.')
      
    } catch (err) {
      setError(`Failed to import recipe: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsImporting(false)
    }
  }

  const closeImportDialog = () => {
    setIsImportDialogOpen(false)
    setImportUrl('')
    setIsImporting(false)
  }
  
  // Filter recipes based on search
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = searchTerm === '' || 
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.tags?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <RestaurantIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Recipe Manager
          </Typography>
          <Chip 
            label="AI-Powered" 
            color="secondary" 
            variant="outlined"
          />
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsImportDialogOpen(true)}
          sx={{
            backgroundColor: '#d32f2f',
            color: 'white',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#b71c1c'
            }
          }}
        >
          Import from website
        </Button>
      </Box>
      
      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 400 }}
        />
        <Button
          variant="outlined"
          onClick={loadRecipes}
          sx={{ ml: 2 }}
        >
          Search
        </Button>
      </Box>
      
      {/* Recipe Results Count */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        {loading ? 'Loading...' : `Found ${filteredRecipes.length} recipe${filteredRecipes.length !== 1 ? 's' : ''}`}
      </Typography>
      
      {/* Recipe Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: 3 
      }}>
        {filteredRecipes.map((recipe) => (
          <Card 
            key={recipe.id}
            onClick={() => viewRecipe(recipe)}
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                  {recipe.title}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => toggleFavorite(recipe)}
                  color="secondary"
                >
                  {recipe.is_favorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {recipe.description}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {recipe.cuisine_type && (
                  <Chip size="small" label={recipe.cuisine_type} />
                )}
                {recipe.meal_type && (
                  <Chip size="small" label={recipe.meal_type} variant="outlined" />
                )}
                {recipe.difficulty_level && (
                  <Chip
                    size="small"
                    label={recipe.difficulty_level}
                    color={
                      recipe.difficulty_level === 'easy' ? 'success' :
                      recipe.difficulty_level === 'hard' ? 'error' : 'warning'
                    }
                  />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TimeIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {recipe.total_time_minutes || ((recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0))}m
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="body2">{recipe.servings}</Typography>
                </Box>
              </Box>
            </CardContent>
            
            <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
              <Box>
                <IconButton
                  size="small"
                  onClick={() => openRecipeDialog(recipe)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => deleteRecipe(recipe.id!)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardActions>
          </Card>
        ))}
      </Box>
      
      {/* Add Recipe FAB */}
      <Fab
        color="primary"
        aria-label="add recipe"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
        onClick={() => openRecipeDialog()}
      >
        <AddIcon />
      </Fab>
      
      {/* Recipe Dialog */}
      <Dialog
        open={isRecipeDialogOpen}
        onClose={closeRecipeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditMode ? 'Edit Recipe' : 'Add New Recipe'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Recipe Title"
              value={recipeForm.title}
              onChange={(e) => setRecipeForm({ ...recipeForm, title: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={recipeForm.description}
              onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Prep Time (minutes)"
                type="number"
                value={recipeForm.prep_time_minutes}
                onChange={(e) => setRecipeForm({ ...recipeForm, prep_time_minutes: parseInt(e.target.value) || 0 })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Cook Time (minutes)"
                type="number"
                value={recipeForm.cook_time_minutes}
                onChange={(e) => setRecipeForm({ ...recipeForm, cook_time_minutes: parseInt(e.target.value) || 0 })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Servings"
                type="number"
                value={recipeForm.servings}
                onChange={(e) => setRecipeForm({ ...recipeForm, servings: parseInt(e.target.value) || 1 })}
                sx={{ flex: 1 }}
              />
            </Box>
            
            {/* Ingredients Section */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Ingredients
              </Typography>
              
              {/* Add Ingredient Form */}
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="Ingredient Name"
                    value={currentIngredient.ingredient_name}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, ingredient_name: e.target.value })}
                    sx={{ flex: 2 }}
                  />
                  <TextField
                    label="Quantity"
                    type="number"
                    value={currentIngredient.quantity}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, quantity: parseFloat(e.target.value) || 0 })}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Unit"
                    value={currentIngredient.unit}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, unit: e.target.value })}
                    sx={{ flex: 1 }}
                    placeholder="cup, tbsp, oz"
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label="Notes (optional)"
                    value={currentIngredient.notes}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, notes: e.target.value })}
                    sx={{ flex: 1 }}
                    size="small"
                  />
                  <Button 
                    variant="outlined" 
                    onClick={addIngredient}
                    sx={{ minWidth: 'auto' }}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
              
              {/* Ingredients List */}
              {recipeForm.ingredients && recipeForm.ingredients.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Recipe Ingredients ({recipeForm.ingredients.length})
                  </Typography>
                  {recipeForm.ingredients.map((ingredient, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 1, 
                        border: '1px solid #f0f0f0', 
                        borderRadius: 1, 
                        mb: 1,
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <Typography variant="body2">
                        <strong>{decimalToCookingFraction(ingredient.quantity)} {ingredient.unit}</strong> {ingredient.ingredient_name}
                        {ingredient.notes && ` (${ingredient.notes})`}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => removeIngredient(index)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            
            <TextField
              fullWidth
              label="Instructions"
              value={recipeForm.instructions}
              onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
              multiline
              rows={4}
              required
            />
            
            <TextField
              fullWidth
              label="Tags (comma-separated)"
              value={recipeForm.tags}
              onChange={(e) => setRecipeForm({ ...recipeForm, tags: e.target.value })}
              placeholder="pasta, italian, comfort-food"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRecipeDialog}>Cancel</Button>
          <Button onClick={saveRecipe} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Save Recipe'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Recipe Dialog */}
      <Dialog
        open={isViewDialogOpen}
        onClose={closeViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {selectedRecipe?.title}
          <Box>
            <IconButton onClick={() => {
              closeViewDialog()
              openRecipeDialog(selectedRecipe || undefined)
            }}>
              <EditIcon />
            </IconButton>
            <IconButton 
              onClick={() => selectedRecipe?.id && deleteRecipe(selectedRecipe.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRecipe && (
            <Box sx={{ mt: 2 }}>
              {/* Recipe Info */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                {selectedRecipe.prep_time_minutes && (
                  <Chip 
                    icon={<TimeIcon />} 
                    label={`Prep: ${selectedRecipe.prep_time_minutes}min`} 
                    size="small" 
                  />
                )}
                {selectedRecipe.cook_time_minutes && (
                  <Chip 
                    icon={<TimeIcon />} 
                    label={`Cook: ${selectedRecipe.cook_time_minutes}min`} 
                    size="small" 
                  />
                )}
                {selectedRecipe.servings && (
                  <Chip 
                    icon={<PeopleIcon />} 
                    label={`Serves ${selectedRecipe.servings}`} 
                    size="small" 
                  />
                )}
                {selectedRecipe.difficulty_level && (
                  <Chip
                    label={selectedRecipe.difficulty_level}
                    size="small"
                    color={
                      selectedRecipe.difficulty_level === 'easy' ? 'success' :
                      selectedRecipe.difficulty_level === 'hard' ? 'error' : 'warning'
                    }
                  />
                )}
              </Box>

              {/* Description */}
              {selectedRecipe.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Description</Typography>
                  <Typography variant="body1">{selectedRecipe.description}</Typography>
                </Box>
              )}

              {/* Ingredients */}
              {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Ingredients ({selectedRecipe.ingredients.length})
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <Typography key={index} variant="body1" sx={{ mb: 0.5 }}>
                        • <strong>{decimalToCookingFraction(ingredient.quantity)} {ingredient.unit}</strong> {ingredient.ingredient_name}
                        {ingredient.notes && ` (${ingredient.notes})`}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Instructions */}
              {selectedRecipe.instructions && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Instructions</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedRecipe.instructions}
                  </Typography>
                </Box>
              )}

              {/* Tags */}
              {selectedRecipe.tags && (
                <Box>
                  <Typography variant="h6" gutterBottom>Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedRecipe.tags.split(',').map((tag, index) => (
                      <Chip key={index} label={tag.trim()} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Import Recipe Dialog */}
      <Dialog
        open={isImportDialogOpen}
        onClose={closeImportDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Recipe from Website</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Recipe URL"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://example.com/recipe"
              helperText="Enter the URL of a recipe from any website. AI will extract the recipe details for you."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImportDialog} disabled={isImporting}>
            Cancel
          </Button>
          <Button 
            onClick={importRecipeFromUrl} 
            variant="contained" 
            disabled={isImporting || !importUrl.trim()}
          >
            {isImporting ? <CircularProgress size={20} /> : 'Extract Recipe'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  )
}