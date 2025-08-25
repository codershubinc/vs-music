# VS Music Extension - Publishing Checklist

Use this checklist before publishing to ensure everything is ready for the marketplace.

## 📋 Pre-Publishing Checklist

### ✅ Required Files

- [ ] `package.json` - Complete with all metadata
- [ ] `README.md` - Comprehensive documentation
- [ ] `CHANGELOG.md` - Detailed version history
- [ ] `LICENSE` - MIT license file
- [ ] `.vscodeignore` - Excludes development files
- [ ] `icon.png` - 128x128 extension icon (recommended)

### ✅ Package.json Validation

- [ ] `name`: "music"
- [ ] `version`: "0.0.1"
- [ ] `publisher`: "codershubinc"
- [ ] `author`: "Swapnil Ingle"
- [ ] `description`: Meaningful description
- [ ] `displayName`: "VS Music"
- [ ] `repository.url`: Points to GitHub repo
- [ ] `bugs.url`: Points to GitHub issues
- [ ] `homepage`: Points to GitHub readme
- [ ] `keywords`: Relevant search terms
- [ ] `categories`: ["Other"]
- [ ] `license`: "MIT"
- [ ] `engines.vscode`: "^1.103.0"

### ✅ Extension Functionality

- [ ] All commands work correctly
- [ ] playerctl dependency clearly documented
- [ ] Linux compatibility verified
- [ ] Status bar integration working
- [ ] Music panel displays correctly
- [ ] No console errors in development

### ✅ Documentation Quality

- [ ] README has clear installation instructions
- [ ] Prerequisites (playerctl) clearly explained
- [ ] Supported music players listed
- [ ] Configuration options documented
- [ ] Troubleshooting section included
- [ ] Screenshots/examples provided

### ✅ Build Process

- [ ] `bun install` works without errors
- [ ] `bun run compile` completes successfully
- [ ] `bun run package` builds without issues
- [ ] `bun run build-vsix` creates valid .vsix file
- [ ] Local installation works: `code --install-extension music-0.0.1.vsix`

### ✅ Marketplace Account Setup

- [ ] Azure DevOps account created
- [ ] Personal Access Token generated with Marketplace permissions
- [ ] Publisher account `codershubinc` created/verified
- [ ] vsce CLI installed: `npm install -g @vscode/vsce`
- [ ] Publisher login successful: `vsce login codershubinc`

### ✅ Legal & Compliance

- [ ] MIT license properly applied
- [ ] No copyrighted material included
- [ ] All dependencies properly licensed
- [ ] Author attribution correct

## 🚀 Publishing Commands

Once all checkboxes are complete:

```bash
# Final build
bun run package

# Publish to marketplace
vsce publish

# Alternative: create and publish VSIX
bun run build-vsix
vsce publish music-0.0.1.vsix
```

## ✅ Post-Publishing Verification

After publishing:

- [ ] Extension appears in marketplace search
- [ ] All metadata displays correctly
- [ ] Icon appears properly
- [ ] Description and README render correctly
- [ ] Installation from marketplace works
- [ ] All functionality works in fresh installation

## 📝 Notes

- First publication may take 5-10 minutes to appear in marketplace
- Extension will be available at: `https://marketplace.visualstudio.com/items?itemName=codershubinc.music`
- Users can install with: `code --install-extension codershubinc.music`

## 🔄 For Future Updates

When publishing updates:

1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Test all functionality
4. Run through this checklist again
5. Publish with: `vsce publish patch|minor|major`

---

**Ready to publish? All boxes checked? Let's go! 🎵**
