import * as vscode from 'vscode';
import { LinuxMusicService } from './musicService';
import { ArtworkUtil } from './utils/artworkUtil';
import { IMusicController } from '../common/models/models';

/**
 * ========================================================================
 * LINUX MUSIC CONTROLLER - Platform-Specific Music Integration
 * ========================================================================
 * 
 * This is the CENTRAL CONTROLLER for all Linux music operations.
 * It acts as a unified interface between the common webview and Linux-specific
 * music system integration via MPRIS (Media Player Remote Interfacing Specification).
 * 
 * ARCHITECTURE ROLE:
 * ------------------
 * Layer 1: VS Code Host
 * Layer 2: Common Extension Logic (extension.ts)
 * Layer 3: >>> THIS FILE <<< - Linux-specific backend
 * Layer 4: Common UI (musicWebviewProvider.ts)
 * 
 * LINUX MUSIC INTEGRATION:
 * ------------------------
 * Linux uses MPRIS (D-Bus protocol) to communicate with media players:
 * - Spotify, VLC, Rhythmbox, Audacious, etc. all support MPRIS
 * - We use 'dbus-next' to communicate directly with MPRIS over D-Bus
 * - Provides standardized interface for play/pause/next/prev/metadata
 * 
 * CONTROLLER RESPONSIBILITIES:
 * ----------------------------
 * 1. 🎵 Music Control: Play, pause, next, previous track commands
 * 2. 📊 Metadata Access: Track title, artist, album, duration, position
 * 3. 🖼️ Artwork Processing: Download, cache, and serve album artwork
 * 4. 🔄 State Management: Track playback state and position updates
 * 5. 🛡️ Error Handling: Graceful degradation when music players unavailable
 * 
 * WHY A CONTROLLER PATTERN:
 * -------------------------
 * - Encapsulates all Linux-specific logic in one place
 * - Provides consistent API that common webview can rely on
 * - Easy to swap out or extend without affecting UI layer
 * - Clear separation of concerns (UI logic vs platform logic)
 * - Future Windows/macOS controllers can implement same interface
 */
export class LinuxMusicController implements IMusicController {
    private musicService: LinuxMusicService;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.musicService = new LinuxMusicService(context);

        // Initialize artwork utility
        ArtworkUtil.initialize(context);
    }

    /**
     * Get current track information including metadata
     */
    async getCurrentTrack() {
        return await this.musicService.getCurrentTrack();
    }

    /**
     * Get current playback position
     */
    async getPosition() {
        return await this.musicService.getPosition();
    }

    /**
     * Play/Pause toggle
     */
    async playPause() {
        await this.musicService.playPause();
        return true;
    }

    /**
     * Next track
     */
    async next() {
        await this.musicService.next();
        return true;
    }

    /**
     * Previous track
     */
    async previous() {
        await this.musicService.previous();
        return true;
    }

    /**
     * Check if music service is available
     */
    isAvailable() {
        return this.musicService.isAvailable;
    }

    /**
     * Get processed artwork URI for webview
     * Delegates to ArtworkUtil for download and caching
     */
    async getArtworkUri(artUrl: string, webview: vscode.Webview): Promise<string> {
        if (!artUrl) {
            return '';
        }

        try {
            // Delegate to centralized ArtworkUtil
            const localPath = await ArtworkUtil.downloadArtwork(artUrl);
            if (localPath) {
                // Convert file path directly to webview URI
                const fileUri = vscode.Uri.file(localPath);
                return webview.asWebviewUri(fileUri).toString();
            }
            return '';
        } catch (error) {
            console.warn('Error processing artwork URI:', error);
            return '';
        }
    }

    /**
     * Register a callback that fires whenever track/playback state changes (D-Bus signal, zero polling)
     */
    onTrackChanged(callback: () => void) {
        this.musicService.onTrackChanged(() => callback());
    }

    /**
     * Dispose resources
     */
    dispose() {
        this.musicService.dispose();
    }
}

/**
 * Export the controller as the default export for this platform
 */
export default LinuxMusicController;