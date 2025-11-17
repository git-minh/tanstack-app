# Favicon Setup Guide

## 🎯 Required Files

Place these favicon files in this directory (`apps/web/public/`):

### 1. **favicon-light.png**
- **Source**: Use `s-logo-whitebackground.png` (black/dark logo)
- **Purpose**: Shown in light mode tabs
- **Recommended size**: 32x32 pixels (or 64x64 for retina)
- **Format**: PNG with transparent background

### 2. **favicon-dark.png**
- **Source**: Use `s-logo-blackbackground.png` (white/light logo)
- **Purpose**: Shown in dark mode tabs
- **Recommended size**: 32x32 pixels (or 64x64 for retina)
- **Format**: PNG with transparent background

## 📐 Favicon Specifications

### Optimal Sizes
- **Standard**: 32x32px (recommended minimum)
- **Retina**: 64x64px (better quality on high-DPI displays)
- **Icon files**: 16x16, 32x32, 48x48 (if using .ico format)

### Format Recommendations
- **PNG**: Best for color and transparency (recommended)
- **ICO**: Legacy format, contains multiple sizes
- **SVG**: Modern, scalable (not universally supported)

### Design Tips
- Favicons appear at small sizes, so use simple, recognizable shapes
- Ensure good contrast at 16x16 size
- Test on both light and dark browser themes
- Use transparent backgrounds

## 🛠️ How to Create Favicons

### Option 1: Using ImageMagick (Command Line)
```bash
# Resize s-logo-whitebackground.png to 32x32
convert src/assets/logos/s-logo-whitebackground.png -resize 32x32 public/favicon-light.png

# Resize s-logo-blackbackground.png to 32x32
convert src/assets/logos/s-logo-blackbackground.png -resize 32x32 public/favicon-dark.png
```

### Option 2: Using Online Tools
- [Favicon.io](https://favicon.io/) - Generate favicons from images
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Comprehensive favicon package
- [Squoosh](https://squoosh.app/) - Resize and optimize images

### Option 3: Using Design Tools
- **Figma/Sketch**: Export at 32x32 and 64x64
- **Photoshop**: Image > Image Size > 32x32, Save as PNG
- **GIMP**: Scale Image to 32x32, Export as PNG

## 🎨 Theme-Aware Behavior

### How It Works
The favicons automatically switch based on browser/OS theme preference:

- **Light Mode** (white browser tabs):
  - Shows `favicon-light.png`
  - Black/dark logo (from `s-logo-whitebackground.png`)
  - Good contrast against light tab background

- **Dark Mode** (dark browser tabs):
  - Shows `favicon-dark.png`
  - White/light logo (from `s-logo-blackbackground.png`)
  - Good contrast against dark tab background

### Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (macOS 12.1+)
- Older browsers: Shows light favicon as fallback

## ✅ Quick Setup Steps

1. **Prepare your logo files**
   ```bash
   cd apps/web/src/assets/logos/
   # Ensure you have:
   # - s-logo-blackbackground.png (white/light logo)
   # - s-logo-whitebackground.png (black/dark logo)
   ```

2. **Resize to favicon size** (32x32 or 64x64)
   - Use any method above
   - Maintain transparency
   - Optimize file size

3. **Rename and place files**
   ```bash
   cd apps/web/public/
   # Place your resized files as:
   # - favicon-light.png (from s-logo-whitebackground.png)
   # - favicon-dark.png (from s-logo-blackbackground.png)
   ```

4. **Test**
   ```bash
   pnpm dev
   # Open http://localhost:3001
   # Check browser tab for favicon
   # Toggle OS dark mode to see theme switching
   ```

## 🔍 Verification

After adding your favicons, verify they work:

1. **Light Mode Test**
   - Set OS/browser to light mode
   - Open app in browser
   - Check tab shows dark logo (favicon-light.png)

2. **Dark Mode Test**
   - Set OS/browser to dark mode
   - Reload browser
   - Check tab shows light logo (favicon-dark.png)

3. **Multiple Tabs Test**
   - Open several tabs with the app
   - All should show correct themed favicon
   - Switch themes and verify all tabs update

## 📁 Current Configuration

The favicon links are defined in:
- **File**: `apps/web/src/routes/__root.tsx`
- **Lines**: 66-84 (in the `head()` function)

```typescript
links: [
  // Light mode favicon (dark logo for light backgrounds)
  { rel: "icon", href: "/favicon-light.png", media: "(prefers-color-scheme: light)" },

  // Dark mode favicon (light logo for dark backgrounds)
  { rel: "icon", href: "/favicon-dark.png", media: "(prefers-color-scheme: dark)" },

  // Fallback for older browsers
  { rel: "icon", href: "/favicon-light.png" },
]
```

## 🎨 Matching Your Brutalist Aesthetic

Your favicons should maintain the minimalist design:
- **Monochrome**: Pure black or pure white
- **Simple shapes**: Recognizable at small sizes
- **High contrast**: Clear visibility in all contexts
- **Transparent background**: Adapts to any browser theme

This creates a cohesive brand experience from the browser tab to the full application!
