# Changelog

All notable changes to the VS Music extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
  - Spotify (official client)
  - VLC Media Player
  - Rhythmbox, Audacious, Clementine
  - Strawberry, Amarok, Banshee
  - Totem, mpv (with MPRIS script)
  - Browser-based players (Chrome/Firefox)
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
