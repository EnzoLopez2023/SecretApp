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
  Fab,
  Link
} from '@mui/material'

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Restaurant as RestaurantIcon,
  DragIndicator as DragIndicatorIcon
} from '@mui/icons-material'

// Import drag-and-drop utilities
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
  notes?: string
  source_url?: string
  tags?: string
  is_favorite?: boolean
  rating?: number
  images?: string[]
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
    notes: '',
    source_url: '',
    tags: '',
    is_favorite: false,
    rating: 0,
    images: [],
    ingredients: []
  })
  
  // State for ingredients management
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient>({
    ingredient_name: '',
    quantity: 1,
    unit: 'cup',
    notes: ''
  })
  
  // State for inline ingredient editing
  const [editingIngredientIndex, setEditingIngredientIndex] = useState<number | null>(null)
  
  // State for import functionality
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [isTextImportDialogOpen, setIsTextImportDialogOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [isImportingText, setIsImportingText] = useState(false)
  
  // State for image upload
  const [uploadingImages, setUploadingImages] = useState(false)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle recipe reordering (drag-and-drop in main grid)
  const handleRecipeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setRecipes((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Handle ingredient reordering (drag-and-drop in edit dialog)
  const handleIngredientDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setRecipeForm((prev) => {
        const ingredients = prev.ingredients || []
        const oldIndex = ingredients.findIndex((_, idx) => idx === active.id)
        const newIndex = ingredients.findIndex((_, idx) => idx === over.id)
        return {
          ...prev,
          ingredients: arrayMove(ingredients, oldIndex, newIndex)
        }
      })
    }
  }

  const parseQuantity = (value: unknown): number => {
    if (typeof value === 'number' && !Number.isNaN(value)) return value
    if (typeof value !== 'string') return 0
    const trimmed = value.trim()
    if (!trimmed) return 0

    const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/)
    if (mixedMatch) {
      const whole = parseInt(mixedMatch[1])
      const numerator = parseInt(mixedMatch[2])
      const denominator = parseInt(mixedMatch[3]) || 1
      return whole + numerator / denominator
    }

    const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/)
    if (fractionMatch) {
      const numerator = parseInt(fractionMatch[1])
      const denominator = parseInt(fractionMatch[2]) || 1
      return numerator / denominator
    }

    const normalized = trimmed.replace(/[^0-9.\-]/g, '')
    const parsed = parseFloat(normalized)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const handleExtractedRecipe = (extractedRecipe: any, successMessage: string) => {
    if (!extractedRecipe) {
      throw new Error('No recipe data returned')
    }

    const instructions = Array.isArray(extractedRecipe.instructions)
      ? extractedRecipe.instructions.join('\n')
      : (extractedRecipe.instructions || '')

    const normalizedIngredients: Ingredient[] = Array.isArray(extractedRecipe.ingredients)
      ? extractedRecipe.ingredients
          .map((ingredient: any) => ({
            ingredient_name: ingredient?.ingredient_name || ingredient?.name || ingredient?.item || '',
            quantity: parseQuantity(ingredient?.quantity),
            unit: ingredient?.unit || ingredient?.measure || '',
            notes: ingredient?.notes || ''
          }))
          .filter((ingredient: Ingredient) => ingredient.ingredient_name.trim().length > 0)
      : []

    setRecipeForm({
      title: extractedRecipe.title || '',
      description: extractedRecipe.description || '',
      cuisine_type: extractedRecipe.cuisine_type || '',
      meal_type: extractedRecipe.meal_type || 'dinner',
      prep_time_minutes: typeof extractedRecipe.prep_time_minutes === 'number' ? extractedRecipe.prep_time_minutes : 0,
      cook_time_minutes: typeof extractedRecipe.cook_time_minutes === 'number' ? extractedRecipe.cook_time_minutes : 0,
      servings: typeof extractedRecipe.servings === 'number' ? extractedRecipe.servings : 4,
      difficulty_level: extractedRecipe.difficulty_level || 'medium',
      instructions,
      notes: extractedRecipe.notes || '',
      tags: extractedRecipe.tags || '',
      is_favorite: false,
      rating: 0,
      images: [],
      ingredients: normalizedIngredients
    })

    setIsEditMode(false)
    setIsRecipeDialogOpen(true)
    setSuccess(successMessage)
  }
  
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
      
      // First save the recipe
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeForm)
      })
      
      if (!response.ok) throw new Error('Failed to save recipe')
      
      const result = await response.json()
      const recipeId = isEditMode ? selectedRecipe?.id : result.id
      
      // Upload any base64 images (newly added images from file upload)
      if (recipeForm.images && recipeForm.images.length > 0) {
        const uploadedImageUrls: string[] = []
        
        for (const imageData of recipeForm.images) {
          // Check if it's a base64 image (starts with data:)
          if (imageData.startsWith('data:')) {
            // Extract file info
            const matches = imageData.match(/^data:(.+?);base64,(.*)$/)
            if (matches) {
              const fileType = matches[1]
              const base64Data = matches[2]
              const fileName = `recipe-${recipeId}-${Date.now()}.${fileType.split('/')[1]}`
              
              // Upload image to server
              console.log(`Uploading image to /api/recipes/${recipeId}/images`)
              const uploadResponse = await fetch(`/api/recipes/${recipeId}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileName,
                  fileData: base64Data,
                  fileType
                })
              })
              
              console.log(`Upload response status: ${uploadResponse.status}`)
              
              if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json()
                console.log('Upload result:', uploadResult)
                uploadedImageUrls.push(uploadResult.imageUrl)
              } else {
                const errorText = await uploadResponse.text()
                console.error(`Failed to upload image: ${uploadResponse.status} - ${errorText}`)
                throw new Error(`Image upload failed: ${uploadResponse.status}`)
              }
            }
          } else {
            // It's already a URL, keep it
            uploadedImageUrls.push(imageData)
          }
        }
        
        // Update recipe with uploaded image URLs
        if (uploadedImageUrls.length > 0) {
          await fetch(`/api/recipes/${recipeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...recipeForm,
              images: uploadedImageUrls
            })
          })
        }
      }
      
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
        notes: recipe.notes || '',
        tags: recipe.tags || '',
        is_favorite: recipe.is_favorite || false,
        rating: recipe.rating || 0,
        images: recipe.images || [],
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
        notes: '',
        tags: '',
        is_favorite: false,
        rating: 0,
        images: [],
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
    setEditingIngredientIndex(null)
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...(recipeForm.ingredients || [])]
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value
    }
    setRecipeForm({ ...recipeForm, ingredients: newIngredients })
  }

  const startEditingIngredient = (index: number) => {
    setEditingIngredientIndex(index)
  }

  const stopEditingIngredient = () => {
    setEditingIngredientIndex(null)
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

      // Parse response even if not ok to get detailed error
      const extractedRecipe = await response.json()

      if (!response.ok || extractedRecipe.error) {
        const errorMessage = extractedRecipe.error || 'Failed to extract recipe from URL'
        
        // Check if it's a bot protection error and suggest text import
        if (errorMessage.includes('403') || errorMessage.includes('blocked') || errorMessage.includes('Forbidden') || errorMessage.includes('bot protection')) {
          setError(`❌ ${errorMessage}\n\n💡 Tip: Try the "Import from text" button instead!\n\n1. Open the recipe URL in your browser\n2. Copy the recipe text from the page\n3. Click "Import from text" and paste it here`)
        } else {
          setError(`Failed to import recipe: ${errorMessage}`)
        }
        setIsImporting(false)
        return
      }
      
      // Close import dialog and open recipe dialog with extracted data
      setIsImportDialogOpen(false)
      setImportUrl('')

      handleExtractedRecipe(extractedRecipe, 'Recipe extracted successfully! Review and save.')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      // Add helpful tip for URL import failures
      if (errorMsg.includes('403') || errorMsg.includes('blocked') || errorMsg.includes('Forbidden') || errorMsg.includes('bot protection')) {
        setError(`❌ Website blocked the request (bot protection detected)\n\n💡 Try "Import from text" instead:\n\n1. Open the recipe in your browser\n2. Copy the recipe text\n3. Use "Import from text" button and paste it here`)
      } else {
        setError(`Failed to import recipe: ${errorMsg}`)
      }
    } finally {
      setIsImporting(false)
    }
  }

  const closeImportDialog = () => {
    setIsImportDialogOpen(false)
    setImportUrl('')
    setIsImporting(false)
  }

  const importRecipeFromText = async () => {
    if (!importText.trim()) {
      setError('Please paste the recipe text')
      return
    }

    try {
      setIsImportingText(true)

      const response = await fetch('/api/recipes/extract-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_text: importText })
      })

      if (!response.ok) throw new Error('Failed to analyze recipe text')

      const extractedRecipe = await response.json()

      if (extractedRecipe.error) {
        throw new Error(extractedRecipe.error)
      }

      setIsTextImportDialogOpen(false)
      setImportText('')

      handleExtractedRecipe(extractedRecipe, 'Recipe parsed successfully! Review and save.')
    } catch (err) {
      setError(`Failed to import recipe text: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsImportingText(false)
    }
  }

  const closeTextImportDialog = () => {
    setIsTextImportDialogOpen(false)
    setImportText('')
    setIsImportingText(false)
  }
  
  // Handle image file upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploadingImages(true)
    try {
      const imageUrls: string[] = []
      
      for (const file of files) {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        
        // Create a data URL for preview (temporary - will be replaced with uploaded URL after save)
        imageUrls.push(base64)
      }
      
      setRecipeForm(prev => ({
        ...prev,
        images: [...(prev.images || []), ...imageUrls]
      }))
    } catch (err) {
      setError('Failed to process images')
    } finally {
      setUploadingImages(false)
    }
  }
  
  // Filter recipes based on search
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = searchTerm === '' || 
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.tags?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  // Sortable Recipe Card Component
  function SortableRecipeCard({ recipe }: { recipe: Recipe }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: recipe.id! })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      cursor: isDragging ? 'grabbing' : 'grab'
    }

    return (
      <Card 
        ref={setNodeRef}
        style={style}
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            boxShadow: 4
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: '1px solid #e0e0e0' }}>
          <Box {...attributes} {...listeners} sx={{ cursor: 'grab', display: 'flex', alignItems: 'center', mr: 1 }}>
            <DragIndicatorIcon color="action" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Drag to reorder
          </Typography>
        </Box>

        <Box onClick={() => viewRecipe(recipe)} sx={{ cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Recipe Image */}
          {recipe.images && recipe.images.length > 0 && (
            <Box
              sx={{
                width: '100%',
                height: 200,
                backgroundColor: '#f5f5f5',
                overflow: 'hidden'
              }}
            >
              <img
                src={recipe.images[0]}
                alt={recipe.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </Box>
          )}
          
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                {recipe.title}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(recipe)
                }}
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
        </Box>
        
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                openRecipeDialog(recipe)
              }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                deleteRecipe(recipe.id!)
              }}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </CardActions>
      </Card>
    )
  }

  // Sortable Ingredient Item Component
  function SortableIngredient({ ingredient, index }: { ingredient: Ingredient; index: number }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: index })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1
    }

    if (editingIngredientIndex === index) {
      return (
        <Box ref={setNodeRef} style={style} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f5f5f5' }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
            <Box {...attributes} {...listeners} sx={{ cursor: 'grab' }}>
              <DragIndicatorIcon color="action" />
            </Box>
            <TextField
              label="Ingredient"
              value={ingredient.ingredient_name}
              onChange={(e) => updateIngredient(index, 'ingredient_name', e.target.value)}
              size="small"
              fullWidth
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Quantity"
              type="number"
              value={ingredient.quantity}
              onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
              size="small"
              sx={{ width: 100 }}
            />
            <TextField
              label="Unit"
              value={ingredient.unit}
              onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
              size="small"
              sx={{ width: 120 }}
            />
            <TextField
              label="Notes"
              value={ingredient.notes || ''}
              onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
              size="small"
              fullWidth
            />
          </Box>
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button size="small" onClick={() => stopEditingIngredient()} variant="outlined">
              Done
            </Button>
            <IconButton size="small" color="error" onClick={() => removeIngredient(index)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      )
    }

    return (
      <Box ref={setNodeRef} style={style} sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1, '&:hover': { backgroundColor: '#f5f5f5' } }}>
        <Box {...attributes} {...listeners} sx={{ cursor: 'grab', mr: 1 }}>
          <DragIndicatorIcon color="action" />
        </Box>
        <Typography sx={{ flex: 1 }}>
          <strong>{decimalToCookingFraction(ingredient.quantity)} {ingredient.unit}</strong> {ingredient.ingredient_name}
          {ingredient.notes && ` (${ingredient.notes})`}
        </Typography>
        <IconButton size="small" onClick={() => startEditingIngredient(index)}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={() => removeIngredient(index)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    )
  }
  
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsTextImportDialogOpen(true)}
            sx={{
              backgroundColor: '#1976d2',
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#115293'
              }
            }}
          >
            Import from text
          </Button>
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
      
      {/* Recipe Grid with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleRecipeDragEnd}
      >
        <SortableContext
          items={filteredRecipes.map(r => r.id!)}
          strategy={rectSortingStrategy}
        >
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: 3 
          }}>
            {filteredRecipes.map((recipe) => (
              <SortableRecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </Box>
        </SortableContext>
      </DndContext>
      
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
            <TextField
              fullWidth
              label="Source URL (optional)"
              value={recipeForm.source_url}
              onChange={(e) => setRecipeForm({ ...recipeForm, source_url: e.target.value })}
              placeholder="https://example.com/recipe"
              helperText="Add the web URL where you found this recipe"
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
              
              {/* Ingredients List with Drag and Drop */}
              {recipeForm.ingredients && recipeForm.ingredients.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Recipe Ingredients ({recipeForm.ingredients.length}) - Drag to reorder
                  </Typography>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleIngredientDragEnd}
                  >
                    <SortableContext
                      items={recipeForm.ingredients.map((_, idx) => idx)}
                      strategy={verticalListSortingStrategy}
                    >
                      {recipeForm.ingredients.map((ingredient, index) => (
                        <SortableIngredient key={index} ingredient={ingredient} index={index} />
                      ))}
                    </SortableContext>
                  </DndContext>
                </Box>
              )}
            </Box>
            
            {/* Notes Section */}
            <TextField
              fullWidth
              label="Recipe Notes"
              value={recipeForm.notes || ''}
              onChange={(e) => setRecipeForm({ ...recipeForm, notes: e.target.value })}
              multiline
              rows={3}
              placeholder="Add any special notes, tips, or variations for this recipe..."
              helperText="Optional notes about the recipe (e.g., substitutions, tips, variations)"
            />
            
            {/* Images Section */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Images
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                {/* File Upload Button */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    disabled={uploadingImages}
                    sx={{ minWidth: 200 }}
                  >
                    {uploadingImages ? 'Processing...' : 'Upload Images'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={handleImageUpload}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    or add URL below
                  </Typography>
                </Box>
                
                <TextField
                  fullWidth
                  label="Add Image URL"
                  placeholder="https://example.com/image.jpg"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement
                      const url = input.value.trim()
                      if (url) {
                        setRecipeForm({ 
                          ...recipeForm, 
                          images: [...(recipeForm.images || []), url] 
                        })
                        input.value = ''
                      }
                    }
                  }}
                  helperText="Press Enter to add image URL"
                />
                {recipeForm.images && recipeForm.images.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {recipeForm.images.map((imageUrl, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          position: 'relative',
                          width: 120,
                          height: 120,
                          border: '2px solid #e0e0e0',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}
                      >
                        <img 
                          src={imageUrl} 
                          alt={`Recipe ${index + 1}`}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover' 
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect width="120" height="120" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                          }}
                          onClick={() => {
                            const newImages = [...(recipeForm.images || [])]
                            newImages.splice(index, 1)
                            setRecipeForm({ ...recipeForm, images: newImages })
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        {index === 0 && (
                          <Chip
                            label="Main"
                            size="small"
                            color="primary"
                            sx={{
                              position: 'absolute',
                              bottom: 4,
                              left: 4
                            }}
                          />
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
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

              {/* Source URL */}
              {selectedRecipe.source_url && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Recipe Source:
                  </Typography>
                  <Link 
                    href={selectedRecipe.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: '0.95rem'
                    }}
                  >
                    {selectedRecipe.source_url}
                  </Link>
                </Box>
              )}

              {/* Description */}
              {selectedRecipe.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Description</Typography>
                  <Typography variant="body1">{selectedRecipe.description}</Typography>
                </Box>
              )}

              {/* Ingredients and First Image - Side by Side */}
              <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                {/* Ingredients */}
                {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                  <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
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
                
                {/* First Image - To the right of ingredients */}
                {selectedRecipe.images && selectedRecipe.images.length > 0 && (
                  <Box 
                    sx={{ 
                      flex: '0 0 300px',
                      maxWidth: 300,
                      height: 'fit-content'
                    }}
                  >
                    <img
                      src={selectedRecipe.images[0]}
                      alt={selectedRecipe.title}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: 400,
                        objectFit: 'cover',
                        borderRadius: 8
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </Box>
                )}
              </Box>

              {/* Instructions */}
              {selectedRecipe.instructions && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Instructions</Typography>
                  <Box>
                    {selectedRecipe.instructions.split(/(?=\d+\.|Step \d+)/i).filter(step => step.trim()).map((step, index) => {
                      // Clean up the step text
                      const cleanedStep = step.trim().replace(/^\d+\.\s*/, '').replace(/^Step \d+:?\s*/i, '')
                      
                      if (!cleanedStep) return null
                      
                      return (
                        <Typography 
                          key={index} 
                          variant="body1" 
                          sx={{ mb: 2, display: 'flex', gap: 1 }}
                        >
                          <Box 
                            component="span" 
                            sx={{ 
                              fontWeight: 'bold', 
                              minWidth: '24px',
                              color: 'primary.main'
                            }}
                          >
                            {index + 1}.
                          </Box>
                          <Box component="span" sx={{ flex: 1 }}>
                            {cleanedStep}
                          </Box>
                        </Typography>
                      )
                    })}
                  </Box>
                </Box>
              )}

              {/* Notes Section */}
              {selectedRecipe.notes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Notes</Typography>
                  <Typography variant="body1" sx={{ 
                    p: 2, 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: 1,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedRecipe.notes}
                  </Typography>
                </Box>
              )}

              {/* Tags */}
              {selectedRecipe.tags && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedRecipe.tags.split(',').map((tag, index) => (
                      <Chip key={index} label={tag.trim()} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Additional Images - At the bottom */}
              {selectedRecipe.images && selectedRecipe.images.length > 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Additional Images ({selectedRecipe.images.length - 1})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {selectedRecipe.images.slice(1).map((imageUrl, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 200,
                          height: 200,
                          overflow: 'hidden',
                          borderRadius: 1,
                          border: '1px solid #e0e0e0'
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={`${selectedRecipe.title} - Image ${index + 2}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </Box>
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

        {/* Import Recipe From Text Dialog */}
        <Dialog
          open={isTextImportDialogOpen}
          onClose={closeTextImportDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Import Recipe from Text</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                Paste any recipe text. AI will parse the ingredients and instructions into your recipe form.
              </Alert>
              <TextField
                fullWidth
                label="Recipe text"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={
                  'Chewy Granola Bars\nIngredients...\n\nInstructions...'
                }
                multiline
                minRows={10}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeTextImportDialog} disabled={isImportingText}>
              Cancel
            </Button>
            <Button
              onClick={importRecipeFromText}
              variant="contained"
              disabled={isImportingText || !importText.trim()}
            >
              {isImportingText ? <CircularProgress size={20} /> : 'Parse Recipe'}
            </Button>
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