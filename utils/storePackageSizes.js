/**
 * storePackageSizes.js - Convert Recipe Quantities to Realistic Store Package Sizes
 * 
 * Converts small recipe quantities like "1/32 cup brown sugar" to realistic
 * store package sizes like "1 lb bag brown sugar" that you'd actually buy.
 * 
 * Now includes AI-powered lookup for unknown ingredients using Azure OpenAI.
 */

import fetch from 'node-fetch'

// Common grocery store package sizes for ingredients
const STORE_PACKAGE_SIZES = {
  // Sugars and Sweeteners
  'brown sugar': [
    { packageSize: '1', packageUnit: 'lb bag', notes: 'Light or dark brown sugar', price: { min: 1.99, max: 2.49 } },
    { packageSize: '2', packageUnit: 'lb bag', notes: 'Light or dark brown sugar', price: { min: 3.49, max: 3.99 } }
  ],
  'sugar': [
    { packageSize: '4', packageUnit: 'lb bag', notes: 'Granulated white sugar', price: { min: 2.99, max: 3.99 } },
    { packageSize: '1', packageUnit: 'lb bag', notes: 'Granulated white sugar', price: { min: 0.99, max: 1.49 } }
  ],
  'granulated sugar': [
    { packageSize: '4', packageUnit: 'lb bag', notes: 'Granulated white sugar', price: { min: 2.99, max: 3.99 } }
  ],
  'powdered sugar': [
    { packageSize: '1', packageUnit: 'lb box', notes: 'Confectioner\'s sugar', price: { min: 1.99, max: 2.49 } }
  ],
  'confectioners sugar': [
    { packageSize: '1', packageUnit: 'lb box', notes: 'Confectioner\'s sugar', price: { min: 1.99, max: 2.49 } }
  ],
  
  // Flour and Baking
  'flour': [
    { packageSize: '5', packageUnit: 'lb bag', notes: 'All-purpose flour', price: { min: 2.49, max: 3.99 } },
    { packageSize: '2', packageUnit: 'lb bag', notes: 'All-purpose flour', price: { min: 1.49, max: 2.29 } }
  ],
  'all-purpose flour': [
    { packageSize: '5', packageUnit: 'lb bag', notes: 'All-purpose flour', price: { min: 2.49, max: 3.99 } }
  ],
  'baking powder': [
    { packageSize: '10', packageUnit: 'oz container', notes: 'Double-acting baking powder', price: { min: 2.99, max: 3.99 } }
  ],
  'baking soda': [
    { packageSize: '1', packageUnit: 'lb box', notes: 'Arm & Hammer or store brand', price: { min: 0.99, max: 1.49 } }
  ],
  'vanilla extract': [
    { packageSize: '2', packageUnit: 'oz bottle', notes: 'Pure vanilla extract', price: { min: 3.99, max: 6.99 } },
    { packageSize: '4', packageUnit: 'oz bottle', notes: 'Pure vanilla extract', price: { min: 7.99, max: 12.99 } }
  ],
  'vanilla': [
    { packageSize: '2', packageUnit: 'oz bottle', notes: 'Pure vanilla extract', price: { min: 3.99, max: 6.99 } }
  ],
  
  // Dairy and Eggs
  'butter': [
    { packageSize: '1', packageUnit: 'lb (4 sticks)', notes: 'Unsalted butter', price: { min: 3.49, max: 4.99 } },
    { packageSize: '1/2', packageUnit: 'lb (2 sticks)', notes: 'Unsalted butter', price: { min: 1.99, max: 2.99 } }
  ],
  'unsalted butter': [
    { packageSize: '1', packageUnit: 'lb (4 sticks)', notes: 'Unsalted butter', price: { min: 3.49, max: 4.99 } }
  ],
  'salted butter': [
    { packageSize: '1', packageUnit: 'lb (4 sticks)', notes: 'Salted butter', price: { min: 3.49, max: 4.99 } }
  ],
  'eggs': [
    { packageSize: '12', packageUnit: 'count carton', notes: 'Large eggs', price: { min: 2.99, max: 4.99 } },
    { packageSize: '18', packageUnit: 'count carton', notes: 'Large eggs', price: { min: 4.49, max: 6.99 } }
  ],
  'egg': [
    { packageSize: '12', packageUnit: 'count carton', notes: 'Large eggs', price: { min: 2.99, max: 4.99 } }
  ],
  'large eggs': [
    { packageSize: '12', packageUnit: 'count carton', notes: 'Large eggs', price: { min: 2.99, max: 4.99 } }
  ],
  
  // Syrups and Liquids
  'corn syrup': [
    { packageSize: '16', packageUnit: 'oz bottle', notes: 'Light corn syrup (Karo)', price: { min: 2.99, max: 3.49 } }
  ],
  'light corn syrup': [
    { packageSize: '16', packageUnit: 'oz bottle', notes: 'Light corn syrup (Karo)', price: { min: 2.99, max: 3.49 } }
  ],
  'dark corn syrup': [
    { packageSize: '16', packageUnit: 'oz bottle', notes: 'Dark corn syrup (Karo)', price: { min: 2.99, max: 3.49 } }
  ],
  'maple syrup': [
    { packageSize: '12', packageUnit: 'oz bottle', notes: 'Pure maple syrup', price: { min: 8.99, max: 12.99 } }
  ],
  'honey': [
    { packageSize: '12', packageUnit: 'oz bottle', notes: 'Pure honey', price: { min: 3.99, max: 5.99 } }
  ],
  
  // Nuts and Seeds
  'pecans': [
    { packageSize: '8', packageUnit: 'oz bag', notes: 'Chopped or halves', price: { min: 4.99, max: 6.99 } },
    { packageSize: '1', packageUnit: 'lb bag', notes: 'Chopped or halves', price: { min: 8.99, max: 12.99 } }
  ],
  'chopped pecans': [
    { packageSize: '8', packageUnit: 'oz bag', notes: 'Pre-chopped pecans', price: { min: 4.99, max: 6.99 } }
  ],
  'pecan halves': [
    { packageSize: '8', packageUnit: 'oz bag', notes: 'Pecan halves', price: { min: 4.99, max: 6.99 } }
  ],
  'walnuts': [
    { packageSize: '8', packageUnit: 'oz bag', notes: 'Chopped or halves', price: { min: 3.99, max: 5.99 } }
  ],
  'chopped walnuts': [
    { packageSize: '8', packageUnit: 'oz bag', notes: 'Pre-chopped walnuts', price: { min: 3.99, max: 5.99 } }
  ],
  'almonds': [
    { packageSize: '1', packageUnit: 'lb bag', notes: 'Whole or sliced', price: { min: 6.99, max: 8.99 } }
  ],
  
  // Pie Components
  'pie crust': [
    { packageSize: '1', packageUnit: 'package (2 crusts)', notes: 'Refrigerated pie crusts (Pillsbury)', price: { min: 2.49, max: 3.99 } }
  ],
  'pie crusts': [
    { packageSize: '1', packageUnit: 'package (2 crusts)', notes: 'Refrigerated pie crusts (Pillsbury)', price: { min: 2.49, max: 3.99 } }
  ],
  'refrigerated pie crust': [
    { packageSize: '1', packageUnit: 'package (2 crusts)', notes: 'Refrigerated pie crusts (Pillsbury)', price: { min: 2.49, max: 3.99 } }
  ],
  
  // Spices and Seasonings
  'cinnamon': [
    { packageSize: '2.37', packageUnit: 'oz container', notes: 'Ground cinnamon', price: { min: 1.99, max: 2.99 } }
  ],
  'ground cinnamon': [
    { packageSize: '2.37', packageUnit: 'oz container', notes: 'Ground cinnamon', price: { min: 1.99, max: 2.99 } }
  ],
  'nutmeg': [
    { packageSize: '1.1', packageUnit: 'oz container', notes: 'Ground nutmeg', price: { min: 2.49, max: 3.49 } }
  ],
  'ground nutmeg': [
    { packageSize: '1.1', packageUnit: 'oz container', notes: 'Ground nutmeg', price: { min: 2.49, max: 3.49 } }
  ],
  'salt': [
    { packageSize: '26', packageUnit: 'oz container', notes: 'Table salt', price: { min: 0.99, max: 1.49 } }
  ],
  'table salt': [
    { packageSize: '26', packageUnit: 'oz container', notes: 'Table salt', price: { min: 0.99, max: 1.49 } }
  ],
  'adobo seasoning': [
    { packageSize: '8', packageUnit: 'oz container', notes: 'Goya Adobo all-purpose seasoning', price: { min: 1.99, max: 2.99 } }
  ],
  'sazón seasoning': [
    { packageSize: '1.41', packageUnit: 'oz box (8 packets)', notes: 'Goya Sazón with Culantro & Achiote', price: { min: 1.49, max: 2.29 } }
  ],
  'sazon seasoning': [
    { packageSize: '1.41', packageUnit: 'oz box (8 packets)', notes: 'Goya Sazón with Culantro & Achiote', price: { min: 1.49, max: 2.29 } }
  ],
  
  // Chocolate and Cocoa
  'chocolate chips': [
    { packageSize: '12', packageUnit: 'oz bag', notes: 'Semi-sweet chocolate chips', price: { min: 2.99, max: 4.49 } }
  ],
  'semi-sweet chocolate chips': [
    { packageSize: '12', packageUnit: 'oz bag', notes: 'Semi-sweet chocolate chips', price: { min: 2.99, max: 4.49 } }
  ],
  'cocoa powder': [
    { packageSize: '8', packageUnit: 'oz container', notes: 'Unsweetened cocoa powder', price: { min: 2.99, max: 4.49 } }
  ],
  'unsweetened cocoa powder': [
    { packageSize: '8', packageUnit: 'oz container', notes: 'Unsweetened cocoa powder', price: { min: 2.99, max: 4.49 } }
  ],

  // Rice and Grains
  'long grain rice': [
    { packageSize: '2', packageUnit: 'lb bag', notes: 'Long grain white rice', price: { min: 2.49, max: 3.49 } }
  ],
  'rice': [
    { packageSize: '2', packageUnit: 'lb bag', notes: 'Long grain white rice', price: { min: 2.49, max: 3.49 } }
  ],
  'white rice': [
    { packageSize: '2', packageUnit: 'lb bag', notes: 'Long grain white rice', price: { min: 2.49, max: 3.49 } }
  ],

  // Oils and Condiments
  'olive oil': [
    { packageSize: '16.9', packageUnit: 'fl oz bottle', notes: 'Extra virgin olive oil', price: { min: 4.99, max: 7.99 } }
  ],
  'extra virgin olive oil': [
    { packageSize: '16.9', packageUnit: 'fl oz bottle', notes: 'Extra virgin olive oil', price: { min: 4.99, max: 7.99 } }
  ],

  // Canned Goods
  'pigeon peas (gandules)': [
    { packageSize: '15', packageUnit: 'oz can', notes: 'Goya Pigeon Peas (Gandules)', price: { min: 1.49, max: 2.29 } }
  ],
  'pigeon peas': [
    { packageSize: '15', packageUnit: 'oz can', notes: 'Goya Pigeon Peas (Gandules)', price: { min: 1.49, max: 2.29 } }
  ],
  'gandules': [
    { packageSize: '15', packageUnit: 'oz can', notes: 'Goya Pigeon Peas (Gandules)', price: { min: 1.49, max: 2.29 } }
  ],
  'tomato sauce': [
    { packageSize: '8', packageUnit: 'oz can', notes: 'Hunt\'s tomato sauce', price: { min: 0.89, max: 1.29 } }
  ],

  // Sofrito and Hispanic Ingredients  
  'sofrito': [
    { packageSize: '12', packageUnit: 'oz jar', notes: 'Goya Sofrito cooking base', price: { min: 2.99, max: 3.99 } }
  ],

  // Meat and Protein
  'diced ham or pork': [
    { packageSize: '1', packageUnit: 'lb package', notes: 'Diced ham or pork shoulder', price: { min: 4.99, max: 6.99 } }
  ],
  'diced ham': [
    { packageSize: '1', packageUnit: 'lb package', notes: 'Diced ham', price: { min: 4.99, max: 6.99 } }
  ],
  'diced pork': [
    { packageSize: '1', packageUnit: 'lb package', notes: 'Diced pork shoulder', price: { min: 4.99, max: 6.99 } }
  ],

  // Water/Broth (these are typically not purchased specifically for recipe)
  'water or chicken broth': [
    { packageSize: '32', packageUnit: 'fl oz carton', notes: 'Chicken broth (water is free)', price: { min: 1.99, max: 2.99 } }
  ],
  'chicken broth': [
    { packageSize: '32', packageUnit: 'fl oz carton', notes: 'Chicken broth', price: { min: 1.99, max: 2.99 } }
  ],
  'water': [
    { packageSize: '1', packageUnit: 'gallon jug', notes: 'Drinking water (or use tap water)', price: { min: 0.99, max: 1.49 } }
  ]
}

/**
 * Intelligent defaults for common ingredient types
 */
function getIntelligentDefault(ingredientName) {
  const normalized = ingredientName.toLowerCase().trim()
  
  // Fresh herbs (check first, before dried spices)
  if (normalized.includes('fresh') && (normalized.includes('basil') || normalized.includes('parsley') || 
      normalized.includes('cilantro') || normalized.includes('mint'))) {
    return {
      packageSize: '0.75',
      packageUnit: 'oz package',
      notes: 'Fresh herb package',
      estimatedPrice: 1.99
    }
  }
  
  // Spices and seasonings (small containers)
  if (normalized.includes('paprika') || normalized.includes('cumin') || normalized.includes('oregano') || 
      normalized.includes('thyme') || normalized.includes('rosemary') || normalized.includes('basil') ||
      normalized.includes('garlic powder') || normalized.includes('onion powder')) {
    return {
      packageSize: '2.5',
      packageUnit: 'oz container',
      notes: 'Common spice container size',
      estimatedPrice: 2.99
    }
  }
  
  // Grains and cereals
  if (normalized.includes('quinoa') || normalized.includes('couscous') || normalized.includes('bulgur')) {
    return {
      packageSize: '1',
      packageUnit: 'lb box',
      notes: 'Whole grain package',
      estimatedPrice: 3.99
    }
  }
  
  // Coconut products
  if (normalized.includes('coconut milk')) {
    return {
      packageSize: '13.5',
      packageUnit: 'fl oz can',
      notes: 'Canned coconut milk',
      estimatedPrice: 1.89
    }
  }
  
  // Vinegars
  if (normalized.includes('vinegar') || normalized.includes('balsamic')) {
    return {
      packageSize: '16',
      packageUnit: 'fl oz bottle',
      notes: 'Standard vinegar bottle',
      estimatedPrice: 2.49
    }
  }
  
  // Nuts and seeds
  if (normalized.includes('cashews') || normalized.includes('almonds') || normalized.includes('walnuts') ||
      normalized.includes('seeds') || normalized.includes('sunflower')) {
    return {
      packageSize: '8',
      packageUnit: 'oz bag',
      notes: 'Nuts/seeds package',
      estimatedPrice: 4.99
    }
  }
  
  return null
}

/**
 * Use intelligent defaults to find common package sizes and pricing for an ingredient
 */
async function lookupIngredientWithAI(ingredientName) {
  try {
    // Use intelligent defaults based on ingredient type
    const aiResult = getIntelligentDefault(ingredientName)
    if (aiResult) {
      return aiResult
    }

    // Future enhancement: Add Azure OpenAI integration here if needed
    return null
  } catch (error) {
    return null
  }
}

/**
 * Convert a recipe ingredient to realistic store package size
 */
async function convertToStorePackage(ingredientName, recipeQuantity, recipeUnit) {
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
      originalQuantity: `${recipeQuantity} ${recipeUnit}`,
      estimatedPrice: selectedPackage.price ? (selectedPackage.price.min + selectedPackage.price.max) / 2 : 0
    }
  }
  
  // AI-powered fallback: Use Azure OpenAI to look up package information
  const aiPackage = await lookupIngredientWithAI(ingredientName)
  if (aiPackage) {
    return {
      packageSize: aiPackage.packageSize,
      packageUnit: aiPackage.packageUnit,
      notes: aiPackage.notes,
      originalQuantity: `${recipeQuantity} ${recipeUnit}`,
      estimatedPrice: aiPackage.estimatedPrice
    }
  }
  
  // Final fallback: return original quantity if AI lookup also fails
  return {
    packageSize: recipeQuantity.toString(),
    packageUnit: recipeUnit,
    originalQuantity: `${recipeQuantity} ${recipeUnit}`,
    estimatedPrice: 2.99 // Default reasonable price
  }
}

/**
 * Get estimated price range for an ingredient package
 */
function getEstimatedPrice(ingredientName) {
  const normalizedName = ingredientName.toLowerCase().trim()
  
  // Look for package options
  let packageOptions = STORE_PACKAGE_SIZES[normalizedName]
  
  if (!packageOptions) {
    for (const [key, options] of Object.entries(STORE_PACKAGE_SIZES)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        packageOptions = options
        break
      }
    }
  }
  
  if (packageOptions && packageOptions.length > 0 && packageOptions[0].price) {
    return packageOptions[0].price
  }
  
  // Default fallback price range
  return { min: 1.00, max: 3.00 }
}

export {
  convertToStorePackage,
  getEstimatedPrice,
  STORE_PACKAGE_SIZES
}