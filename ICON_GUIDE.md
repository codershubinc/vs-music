# Extension Icon Requirements

## Icon Specifications

For VS Code marketplace, you need a **PNG** icon with the following specifications:

- **Size**: 128x128 pixels
- **Format**: PNG
- **Background**: Should look good on both light and dark backgrounds
- **Style**: Simple, clear, and recognizable

## Creating the Icon

### Option 1: Using the provided SVG template

1. Open `icon.svg` in an image editor or online converter
2. Export/convert to PNG at 128x128 pixels
3. Save as `icon.png` in the music directory
4. Add to package.json: `"icon": "icon.png"`

### Option 2: Online Conversion

1. Go to an online SVG to PNG converter (e.g., cloudconvert.com)
2. Upload the `icon.svg` file
3. Set output size to 128x128 pixels
4. Download as `icon.png`

### Option 3: Command Line (if you have ImageMagick)

```bash
# Convert SVG to PNG
convert icon.svg -resize 128x128 icon.png
```

### Option 4: Using Inkscape

```bash
# Convert using Inkscape
inkscape --export-type=png --export-width=128 --export-height=128 icon.svg -o icon.png
```

## Adding Icon to Extension

Once you have `icon.png`, update `package.json`:

```json
{
  "displayName": "VS Music",
  "icon": "icon.png",
  "engines": {
    "vscode": "^1.103.0"
  }
}
```

## Icon Design Guidelines

- **Music Theme**: Use musical symbols (notes, waves, headphones)
- **VS Code Colors**: Consider using VS Code's color scheme
- **Simplicity**: Should be recognizable at small sizes
- **Contrast**: Ensure good visibility on both light and dark themes

## Alternative Icon Ideas

If you want to create a custom icon, consider these elements:

- Musical note with VS Code colors
- Headphones icon
- Play button with sound waves
- Vinyl record
- Equalizer bars

## Testing the Icon

After adding the icon:

1. Build the extension: `bun run package`
2. Create VSIX: `bun run build-vsix`
3. Install locally to test: `code --install-extension music-0.0.1.vsix`
4. Check how it appears in the Extensions panel

The icon will appear in:

- VS Code Extensions panel
- Marketplace listing
- Extension details page
- Command palette (for extension commands)
