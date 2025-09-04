import * as vscode from 'vscode';
import * as path from 'path';
import { LinuxMusicService } from '../musicService';

/**
 * Linux-specific music webview provider
 * Handles webview creation and communication for Linux platforms
 */
export class LinuxMusicWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vsMusicPlayer';

    private _view?: vscode.WebviewView;
    private _musicService: LinuxMusicService;
    private _updateTimer?: NodeJS.Timeout;
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext, musicService: LinuxMusicService) {
        this._context = context;
        this._musicService = musicService;

        // Listen for music service updates
        this.setupMusicServiceListeners();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            // No external resource roots needed since we're inlining everything
            localResourceRoots: []
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(
            (message) => {
                this.handleWebviewMessage(message);
            },
            undefined,
            this._context.subscriptions
        );

        // Start periodic updates when webview becomes visible
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this.startPeriodicUpdates();
                this.updateWebview(); // Immediate update
            } else {
                this.stopPeriodicUpdates();
            }
        });

        // Initial update if visible
        if (webviewView.visible) {
            this.startPeriodicUpdates();
            this.updateWebview();
        }
    }

    private async handleWebviewMessage(message: any): Promise<void> {
        try {
            switch (message.command) {
                case 'webviewReady':
                    console.log('Webview ready, sending initial data...');
                    await this.updateWebview();
                    break;

                case 'playPause':
                    await this._musicService.playPause();
                    // Immediate update after action
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                case 'nextTrack':
                    await this._musicService.next();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                case 'previousTrack':
                    await this._musicService.previous();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                default:
                    console.warn('Unknown webview message command:', message.command);
            }
        } catch (error) {
            console.error('Error handling webview message:', error);
            vscode.window.showErrorMessage(`Music control error: ${error}`);
        }
    }

    private setupMusicServiceListeners(): void {
        // If music service has event emitters, listen to them
        // This would allow real-time updates without polling
        // For now, we'll rely on periodic updates
    }

    private startPeriodicUpdates(): void {
        if (this._updateTimer) {
            return; // Already running
        }

        // Update every 2 seconds when visible
        this._updateTimer = setInterval(() => {
            this.updateWebview();
        }, 2000);
    }

    private stopPeriodicUpdates(): void {
        if (this._updateTimer) {
            clearInterval(this._updateTimer);
            this._updateTimer = undefined;
        }
    }

    private async updateWebview(): Promise<void> {
        if (!this._view || !this._view.visible) {
            return;
        }

        try {
            const trackInfo = await this._musicService.getCurrentTrack();

            if (!trackInfo || !trackInfo.title) {
                // No music playing
                this._view.webview.postMessage({
                    command: 'noMusic'
                });
                return;
            }

            // Send track info to webview
            this._view.webview.postMessage({
                command: 'updateTrack',
                track: {
                    title: trackInfo.title || 'Unknown Title',
                    artist: trackInfo.artist || 'Unknown Artist',
                    album: trackInfo.album || 'Unknown Album',
                    status: trackInfo.status || 'stopped',
                    position: trackInfo.position || 0,
                    duration: trackInfo.duration || 0,
                    artworkPath: trackInfo.artUrl || undefined
                }
            });

        } catch (error) {
            console.error('Error updating webview:', error);
            // Send no music state on error
            this._view?.webview.postMessage({
                command: 'noMusic'
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return this._getInlineHtml();
    } private _getInlineHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src vscode-resource: data:;">
    <title>VS Music Player</title>
    <style>
        /* VS Music Player Webview Styles */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 16px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-size: 14px;
            line-height: 1.5;
        }

        /* Utility classes */
        .hidden {
            display: none !important;
        }

        .music-container {
            max-width: 400px;
            margin: 0 auto;
        }

        /* No Music State */
        .no-music-container {
            text-align: center;
            padding: 32px 16px;
            opacity: 0.7;
        }

        .music-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }

        .no-music-container h2 {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }

        .no-music-container p {
            margin: 0 0 16px 0;
            color: var(--vscode-descriptionForeground);
            font-size: 13px;
        }

        .supported-players {
            display: flex;
            gap: 8px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .supported-players span {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
        }

        /* Music Info Container */
        .music-info {
            background: var(--vscode-sideBar-background);
            border-radius: 8px;
            padding: 20px;
            border: 1px solid var(--vscode-sideBar-border);
        }

        /* Track Container */
        .track-container {
            display: flex;
            gap: 16px;
            margin-bottom: 20px;
            align-items: flex-start;
        }

        .artwork-container {
            position: relative;
            width: 80px;
            height: 80px;
            flex-shrink: 0;
        }

        .artwork {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid var(--vscode-sideBar-border);
        }

        .artwork-placeholder {
            width: 100%;
            height: 100%;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: var(--vscode-descriptionForeground);
        }

        .track-details {
            flex: 1;
            min-width: 0;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }

        .status-icon {
            font-size: 14px;
            opacity: 0.8;
        }

        .status-playing .status-icon {
            color: var(--vscode-charts-green);
        }

        .status-paused .status-icon {
            color: var(--vscode-charts-yellow);
        }

        .status-stopped .status-icon {
            color: var(--vscode-charts-red);
        }

        .track-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
            color: var(--vscode-foreground);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .track-artist {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .track-album {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            opacity: 0.8;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Progress Container */
        .progress-container {
            margin-bottom: 20px;
        }

        .progress-bar {
            background: var(--vscode-progressBar-background);
            height: 6px;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 8px;
            cursor: pointer;
        }

        .progress-fill {
            background: var(--vscode-progressBar-foreground);
            height: 100%;
            width: 0%;
            transition: width 0.3s ease;
            border-radius: 3px;
        }

        .progress-time {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        /* Controls */
        .controls {
            display: flex;
            justify-content: center;
            gap: 16px;
            align-items: center;
        }

        .control-btn {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid var(--vscode-button-border);
        }

        .control-btn:hover {
            background: var(--vscode-button-hoverBackground);
            transform: scale(1.05);
        }

        .control-btn:active {
            transform: scale(0.95);
        }

        .play-pause-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            width: 52px;
            height: 52px;
            font-size: 18px;
        }

        .play-pause-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }

        /* Responsive design */
        @media (max-width: 350px) {
            .track-container {
                flex-direction: column;
                gap: 12px;
                text-align: center;
            }
            
            .artwork-container {
                align-self: center;
            }
        }

        /* Animations */
        @keyframes scroll-text {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }

        .scrolling-text {
            display: inline-block;
            animation: scroll-text 15s linear infinite;
        }

        /* Dark theme specific adjustments */
        body.vscode-dark .music-info {
            background: var(--vscode-editor-background);
        }

        body.vscode-dark .artwork-placeholder {
            background: var(--vscode-editor-inactiveSelectionBackground);
        }

        /* Light theme specific adjustments */
        body.vscode-light .progress-bar {
            background: rgba(0, 0, 0, 0.1);
        }

        body.vscode-light .progress-fill {
            background: var(--vscode-button-background);
        }
    </style>
</head>
<body>
    <div class="music-container">
        <div id="no-music" class="no-music-container">
            <div class="music-icon">🎵</div>
            <h2>No music currently playing</h2>
            <p>Start playing music from any MPRIS-compatible player</p>
            <div class="supported-players">
                <span>Spotify</span>
                <span>VLC</span>
                <span>Rhythmbox</span>
                <span>Chrome</span>
            </div>
        </div>

        <div id="music-info" class="music-info hidden">
            <div class="track-container">
                <div class="artwork-container">
                    <div class="artwork-placeholder">🎵</div>
                </div>
                <div class="track-details">
                    <div class="status-indicator">
                        <span class="status-icon">▶️</span>
                    </div>
                    <div class="track-title">Loading...</div>
                    <div class="track-artist">Please wait...</div>
                    <div class="track-album">Initializing...</div>
                </div>
            </div>

            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-time">
                    <span class="current-time">0:00</span>
                    <span class="total-time">0:00</span>
                </div>
            </div>

            <div class="controls">
                <button class="control-btn" id="prev-btn" title="Previous">⏮️</button>
                <button class="control-btn play-pause-btn" id="play-pause-btn" title="Play/Pause">▶️</button>
                <button class="control-btn" id="next-btn" title="Next">⏭️</button>
            </div>
        </div>
    </div>

    <script>
        // VS Music Player Webview Script
        (function () {
            'use strict';

            // Get VS Code API
            const vscode = acquireVsCodeApi();

            // DOM elements
            let currentTrack = null;
            let webviewReady = false;

            // Initialize when DOM is loaded
            document.addEventListener('DOMContentLoaded', function () {
                initializeWebview();
            });

            function initializeWebview() {
                console.log('Initializing VS Music webview...');

                // Setup control event listeners
                setupControlEvents();

                // Signal that webview is ready
                webviewReady = true;
                vscode.postMessage({
                    command: 'webviewReady'
                });

                console.log('Webview ready signal sent');
            }

            function setupControlEvents() {
                const playPauseBtn = document.getElementById('play-pause-btn');
                const prevBtn = document.getElementById('prev-btn');
                const nextBtn = document.getElementById('next-btn');

                if (playPauseBtn) {
                    playPauseBtn.addEventListener('click', () => {
                        vscode.postMessage({ command: 'playPause' });
                    });
                }

                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        vscode.postMessage({ command: 'previousTrack' });
                    });
                }

                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        vscode.postMessage({ command: 'nextTrack' });
                    });
                }
            }

            // Listen for messages from extension
            window.addEventListener('message', event => {
                const message = event.data;

                switch (message.command) {
                    case 'updateTrack':
                        updateTrackInfo(message.track);
                        break;
                    case 'updateStatus':
                        updatePlaybackStatus(message.status);
                        break;
                    case 'updatePosition':
                        updatePosition(message.position, message.duration);
                        break;
                    case 'noMusic':
                        showNoMusicState();
                        break;
                }
            });

            function updateTrackInfo(track) {
                if (!track) {
                    showNoMusicState();
                    return;
                }

                currentTrack = track;
                console.log('Updating track info:', track);

                // Show music info, hide no-music state
                const musicInfo = document.getElementById('music-info');
                const noMusic = document.getElementById('no-music');

                if (musicInfo && noMusic) {
                    musicInfo.classList.remove('hidden');
                    noMusic.style.display = 'none';
                }

                // Update track details
                updateElement('track-title', track.title || 'Unknown Title');
                updateElement('track-artist', track.artist || 'Unknown Artist');
                updateElement('track-album', track.album || 'Unknown Album');

                // Update artwork
                updateArtwork(track.artworkPath);

                // Update status
                updatePlaybackStatus(track.status);

                // Update progress
                if (track.position !== undefined && track.duration !== undefined) {
                    updatePosition(track.position, track.duration);
                }
            }

            function updateElement(className, text) {
                const element = document.querySelector('.' + className);
                if (element) {
                    element.textContent = text;
                    element.title = text; // Add tooltip for long text
                }
            }

            function updateArtwork(artworkPath) {
                const artworkContainer = document.querySelector('.artwork-container');
                if (!artworkContainer) {
                    return;
                }

                // Remove existing artwork
                const existingArtwork = artworkContainer.querySelector('.artwork');
                if (existingArtwork) {
                    existingArtwork.remove();
                }

                const placeholder = artworkContainer.querySelector('.artwork-placeholder');

                if (artworkPath && artworkPath !== 'undefined') {
                    // Create and add artwork image
                    const img = document.createElement('img');
                    img.className = 'artwork';
                    img.src = artworkPath;
                    img.alt = 'Album artwork';

                    img.onload = () => {
                        if (placeholder) {
                            placeholder.style.display = 'none';
                        }
                    };

                    img.onerror = () => {
                        if (placeholder) {
                            placeholder.style.display = 'flex';
                        }
                    };

                    artworkContainer.appendChild(img);
                } else {
                    // Show placeholder
                    if (placeholder) {
                        placeholder.style.display = 'flex';
                    }
                }
            }

            function updatePlaybackStatus(status) {
                const statusIndicator = document.querySelector('.status-indicator');
                const statusIcon = document.querySelector('.status-icon');
                const playPauseBtn = document.getElementById('play-pause-btn');

                // Remove existing status classes
                if (statusIndicator) {
                    statusIndicator.className = 'status-indicator';
                }

                switch (status) {
                    case 'playing':
                        if (statusIndicator) {
                            statusIndicator.classList.add('status-playing');
                        }
                        if (statusIcon) {
                            statusIcon.textContent = '▶️';
                        }
                        if (playPauseBtn) {
                            playPauseBtn.textContent = '⏸️';
                            playPauseBtn.title = 'Pause';
                        }
                        break;

                    case 'paused':
                        if (statusIndicator) {
                            statusIndicator.classList.add('status-paused');
                        }
                        if (statusIcon) {
                            statusIcon.textContent = '⏸️';
                        }
                        if (playPauseBtn) {
                            playPauseBtn.textContent = '▶️';
                            playPauseBtn.title = 'Play';
                        }
                        break;

                    case 'stopped':
                    default:
                        if (statusIndicator) {
                            statusIndicator.classList.add('status-stopped');
                        }
                        if (statusIcon) {
                            statusIcon.textContent = '⏹️';
                        }
                        if (playPauseBtn) {
                            playPauseBtn.textContent = '▶️';
                            playPauseBtn.title = 'Play';
                        }
                        break;
                }
            }

            function updatePosition(position, duration) {
                // Update progress bar
                const progressFill = document.querySelector('.progress-fill');
                if (progressFill && duration > 0) {
                    const percentage = (position / duration) * 100;
                    progressFill.style.width = Math.min(percentage, 100) + '%';
                }

                // Update time displays
                const currentTimeElement = document.querySelector('.current-time');
                const totalTimeElement = document.querySelector('.total-time');

                if (currentTimeElement) {
                    currentTimeElement.textContent = formatTime(position);
                }

                if (totalTimeElement) {
                    totalTimeElement.textContent = formatTime(duration);
                }
            }

            function showNoMusicState() {
                const musicInfo = document.getElementById('music-info');
                const noMusic = document.getElementById('no-music');

                if (musicInfo && noMusic) {
                    musicInfo.classList.add('hidden');
                    noMusic.style.display = 'block';
                }

                currentTrack = null;
            }

            function formatTime(seconds) {
                if (!seconds || seconds < 0) {
                    return '0:00';
                }

                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = Math.floor(seconds % 60);
                return minutes + ':' + remainingSeconds.toString().padStart(2, '0');
            }

            // Debug function
            window.debugWebview = function () {
                console.log('Current track:', currentTrack);
                console.log('Webview ready:', webviewReady);
            };

        })();
    </script>
</body>
</html>`;
    }

    /**
     * Force update the webview with current track info
     */
    public async forceUpdate(): Promise<void> {
        await this.updateWebview();
    }

    /**
     * Show the webview panel
     */
    public show(): void {
        if (this._view) {
            this._view.show?.(true);
        }
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        this.stopPeriodicUpdates();
    }
}