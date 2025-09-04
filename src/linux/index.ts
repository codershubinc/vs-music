import * as vscode from 'vscode';
import { LinuxMusicService } from './musicService';
import { ArtworkUtil } from './utils/artworkUtil';

/**
 * Linux Music Controller - Central controller for all Linux music operations
 * Exports all music controlling commands and metadata handling
 */
export class LinuxMusicController {
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
            // Process artwork through utility
            const processedPath = await ArtworkUtil.downloadArtwork(artUrl);
            console.log('Processed artwork path:', processedPath);

            if (processedPath) {
                const artworkFileUri = vscode.Uri.file(processedPath);
                console.log('Processed artwork URI artworkFilePath :', artworkFileUri);
                return processedPath;
            }

            // Fallback: try to parse as direct URI
            const artworkFileUri = vscode.Uri.parse(artUrl);
            return webview.asWebviewUri(artworkFileUri).toString();
        } catch (error) {
            console.warn('Error processing artwork URI:', error);
            return '';
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