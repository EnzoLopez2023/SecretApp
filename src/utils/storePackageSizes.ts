/**
 * storePackageSizes.ts - Convert Recipe Quantities to Realistic Store Package Sizes
 * 
 * Converts small recipe quantities like "1/32 cup brown sugar" to realistic
 * store package sizes like "1 lb bag brown sugar" that you'd actually buy.
 */

interface PackageConversion {
  packageSize: string
  packageUnit: string
  notes?: string
  estimatedPrice?: number
}

// Common grocery store package sizes for ingredients
const STORE_PACKAGE_SIZES: Record<string, PackageConversion[]> = {
  // Sugars and Sweeteners
  'brown sugar': [
    { packageSize: '1', packageUnit: 'lb bag', notes: 'Light or dark brown sugar' },
    { packageSize: '2', packageUnit: 'lb bag', notes: 'Light or dark brown sugar' }
  ],
  'sugar': [
    { packageSize: '4', packageUnit: 'lb bag', notes: 'Granulated white sugar' },
    { packageSize: '1', packageUnit: 'lb bag', notes: 'Granulated white sugar' }
  ],
  'powdered sugar': [
    { packageSize: '1', packageUnit: 'lb box', notes: 'Confectioner\'s sugar' }
  ],
  
  // Flour and Baking
  'flour': [
    { packageSize: '5', packageUnit: 'lb bag', notes: 'All-purpose flour' },
    { packageSize: '2', packageUnit: 'lb bag', notes: 'All-purpose flour' }
  ],
  'baking powder': [
    { packageSize: '10', packageUnit: 'oz container', notes: 'Double-acting baking powder' }
  ],
  'baking soda': [
    { packageSize: '1', packageUnit: 'lb box', notes: 'Arm & Hammer or store brand' }
  ],
  'vanilla extract': [
    { packageSize: '2', packageUnit: 'oz bottle', notes: 'Pure vanilla extract' },
    { packageSize: '4', packageUnit: 'oz bottle', notes: 'Pure vanilla extract' }
  ],
  
  // Dairy and Eggs
  'butter': [
    { packageSize: '1', packageUnit: 'lb (4 sticks)', notes: 'Unsalted butter' },
    { packageSize: '1/2', packageUnit: 'lb (2 sticks)', notes: 'Unsalted butter' }
  ],
  'unsalted butter': [
    { packageSize: '1', packageUnit: 'lb (4 sticks)', notes: 'Unsalted butter' }
  ],
  'eggs': [
    { packageSize: '12', packageUnit: 'count carton', notes: 'Large eggs' },
    { packageSize: '18', packageUnit: 'count carton', notes: 'Large eggs' }
  ],
  'egg': [
    { packageSize: '12', packageUnit: 'count carton', notes: 'Large eggs' }
  ],
  
  // Syrups and Liquids
  'corn syrup': [
    { packageSize: '16', packageUnit: 'oz bottle', notes: 'Light corn syrup (Karo)' }
  ],
  'light corn syrup': [
    { packageSize: '16', packageUnit: 'oz bottle', notes: 'Light corn syrup (Karo)' }
  ],
  'maple syrup': [
    { packageSize: '12', packageUnit: 'oz bottle', notes: 'Pure maple syrup' }
  ],
  
  // Nuts and Seeds
  'pecans': [
    { packageSize: '8', packageUnit: 'oz bag', notes: 'Chopped or halves' },
    { packageSize: '1', packageUnit: 'lb bag', notes: 'Chopped or halves' }
  ],
  'chopped pecans': [
    { packageSize: '8', packageUnit: 'oz bag', notes: 'Pre-chopped pecans' }
  ],
  'walnuts': [
    { packageSize: '8', packageUnit: 'oz bag', notes: 'Chopped or halves' }
  ],
  'almonds': [
    { packageSize: '1', packageUnit: 'lb bag', notes: 'Whole or sliced' }
  ],
  
  // Pie Components
  'pie crust': [
    { packageSize: '1', packageUnit: 'package (2 crusts)', notes: 'Refrigerated pie crusts (Pillsbury)' }
  ],
  'pie crusts': [
    { packageSize: '1', packageUnit: 'package (2 crusts)', notes: 'Refrigerated pie crusts (Pillsbury)' }
  ],
  
  // Spices (small containers)
  'cinnamon': [
    { packageSize: '2.37', packageUnit: 'oz container', notes: 'Ground cinnamon' }
  ],
  'nutmeg': [
    { packageSize: '1.1', packageUnit: 'oz container', notes: 'Ground nutmeg' }
  ],
  'salt': [
    { packageSize: '26', packageUnit: 'oz container', notes: 'Table salt' }
  ]
}

/**
 * Convert a recipe ingredient to realistic store package size
 */
export function convertToStorePackage(ingredientName: string, recipeQuantity: number, recipeUnit: string): {
  packageSize: string
  packageUnit: string
  notes?: string
  originalQuantity: string
} {
  // Normalize ingredient name for lookup
  const normalizedName = ingredientName.toLowerCase().trim()
  
  // Look for exact match or partial match
  let packageOptions = STORE_PACKAGE_SIZES[normalizedName]
  
  if (!packageOptions) {
    // Try partial matching for compound ingredient names
    for (const [key, options] of Object.entries(STORE_PACKAGE_SIZES)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        packageOptions = options
        break
      }
    }
  }
  
  if (packageOptions && packageOptions.length > 0) {
    // Use the first (most common) package size
    const selectedPackage = packageOptions[0]
    
    return {
      packageSize: selectedPackage.packageSize,
      packageUnit: selectedPackage.packageUnit,
      notes: selectedPackage.notes,
      originalQuantity: `${recipeQuantity} ${recipeUnit}`
    }
  }
  
  // Fallback: return original quantity if no package size found
  return {
    packageSize: recipeQuantity.toString(),
    packageUnit: recipeUnit,
    originalQuantity: `${recipeQuantity} ${recipeUnit}`
  }
}

/**
 * Get estimated price range for an ingredient package
 */
export function getEstimatedPrice(ingredientName: string): { min: number, max: number } {
  const normalizedName = ingredientName.toLowerCase().trim()
  
  // Basic price estimates (could be made more sophisticated)
  const priceRanges: Record<string, { min: number, max: number }> = {
    'brown sugar': { min: 1.99, max: 2.49 },
    'sugar': { min: 2.99, max: 3.99 },
    'flour': { min: 2.49, max: 3.99 },
    'butter': { min: 3.49, max: 4.99 },
    'eggs': { min: 0.25, max: 0.40 }, // per egg, but sold by dozen
    'vanilla extract': { min: 3.99, max: 6.99 },
    'corn syrup': { min: 2.99, max: 3.49 },
    'pecans': { min: 4.99, max: 6.99 },
    'pie crust': { min: 2.49, max: 3.99 }
  }
  
  for (const [key, price] of Object.entries(priceRanges)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return price
    }
  }
  
  // Default fallback price range
  return { min: 1.00, max: 3.00 }
}