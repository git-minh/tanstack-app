# Logo Assets

Place your logo PNG files in this directory:

## Required Files

1. **s-logo-blackbackground.png**
   - Logo designed for black backgrounds
   - Used in: Dark theme (when `theme === "dark"`)
   - Should have white/light colored logo

2. **s-logo-whitebackground.png**
   - Logo designed for white backgrounds
   - Used in: Light theme (when `theme === "light"`)
   - Should have black/dark colored logo

## Recommendations

- **Format**: PNG (with transparency if needed)
- **Size**: Recommended height of 32-64px (scaled to h-8 = 32px by default)
- **Aspect ratio**: Maintain your brand's aspect ratio
- **Optimization**: Use compressed PNGs for better performance
- **Naming**: Keep the exact filenames as specified above

## Usage

The `Logo` component (`src/components/ui/logo.tsx`) automatically:
- Switches between logos based on the current theme
- Handles SSR/hydration properly
- Provides smooth transitions
- Falls back to "S" monogram during load

## Locations Using Logo

1. **Sidebar** - `AppTitle` component
2. **Landing Page Header** - Navigation bar
3. **Anywhere you import** `<Logo />` component
