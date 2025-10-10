# Quick Mobile Testing Checklist

## Test on iPhone Safari

### Before Testing
1. Clear Safari cache: Settings > Safari > Clear History and Website Data
2. Or force refresh: Tap and hold refresh button > Request Desktop Site (off) > Reload

### What to Test

#### ✅ Main Chat Screen
- [ ] Header with "AI Chat Assistant" is visible and not cut off
- [ ] Navigation buttons wrap to multiple rows (not overlapping)
- [ ] Question input area is visible at top
- [ ] Response area is visible below
- [ ] Can type in question box without page zooming
- [ ] Submit button is easy to tap

#### ✅ My Shop Tools
- [ ] Back button works and is easily tappable
- [ ] Tool list shows at top half of screen
- [ ] Tool details show at bottom half
- [ ] Search box works without zoom
- [ ] Can tap "Add New Tool" button
- [ ] Can select a tool from list
- [ ] Edit/Delete buttons are stacked vertically
- [ ] Edit form shows properly
- [ ] All form fields are accessible

#### ✅ Woodworking Projects  
- [ ] Project list shows at top
- [ ] Project details show at bottom
- [ ] "New Project" button works
- [ ] Can select projects easily
- [ ] Edit form is usable
- [ ] File upload works
- [ ] PDF previews render

#### ✅ Halloween Movie Selector
- [ ] Movie poster fits screen
- [ ] Random button is tappable
- [ ] Movie details are readable
- [ ] No horizontal scrolling

### Common Issues & Fixes

#### Issue: Page zooms when typing
**Fix**: Already implemented - all input fields use 16px font size

#### Issue: Buttons too small to tap
**Fix**: Already implemented - all buttons are minimum 44px height

#### Issue: Content cut off at bottom
**Fix**: Already implemented - iOS Safari bottom bar is accounted for

#### Issue: Layout looks weird
**Fix**: Clear browser cache (Settings > Safari > Clear History and Website Data)

### Test in Both Orientations

#### Portrait Mode
- [ ] All content fits on screen
- [ ] No horizontal scrolling
- [ ] Touch targets are adequate

#### Landscape Mode  
- [ ] Layout adjusts appropriately
- [ ] Side-by-side view where applicable
- [ ] All content is accessible

## URLs to Test
- Main app: https://secretapp.enzolopez.net
- Or local: http://localhost:5173 (if running dev server)

## Report Issues
If you find any layout issues:
1. Take a screenshot
2. Note the device model and iOS version
3. Note which screen/view has the issue
4. Note portrait vs landscape orientation
