import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { LinuxMusicService } from './musicService';
import { ArtworkUtil } from './utils/artworkUtil';

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
 * - We use 'playerctl' command-line tool to interact with MPRIS
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
export class LinuxMusicController {
    private musicService: LinuxMusicService;
    private context: vscode.ExtensionContext;
    private artworkCache = new Map<string, string>();

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
        return await this.musicService.playPause();
    }

    /**
     * Next track
     */
    async next() {
        return await this.musicService.next();
    }

    /**
     * Previous track
     */
    async previous() {
        return await this.musicService.previous();
    }

    /**
     * Check if music service is available
     */
    isAvailable() {
        return this.musicService.isAvailable;
    }

    /**
     * Get processed artwork URI for webview
     */
    async getArtworkUri(artUrl: string, webview: vscode.Webview): Promise<string> {
        if (!artUrl) {
            return '';
        }

        try {
            const localPath = await this.downloadArtwork(artUrl);
            if (localPath) {
                const artworkFileUri = vscode.Uri.file(localPath);
                return webview.asWebviewUri(artworkFileUri).toString();
            }
            return '';
        } catch (error) {
            console.warn('Error processing artwork URI:', error);
            return '';
        }
    }

    /**
     * Download and cache artwork locally
     */
    private async downloadArtwork(artUrl: string): Promise<string | null> {
        try {
            // Check cache first
            if (this.artworkCache.has(artUrl)) {
                return this.artworkCache.get(artUrl)!;
            }

            // Handle file:// URLs by copying to extension storage
            if (artUrl.startsWith('file://')) {
                const sourcePath = artUrl.replace('file://', '');

                // Check if source file exists
                if (!fs.existsSync(sourcePath)) {
                    return null;
                }

                // Create artwork directory in extension's global storage
                const artworkDir = path.join(this.context.globalStorageUri.fsPath, 'artwork');
                if (!fs.existsSync(artworkDir)) {
                    fs.mkdirSync(artworkDir, { recursive: true });
                }

                // Generate filename from source path hash
                const pathHash = Buffer.from(sourcePath).toString('base64').replace(/[/+=]/g, '_');
                const extension = path.extname(sourcePath) || '.jpg';
                const filename = `artwork_${pathHash}${extension}`;
                const localPath = path.join(artworkDir, filename);

                // Copy file if not already copied
                if (!fs.existsSync(localPath)) {
                    fs.copyFileSync(sourcePath, localPath);
                }

                this.artworkCache.set(artUrl, localPath);
                console.log('Processed artwork path:', localPath);
                return localPath;
            }

            // Skip if not http/https URL
            if (!artUrl.startsWith('http://') && !artUrl.startsWith('https://')) {
                return null;
            }

            // Create artwork directory in extension's global storage
            const artworkDir = path.join(this.context.globalStorageUri.fsPath, 'artwork');
            if (!fs.existsSync(artworkDir)) {
                fs.mkdirSync(artworkDir, { recursive: true });
            }

            // Generate filename from URL hash
            const urlHash = Buffer.from(artUrl).toString('base64').replace(/[/+=]/g, '_');
            const filename = `artwork_${urlHash}.jpg`;
            const localPath = path.join(artworkDir, filename);

            // Check if already downloaded
            if (fs.existsSync(localPath)) {
                this.artworkCache.set(artUrl, localPath);
                console.log('Processed artwork path (cached):', localPath);
                return localPath;
            }

            // Download the artwork
            return new Promise((resolve) => {
                const protocol = artUrl.startsWith('https://') ? https : http;

                protocol.get(artUrl, (response) => {
                    if (response.statusCode === 200) {
                        const fileStream = fs.createWriteStream(localPath);
                        response.pipe(fileStream);

                        fileStream.on('finish', () => {
                            fileStream.close();
                            this.artworkCache.set(artUrl, localPath);
                            console.log('Downloaded artwork to:', localPath);
                            resolve(localPath);
                        });
                    } else {
                        console.warn('Failed to download artwork, status:', response.statusCode);
                        resolve(null);
                    }
                }).on('error', (error) => {
                    console.error('Error downloading artwork:', error);
                    resolve(null);
                });
            });

        } catch (error) {
            console.error('Error downloading artwork:', error);
            return null;
        }
    }

    /**
     * Dispose resources
     */
    dispose() {
        // Clean up resources if needed
    }
}

/**
 * Export the controller as the default export for this platform
 */
export default LinuxMusicController;