import * as vscode from 'vscode';
import { LinuxMusicService, TrackInfo } from '../musicService';

export class LinuxMusicWebviewProviderWorking implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vsMusicPlayer';

    private _view?: vscode.WebviewView;
    private currentTrack: TrackInfo | null = null;
    private _musicService: LinuxMusicService;
    private _context: vscode.ExtensionContext;
    private _updateTimer?: NodeJS.Timeout;

    constructor(context: vscode.ExtensionContext, musicService: LinuxMusicService) {
        this._context = context;
        this._musicService = musicService;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(this._context.extensionPath),
                vscode.Uri.file('/home') // Allow access to cached artwork files
            ]
        };

        webviewView.webview.html = this.getHtmlForWebview();
        this.setupWebviewMessageHandling();

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
            console.log('Got track info from service:', trackInfo);

            this.currentTrack = trackInfo;
            if (this._view) {
                let artworkUri = '';
                if (trackInfo?.artUrl) {
                    // Convert the artwork file path to webview URI
                    const artworkFileUri = vscode.Uri.parse(trackInfo.artUrl);
                    artworkUri = this._view.webview.asWebviewUri(artworkFileUri).toString();
                    console.log('Converted artwork URI:', artworkUri);
                }

                // Get current position separately
                const currentPosition = await this._musicService.getPosition();
                console.log('Current position:', currentPosition);

                this._view.webview.postMessage({
                    command: 'updateTrack',
                    track: trackInfo,
                    artworkUri: artworkUri,
                    position: currentPosition || 0
                });
                console.log('Posted message to webview');
            }

        } catch (error) {
            console.error('Error updating webview:', error);
        }
    }

    public updatePosition(position: number) {
        if (this._view && this.currentTrack) {
            this._view.webview.postMessage({
                command: 'updateProgress',
                position: position
            });
        }
    }

    private setupWebviewMessageHandling() {
        if (!this._view) {
            return;
        }

        this._view.webview.onDidReceiveMessage(async message => {
            console.log('Webview message received:', message);
            switch (message.command) {
                case 'webviewReady':
                    console.log('Webview ready signal received, updating with current track');
                    await this.updateWebview();
                    break;
                case 'playPause':
                    try {
                        await this._musicService.playPause();
                        setTimeout(() => this.updateWebview(), 100);
                    } catch (error) {
                        console.error('Play/pause error:', error);
                    }
                    break;
                case 'nextTrack':
                    try {
                        await this._musicService.next();
                        setTimeout(() => this.updateWebview(), 100);
                    } catch (error) {
                        console.error('Next track error:', error);
                    }
                    break;
                case 'previousTrack':
                    try {
                        await this._musicService.previous();
                        setTimeout(() => this.updateWebview(), 100);
                    } catch (error) {
                        console.error('Previous track error:', error);
                    }
                    break;
            }
        });
    }

    private getHtmlForWebview(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Music Explorer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 16px;
            min-height: 100vh;
        }
        
        .music-explorer {
            background: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-sideBar-border);
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            margin: 0 auto;
        }
        
        .track-info {
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .artwork-container {
            flex-shrink: 0;
            display: flex;
            justify-content: center;
        }
        
        .artwork {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            object-fit: cover;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            border: 2px solid var(--vscode-sideBar-border);
        }
        
        .artwork-placeholder {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            background: var(--vscode-button-secondaryBackground);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: var(--vscode-button-secondaryForeground);
            border: 2px solid var(--vscode-sideBar-border);
        }
        
        .track-details {
            flex: 1;
            text-align: left;
            min-width: 0; /* Allows text to truncate */
            overflow: hidden; /* Ensure container clips overflow */
        }
        
        .track-title {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 8px;
            color: var(--vscode-editor-foreground);
            line-height: 1.3;
            overflow: hidden;
            white-space: nowrap;
            animation: scroll-text 15s linear infinite;
            padding-right: 20px; /* Add some space for better flow */
        }
        
        .track-artist {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
            font-weight: 500;
            overflow: hidden;
            white-space: nowrap;
            animation: scroll-text 12s linear infinite;
            padding-right: 20px; /* Add some space for better flow */
        }
        
        @keyframes scroll-text {
            0% { transform: translateX(0%); }
            20% { transform: translateX(0%); }
            80% { transform: translateX(calc(-100% + 200px)); }
            100% { transform: translateX(calc(-100% + 200px)); }
        }
        
        /* Pause animation on hover for better readability */
        .track-title:hover,
        .track-artist:hover {
            animation-play-state: paused;
        }
        
        .track-album {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            opacity: 0.8;
        }
        
        .status-indicator {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            font-size: 10px;
            margin-bottom: 8px;
            font-weight: bold;
        }
        
        .status-playing {
            background: var(--vscode-gitDecoration-addedResourceForeground);
            color: var(--vscode-editor-background);
        }
        
        .status-paused {
            background: var(--vscode-gitDecoration-modifiedResourceForeground);
            color: var(--vscode-editor-background);
        }
        
        .status-stopped {
            background: var(--vscode-gitDecoration-deletedResourceForeground);
            color: var(--vscode-editor-background);
        }
        
        .progress-container {
            margin: 16px 0;
        }
        
        .progress-bar {
            width: 100%;
            height: 4px;
            background: var(--vscode-progressBar-background);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 8px;
        }
        
        .progress-fill {
            height: 100%;
            background: var(--vscode-progressBar-foreground);
            border-radius: 2px;
            transition: width 0.5s ease;
        }
        
        .progress-time {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            font-weight: 500;
        }
        
        .controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            margin-top: 16px;
        }
        
        .control-btn {
            width: 36px;
            height: 36px;
            border: none;
            border-radius: 6px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            border: 1px solid var(--vscode-button-border);
        }
        
        .control-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
            transform: translateY(-1px);
        }
        
        .control-btn:active {
            transform: translateY(0);
        }
        
        .control-btn.play-pause {
            width: 44px;
            height: 44px;
            font-size: 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 8px;
        }
        
        .control-btn.play-pause:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .no-music {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
            padding: 32px 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
        }
        
        .no-music-icon {
            font-size: 32px;
            opacity: 0.6;
        }
        
        .music-icon {
            font-size: 24px;
            margin-bottom: 8px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="music-explorer">
        <div id="musicContent">
            <div class="no-music">
                <div class="no-music-icon">🎵</div>
                <div>No music currently playing</div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentTrack = null;
        let currentArtworkUri = '';
        let progressUpdateInterval = null;

        window.addEventListener('message', event => {
            const message = event.data;
            console.log('Webview received message:', message);
            
            switch (message.command) {
                case 'updateTrack':
                    console.log('Processing updateTrack message');
                    currentTrack = message.track;
                    currentArtworkUri = message.artworkUri || '';
                    console.log('Set currentTrack to:', currentTrack);
                    console.log('Set currentArtworkUri to:', currentArtworkUri);
                    updateUI();
                    setupProgressUpdates();
                    break;
                case 'updateProgress':
                    if (currentTrack && message.position !== undefined) {
                        currentTrack.position = message.position;
                        updateProgressOnly();
                    }
                    break;
            }
        });

        function setupProgressUpdates() {
            // Clear any existing interval
            if (progressUpdateInterval) {
                clearInterval(progressUpdateInterval);
                progressUpdateInterval = null;
            }
            
            // Only set up auto-updates if music is playing and has duration
            if (currentTrack && currentTrack.status === 'playing' && currentTrack.duration) {
                progressUpdateInterval = setInterval(() => {
                    if (currentTrack && currentTrack.status === 'playing') {
                        // Increment position by 1 second
                        currentTrack.position = (currentTrack.position || 0) + 1;
                        
                        // Don't exceed duration
                        if (currentTrack.position > currentTrack.duration) {
                            currentTrack.position = currentTrack.duration;
                        }
                        
                        updateProgressOnly();
                    } else {
                        clearInterval(progressUpdateInterval);
                        progressUpdateInterval = null;
                    }
                }, 1000);
            }
        }

        function updateProgressOnly() {
            if (!currentTrack || !currentTrack.duration) return;
            
            const progressPercent = (currentTrack.position || 0) / currentTrack.duration * 100;
            const progressFill = document.querySelector('.progress-fill');
            const currentTimeSpan = document.querySelector('.progress-time span:first-child');
            
            if (progressFill) {
                progressFill.style.width = progressPercent + '%';
            }
            
            if (currentTimeSpan) {
                currentTimeSpan.textContent = formatTime(currentTrack.position || 0);
            }
        }

        function updateUI() {
            console.log('updateUI called with currentTrack:', currentTrack);
            const content = document.getElementById('musicContent');
            console.log('Found content element:', content);
            
            if (!currentTrack) {
                console.log('No current track, showing no music message');
                content.innerHTML = \`
                    <div class="no-music"> 
                        <div class="no-music-icon">🎵</div>
                        <div>No music currently playing</div>
                        <div style="font-size: 12px; opacity: 0.7;">Start any MPRIS-compatible player</div>
                    </div>
                \`;
                return;
            }

            console.log('Updating UI with track info');
            const progressPercent = currentTrack.duration && currentTrack.position 
                ? (currentTrack.position / currentTrack.duration) * 100 
                : 0;

            const statusIcon = currentTrack.status === 'playing' ? '▶' : 
                              currentTrack.status === 'paused' ? '⏸' : '⏹';

            content.innerHTML = \`
                <div class="track-info"> 
                    <div class="artwork-container">
                        \${currentArtworkUri ? 
                            \`<img class="artwork" src="\${currentArtworkUri}" alt="Album artwork" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                             <div class="artwork-placeholder" style="display: none;">🎵</div>\` :
                            \`<div class="artwork-placeholder">🎵</div>\`
                        }
                    </div>
                    <div class="track-details">
                        <div class="status-indicator status-\${currentTrack.status}">
                            \${statusIcon}
                        </div>
                        <div class="track-title">\${currentTrack.title}</div>
                        <div class="track-artist">\${currentTrack.artist}</div>
                        \${currentTrack.album ? \`<div class="track-album">\${currentTrack.album}</div>\` : ''}
                    </div>
                </div>
                
                \${currentTrack.duration ? \`
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: \${progressPercent}%"></div>
                    </div>
                    <div class="progress-time">
                        <span>\${formatTime(currentTrack.position || 0)}</span>
                        <span>\${formatTime(currentTrack.duration)}</span>
                    </div>
                </div>
                \` : ''}
                
                <div class="controls">
                    <button class="control-btn" onclick="sendCommand('previousTrack')" title="Previous Track">⏮</button>
                    <button class="control-btn play-pause" onclick="sendCommand('playPause')" title="Play/Pause">
                        \${currentTrack.status === 'playing' ? '⏸' : '▶'}
                    </button>
                    <button class="control-btn" onclick="sendCommand('nextTrack')" title="Next Track">⏭</button>
                </div>
            \`;
        }

        function formatTime(seconds) {
            if (!seconds) return '0:00';
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return \`\${minutes}:\${remainingSeconds.toString().padStart(2, '0')}\`;
        }

        function sendCommand(command) {
            vscode.postMessage({ command: command });
        }

        // Signal that webview is ready
        console.log('Webview is ready, sending ready message');
        vscode.postMessage({ command: 'webviewReady' });
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