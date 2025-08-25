# Publishing Guide for VS Music Extension

This guide provides step-by-step instructions for publishing the VS Music extension to the Visual Studio Code Marketplace.

## Prerequisites

### 1. Install Required Tools

```bash
# Install vsce (Visual Studio Code Extension Manager)
npm install -g @vscode/vsce

# Or with bun
bun add -g @vscode/vsce
```

### 2. Create Azure DevOps Personal Access Token

1. Go to [Azure DevOps](https://dev.azure.com/)
2. Sign in with your Microsoft account
3. Click on your profile picture → **Personal access tokens**
4. Click **New Token**
5. Configure the token:
   - **Name**: `vscode-marketplace-publish`
   - **Organization**: Select your organization or "All accessible organizations"
   - **Expiration**: Set to a reasonable timeframe (e.g., 1 year)
   - **Scopes**: Select **Custom defined**
   - **Marketplace**: Check **Manage** (this gives publish permissions)
6. Click **Create**
7. **IMPORTANT**: Copy the token immediately (you won't see it again)

### 3. Create/Verify Publisher Account

1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage/publishers)
2. Sign in with the same Microsoft account
3. If you don't have a publisher account:
   - Click **Create publisher**
   - Use publisher ID: `codershubinc` (must match package.json)
   - Fill in display name, description, etc.
4. Verify the publisher ID matches what's in `package.json`

## Pre-Publishing Checklist

### Files to Verify

- [ ] `package.json` - All metadata is correct
- [ ] `README.md` - Comprehensive documentation
- [ ] `CHANGELOG.md` - Detailed version history
- [ ] `LICENSE` - MIT license file
- [ ] `.vscodeignore` - Excludes unnecessary files
- [ ] Extension icon (recommended)

### Package.json Verification

Ensure these fields are properly set:

```json
{
  "name": "music",
  "version": "0.0.1",
  "publisher": "codershubinc",
  "author": "Swapnil Ingle",
  "description": "Display currently playing music info and controls in VS Code",
  "displayName": "VS Music",
  "repository": {
    "type": "git",
    "url": "https://github.com/codershubinc/vscode-music"
  },
  "bugs": {
    "url": "https://github.com/codershubinc/vscode-music/issues"
  },
  "homepage": "https://github.com/codershubinc/vscode-music#readme",
  "keywords": ["music", "player", "spotify", "linux", "playerctl", "mpris"],
  "categories": ["Other"],
  "license": "MIT"
}
```

## Publishing Steps

### Step 1: Build the Extension

```bash
# Navigate to the music directory
cd /home/swap/Github/vs-music/music

# Install dependencies
bun install

# Build the extension
bun run package

# Verify the build
ls -la dist/
```

### Step 2: Test Locally

```bash
# Create VSIX package for testing
bun run build-vsix

# This creates music-0.0.1.vsix
# Test install it locally:
code --install-extension music-0.0.1.vsix
```

### Step 3: Login to Publisher Account

```bash
# Login with your publisher token
vsce login codershubinc

# When prompted, paste your Azure DevOps Personal Access Token
```

### Step 4: Publish to Marketplace

```bash
# Publish the extension
vsce publish

# Or specify version explicitly
vsce publish 0.0.1

# For pre-release versions
vsce publish --pre-release
```

### Alternative: Publish via VSIX

```bash
# First create the VSIX
vsce package

# Then publish the VSIX file
vsce publish -p <your-token> music-0.0.1.vsix
```

## Post-Publishing Steps

### 1. Verify Publication

1. Go to [VS Code Marketplace](https://marketplace.visualstudio.com/)
2. Search for "VS Music" or "codershubinc"
3. Verify your extension appears correctly
4. Check all metadata, description, and screenshots

### 2. Test Installation

```bash
# Install from marketplace
code --install-extension codershubinc.music

# Or search in VS Code Extensions panel
```

### 3. Update Documentation

1. Update GitHub repository with marketplace links
2. Create a release tag on GitHub:
   ```bash
   git tag v0.0.1
   git push origin v0.0.1
   ```

## Version Updates

### For Future Releases

1. Update version in `package.json`
2. Update `CHANGELOG.md` with new features/fixes
3. Update README.md if needed
4. Build and test locally
5. Publish new version:
   ```bash
   vsce publish patch  # 0.0.1 → 0.0.2
   vsce publish minor  # 0.0.1 → 0.1.0
   vsce publish major  # 0.0.1 → 1.0.0
   ```

## Common Issues and Solutions

### Issue: "Publisher not found"

**Solution**: Ensure you've created a publisher account and the ID matches package.json

### Issue: "Permission denied"

**Solution**: Check your Azure DevOps token has "Marketplace: Manage" permissions

### Issue: "Extension already exists"

**Solution**: Update the version number in package.json

### Issue: "Invalid manifest"

**Solution**: Validate package.json syntax and required fields

### Issue: "Files too large"

**Solution**: Check .vscodeignore is excluding unnecessary files

## Useful Commands

```bash
# Show current publisher info
vsce show codershubinc

# List published extensions
vsce ls

# Get extension info
vsce show codershubinc.music

# Package without publishing
vsce package

# Validate package.json
vsce verify-pat

# Unpublish extension (use carefully!)
vsce unpublish codershubinc.music
```

## Security Best Practices

1. **Never commit tokens**: Keep your Personal Access Token secure
2. **Use environment variables**:
   ```bash
   export VSCE_PAT=your_token_here
   vsce publish
   ```
3. **Regular token rotation**: Update tokens periodically
4. **Minimal permissions**: Only grant necessary marketplace permissions

## Marketplace Guidelines

Ensure your extension follows [VS Code Marketplace Guidelines](https://code.visualstudio.com/api/references/extension-guidelines):

- [ ] Clear and descriptive README
- [ ] Proper categorization
- [ ] High-quality icon (recommended)
- [ ] Detailed description
- [ ] Screenshots/GIFs showing functionality
- [ ] Proper licensing
- [ ] Regular updates and maintenance

## Support and Resources

- [vsce CLI Documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Marketplace Publisher Portal](https://marketplace.visualstudio.com/manage)
- [Azure DevOps PAT Management](https://dev.azure.com/)

---

**Happy Publishing! 🚀**
