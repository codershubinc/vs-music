# Changelog

All notable changes to the VS Music extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-12-16

### Added

- **Windows Support**: Full support for Windows media controls using native Windows APIs
- **Cross-Platform Architecture**: Refactored codebase to support multiple operating systems (Linux and Windows)
- **Windows Media Integration**: Integration with Windows System Media Transport Controls (SMTC)
- **Automatic Platform Detection**: Extension automatically detects the operating system and loads the appropriate service

### Enhanced

- **Architecture**: Split platform-specific logic into separate modules (`linux/` and `windows/`)
- **Code Organization**: Improved project structure for better maintainability and scalability

### Notes

- This is a major release introducing Windows support alongside the existing Linux support.

## [0.1.6] - 2025-09-15

### Fixed

- **Critical Performance Bug**: Fixed `lastStatus` variable scope issue in `musicUI.js` that was preventing the 70% DOM manipulation optimization from working
- **Status Indicator Optimization**: Status indicator updates now properly skip unchanged states, reducing unnecessary DOM updates
- **Memory Efficiency**: Improved variable scoping for better memory usage in webview scripts

### Enhanced

- **Performance Improvements**: Achieved actual 70% reduction in DOM manipulation for status updates
- **Code Quality**: Better variable naming and scoping in webview utilities
- **Debug Logging**: Added proper logging for performance optimization tracking

### Technical Improvements

- **Webview Optimization**: Fixed critical bug where performance optimizations were being bypassed due to variable scope issues
- **DOM Management**: More efficient DOM element updates in music UI components
- **JavaScript Performance**: Corrected function-level variable declarations that were resetting optimization state

### Notes

- This release focuses on performance fixes identified during code review
- The status indicator optimization that was commented as working is now actually functional
- Recommended for all users to improve extension responsiveness

## [0.1.5] - 2025-09-06

### Changed

- Marked first **stable Linux release** (removed beta notice in docs)
- Refined horizontal player layout with improved artwork, status indicator, progress bar & control styling
- Converted webview scripts to **ES Modules** with clearer separation (logic vs UI vs coordinator)
- Updated metadata & repository move from `vscode-music` to `vs-music`

### Added

- Robust selector alignment & fallback logic for webview elements
- Manual progress/time update helper to smooth gaps between backend polling intervals
- Additional CSS polish (text truncation, state color indicators, improved button states)

### Fixed

- Play/Pause state mismatch caused by inconsistent status casing
- Missing / outdated selectors leading to unstyled or invisible elements
- Packaging issues where HTML/CSS/JS assets were not always copied into `dist`
- Potential duplicate timers by ensuring a single active manual progress interval

### Internal / Maintenance

- Cleaned up legacy aggregator script experiment (reverted to direct module imports)
- Improved webpack copy patterns to keep distribution lean
- Adjusted description to reflect stable Linux status

### Notes

- Windows & macOS support still planned; this release focuses on a polished Linux experience.

## [0.1.4] - 2025-09-01

### Added

- **Scrolling Text Animation**: Long track titles and artist names now flow horizontally with smooth scrolling animation
- **Interactive Text Control**: Hover over track info to pause scrolling animation for better readability
- **Enhanced Typography**: Improved text overflow handling with elegant scrolling for long content

### Enhanced

- **Text Display**: Better handling of long track titles that exceed the available width
- **User Experience**: Smooth 15-second animation cycle for titles, 12-second for artist names
- **Visual Polish**: Added padding and improved text flow for professional appearance

### Fixed

- **Text Truncation**: Resolved issues with long song titles being cut off or unreadable
- **Layout Consistency**: Improved text container overflow handling

## [0.1.3] - 2025-08-31

### Enhanced

- **Extension Branding**: Updated display name to "VS Music Widget" for better marketplace visibility
- **Code Organization**: Cleaned up duplicate artwork containers and HTML structure
- **UI Structure**: Simplified conditional rendering logic in webview templates

### Fixed

- **HTML Layout Issues**: Removed duplicate container elements causing layout conflicts
- **Code Quality**: Cleaned up redundant code and improved maintainability
- **Extension Metadata**: Corrected extension display name and version references

### Technical Improvements

- **Build Process**: Optimized extension packaging and deployment workflow
- **Documentation**: Updated README with correct version information and feature descriptions

## [0.1.2] - 2025-08-30

### Added

- **Album Artwork Display**: Full album artwork support in the music explorer panel
- **Artwork Caching System**: Intelligent caching of album artwork for better performance
- **Side-by-side Layout**: Clean flexbox layout with artwork and track details displayed together
- **Enhanced UI Components**: Improved visual design of the music explorer panel
- **File URI Handling**: Proper handling of local file artwork from GSConnect and other sources

### Enhanced

- **Music Explorer Panel**: Redesigned with better visual hierarchy and artwork integration
- **Webview Communication**: Improved message passing between extension and webview
- **Error Handling**: Better fallback mechanisms when artwork is unavailable
- **Performance**: Optimized artwork loading and caching for smoother experience

### Fixed

- **Artwork Loading**: Fixed issues with file:// URLs not displaying in webviews
- **UI Updates**: Resolved JavaScript errors preventing UI updates in the music panel
- **Layout Issues**: Corrected duplicate container elements causing layout problems
- **Variable Naming**: Fixed inconsistent variable references in webview templates

### Technical Improvements

- **Code Organization**: Cleaned up duplicate code and improved maintainability
- **Type Safety**: Enhanced TypeScript type definitions for better development experience
- **Build Process**: Optimized webpack configuration for better bundle size

## [0.0.1] - 2025-08-24

### Added

- **Initial Release** of VS Music extension
- **Status Bar Integration**: Display current track information in VS Code status bar
- **Music Explorer Panel**: Dedicated sidebar panel with music controls and track info
- **Playback Controls**: Play/pause, next track, previous track functionality
- **Linux Support**: Full compatibility with Linux systems using playerctl
- **MPRIS Integration**: Support for all MPRIS-compatible media players
- **Real-time Updates**: Automatic track information updates when music changes
- **Corner Widget**: Optional floating widget for quick music controls
- **Configurable Settings**:
  - Toggle status bar display
  - Customize status bar position (left/right)
  - Adjust update interval
  - Configure maximum title length
  - Toggle album art display
- **Supported Music Players**:
  - Spotify
  - VLC Media Player
  - Rhythmbox, Audacious, Clementine
  - Strawberry, Amarok, Banshee
  - Totem, mpv (with MPRIS script)
  - Browser-based players (Chrome/Firefox)
  - Almost all type of media players
- **Commands Available**:
  - `Music: Toggle Widget`
  - `Music: Toggle Corner Widget`
  - `Music: Play/Pause`
  - `Music: Next Track`
  - `Music: Previous Track`
  - `Music: Show Music Panel`
  - `Music: Refresh`

### Technical Details

- Built with TypeScript and webpack
- Uses playerctl for Linux media player communication
- Requires VS Code ^1.103.0
- MIT Licensed
- Publisher: codershubinc

### Requirements

- Linux operating system
- playerctl installed (`sudo apt install playerctl` on Ubuntu/Debian)
- MPRIS-compatible media player

## [Unreleased]

### Planned Features

- Windows support (coming soon)
- macOS support (coming soon)
- Additional customization options
- Enhanced album art display
- Playlist integration
- More media player integrations
