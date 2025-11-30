# Calculator Features for Cutting Board Designer

## Overview
Two specialized calculators have been integrated into the Cutting Board Designer to help with woodworking measurements and planning.

## 🧮 Fraction Calculator

### Purpose
Helps woodworkers add, subtract, multiply, and divide measurements in fractions - essential for cutting board design where imperial measurements (inches with fractions) are standard.

### Features
- **Common Fractions**: Quick access to frequently used fractions (1/2, 1/4, 3/4, 1/8, 3/8, 5/8, 7/8, 1/16, etc.)
- **Mixed Numbers**: Support for whole numbers with fractions (e.g., 1 1/4, 2 3/8)
- **Basic Operations**: Addition (+), Subtraction (-), Multiplication (×), Division (÷)
- **Dual Display**: Shows results in both fraction format and decimal inches

### How to Use
1. Click **"Fraction Calculator"** button above Project Details
2. Enter your calculation using:
   - Number buttons (0-9)
   - Common fraction buttons for quick entry
   - Space button to create mixed numbers (e.g., "1" + "Space" + "1/4" = 1¼)
   - "/" button to create custom fractions
   - Operator buttons (+, -, ×, ÷)
3. Press "=" to see the result
4. Press "C" to clear and start over

### Example Calculations
- **Adding board widths**: `2` + `1/8` = `2 1/8 (2.1250")`
- **Mixed number math**: `1 1/4` + `1/8` = `1 3/8 (1.3750")`
- **Dividing boards**: `24` ÷ `3` = `8 (8.0000")`

## 📐 Board Calculator

### Purpose
Calculate the total square inches needed for a cutting board project and determine how many stock boards are required based on your available inventory **organized by wood type** (Maple, Walnut, Cherry, etc.).

### Features
- **Board Area Calculation**: Computes total square inches of desired cutting board
- **Strip Calculation**: Determines how many strips needed for edge grain construction
- **Multi-Wood Inventory**: Track different wood types with their own dimensions and quantities
- **Pre-Designed Patterns**: Select from professional cutting board patterns with automatic calculations
- **Stock Planning**: Calculates how many boards needed per wood type
- **Stock Verification**: Checks if you have enough boards in inventory for each wood type
- **Color-Coded Results**: Visual wood type identification with color chips
- **Real-time Updates**: Automatically recalculates as you adjust values

### Pre-Designed Patterns

#### 🎨 2 Color Woven Pattern
A classic brick parquet pattern where groups of 3 pieces (forming "bricks") alternate between horizontal and vertical orientations.

**3-Layer Construction**:
- Each visible 2"×2" cube consists of **3 laminated layers**:
  - **Top Layer**: Main color (0.666" thick)
  - **Middle Layer**: Accent color (0.666" thick)
  - **Bottom Layer**: Main color (0.666" thick)
- **Total Thickness**: 3 × 0.666" = 2.0"
- **Material Ratio**: 2:1 (main:accent) because main color is used on both outer layers

**Requirements**:
- **2 Wood Types**: Main color (light) and Accent color (dark)
- **Ratio**: 2:1 material ratio (2 main layers + 1 accent layer per cube)
- **Piece Size**: Each layer piece is 0.666"T × 2"W × 2"L
- **Brick Size**: 3 pieces form a brick (6" × 2" or 2" × 6")

**Pattern Structure**:
- **Horizontal bricks**: 3 cubes side-by-side (||| - 6"W × 2"H)
- **Vertical bricks**: 3 cubes stacked (≡ - 2"W × 6"H)
- **Offset layout**: Like real brickwork, alternating rows are offset
- **Grain rotation**: Each brick's grain runs 90° from adjacent bricks

**Example for 20"W × 16"L board**:
- Grid: 10 wide × 8 long = **80 cubes**
- Each cube = 3 pieces (main/accent/main)
- Total pieces needed: 80 cubes × 3 layers = **240 pieces**
- Main color pieces: 80 cubes × 2 pieces = **160 pieces**
- Accent color pieces: 80 cubes × 1 piece = **80 pieces**
- Boards needed (from 0.666"T × 2"W × 24"L stock):
  - Each board yields: 24" ÷ 2" = **12 pieces**
  - Main color: 160 pieces ÷ 12 = **14 boards**
  - Accent color: 80 pieces ÷ 12 = **7 boards**

**How the Math Works**:
- Each 0.666"T × 2"W × 24"L board can be cut into **12 pieces** of 2" × 2"
- Pattern uses **2:1 material ratio** (2 parts main : 1 part accent)
- Three layers are glued face-to-face to create each 2" thick cube
- The visual interest comes from:
  - **Grouping into bricks** (3 cubes each)
  - **Alternating orientation** (horizontal vs vertical)
  - **Offset/stagger** creating the woven appearance
  - **90° grain rotation** between adjacent bricks
  - **Contrasting wood colors** visible on end grain

💡 **Tip**: This is the classic "brick parquet" or "basketweave parquet" flooring pattern adapted for cutting boards using laminated construction. Use high-contrast woods (Maple + Purpleheart, Walnut + Maple) for maximum visual impact! The 3-layer lamination creates beautiful end-grain stripes when viewed from the side.

#### 🎨 2 Color Woven Pattern with Thin Strip
A variation of the basketweave pattern where the accent layer is much thinner, creating a more subtle accent stripe.

**3-Layer Construction**:
- Each visible 1.75"×1.75" cube consists of **3 laminated layers**:
  - **Top Layer**: Main color (0.75" thick)
  - **Middle Layer**: Accent color (0.25" thick - thin strip)
  - **Bottom Layer**: Main color (0.75" thick)
- **Total Thickness**: 0.75" + 0.25" + 0.75" = 1.75"
- **Material Ratio**: Still 2:1 (main:accent) but accent is much thinner

**Requirements**:
- **2 Wood Types**: Main color (light) and Accent color (dark)
- **Ratio**: 2:1 material ratio by piece count (but different volumes due to thin accent)
- **Piece Sizes**: 
  - Main layer pieces: 0.75"T × 1.75"W × 1.75"L
  - Accent layer pieces: 0.25"T × 1.75"W × 1.75"L
- **Cube Size**: 1.75" × 1.75" (smaller than standard pattern)

**Pattern Structure**:
- Same basketweave visual as standard 2-color pattern
- 3×3 groups alternate between horizontal and vertical strips
- Within each strip, pieces alternate colors (light-dark-light)
- The thin accent creates a subtle stripe effect

**Example for 20"W × 16"L board**:
- Grid: 11 wide × 9 long = **99 cubes** (more cubes due to smaller size)
- Each cube = 3 pieces (main/thin accent/main)
- Total pieces needed: 99 cubes × 3 layers = **297 pieces**
- Main color pieces: 99 cubes × 2 pieces = **198 pieces** (at 0.75" thick)
- Accent color pieces: 99 cubes × 1 piece = **99 pieces** (at 0.25" thick)
- Boards needed:
  - From 0.75"T × 1.75"W × 24"L main stock: 24" ÷ 1.75" = **13 pieces** per board
  - Main color: 198 pieces ÷ 13 = **16 boards**
  - From 0.25"T × 1.75"W × 24"L accent stock: 24" ÷ 1.75" = **13 pieces** per board
  - Accent color: 99 pieces ÷ 13 = **8 boards**

**How the Math Works**:
- Main boards (0.75"T × 1.75"W × 24"L) yield **13 pieces** each
- Accent boards (0.25"T × 1.75"W × 24"L) yield **13 pieces** each
- Pattern still uses **2:1 piece count ratio** (2 main pieces : 1 accent piece per cube)
- The thin accent layer creates a more subtle visual effect
- Smaller cubes (1.75" vs 2") mean more cubes per board area

💡 **Tip**: This pattern is perfect when you want a more subtle accent line! The thin 0.25" stripe creates elegant detail without overwhelming the main wood color. Great for lighter accent woods like Purpleheart or Padauk that might be too bold in thicker sections.

### How to Use
1. Click **"Board Calculator"** button above Project Details
2. Enter **Desired Cutting Board** dimensions:
   - Width (e.g., 20")
   - Length (e.g., 16")
   - Thickness (e.g., 1.5")
3. Enter **Available Stock Board** specifications for each wood type:
   - Click "Add" to add more wood types
   - Select Wood Type (Maple, Walnut, Cherry, Oak, etc.)
   - Enter Board Width (e.g., 2")
   - Enter Board Thickness (e.g., 0.75")
   - Enter Board Length (e.g., 24")
   - Enter Quantity in Stock (e.g., 10)
   - Remove wood types with the trash icon (must keep at least one)
4. Review the calculation results:
   - Total board area in square inches
   - Number of strips needed
   - **Breakdown by wood type** showing:
     - Boards needed per wood type
     - Boards available per wood type
     - Stock status (enough/need more) per wood type
   - Total boards needed across all types
   - Overall stock availability status

### Example Calculation
**Goal**: 20"W × 16"L × 1.5"T cutting board  
**Stock**: 
- **Maple**: 2"W × 0.75"T × 24"L (10 in stock)
- **Walnut**: 2"W × 0.75"T × 24"L (5 in stock)
- **Cherry**: 2"W × 0.75"T × 24"L (3 in stock)

**Results**:
- Total Area: 320 sq in
- Strips Needed: 8 strips (16" ÷ 2" per strip)
- **Maple**: Needs 8 boards, Has 10 ✅ Enough Stock
- **Walnut**: Needs 8 boards, Has 5 ❌ Need 3 more
- **Cherry**: Needs 8 boards, Has 3 ❌ Need 5 more
- Total Needed: 24 boards across all types
- Status: ❌ Need more boards (check individual wood types)

### Notes
- Calculations assume **edge grain construction** where strips are glued on their thickness edge
- Each strip runs the full width of the final board
- Does not account for:
  - Saw kerf (material lost to blade thickness)
  - Planing/sanding waste
  - Pattern variations

## 💡 Tips

### Fraction Calculator
- Use the Space button to build mixed numbers like "1 1/4"
- Results show both fraction and decimal for easy reference
- Keep your phone nearby for quick measurements while in the shop

### Board Calculator
- Always order 10-15% extra boards to account for waste
- Consider saw kerf: typically 1/8" per cut
- Factor in planing waste: usually 1/16" - 1/8" per face
- For complex patterns, you may need more strips than calculated

## Integration

Both calculators are accessible from the Cutting Board Designer main page via buttons located **above the Project Details section**. They open as dialog overlays, allowing you to reference your design while calculating.

## Future Enhancements

Potential improvements:
- Save calculation history
- Export calculations to PDF
- Waste factor adjustments
- Face grain and end grain calculation modes
- Board cost calculator
- Multiple wood species cost comparison
