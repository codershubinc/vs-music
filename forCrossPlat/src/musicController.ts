import * as vscode from 'vscode';
import { CrossPlatformMusicService, TrackInfo } from './musicService';

export class MusicController implements vscode.Disposable {
    private musicService: CrossPlatformMusicService;
    private statusBarItem: vscode.StatusBarItem;
    private musicWebviewProvider: MusicWebviewProvider;
    private disposables: vscode.Disposable[] = [];
    private cornerWidget: vscode.StatusBarItem | null = null;

    constructor(private context: vscode.ExtensionContext) {
        this.musicService = new CrossPlatformMusicService();
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
        this.musicWebviewProvider = new MusicWebviewProvider(context.extensionUri, this.musicService);

        this.initializeComponents();
        this.registerCommands();
        this.setupEventHandlers();
    }

    private initializeComponents() {
        // Register webview provider
        const provider = vscode.window.registerWebviewViewProvider(
            'musicExplorer',
            this.musicWebviewProvider
        );
        this.disposables.push(provider);

        // Initialize status bar
        this.updateStatusBar(null);
        const config = vscode.workspace.getConfiguration('music');
        if (config.get<boolean>('showInStatusBar', true)) {
            this.statusBarItem.show();
        }

        // Initialize corner widget if enabled
        if (config.get<boolean>('enableCornerWidget', true)) {
            this.showCornerWidget();
        }

        this.disposables.push(this.statusBarItem);
    }

    private registerCommands() {
        const commands = [
            vscode.commands.registerCommand('music.showCornerWidget', () => this.showCornerWidget()),
            vscode.commands.registerCommand('music.hideCornerWidget', () => this.hideCornerWidget()),
            vscode.commands.registerCommand('music.showMusicPanel', () => this.showMusicPanel()),
            vscode.commands.registerCommand('music.playPause', () => this.musicService.playPause()),
            vscode.commands.registerCommand('music.nextTrack', () => this.musicService.nextTrack()),
            vscode.commands.registerCommand('music.previousTrack', () => this.musicService.previousTrack()),
            vscode.commands.registerCommand('music.refreshMusicExplorer', () => this.musicWebviewProvider.refresh())
        ];

        this.disposables.push(...commands);
    }

    private setupEventHandlers() {
        // Listen for track changes
        this.musicService.onTrackChanged((track) => {
            this.updateStatusBar(track);
            this.updateCornerWidget(track);
            this.musicWebviewProvider.updateTrack(track);
        });

        // Listen for position changes
        this.musicService.onPositionChanged((position) => {
            this.musicWebviewProvider.updatePosition(position);
        });

        // Listen for configuration changes
        const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('music')) {
                this.handleConfigurationChange();
            }
        });
        this.disposables.push(configListener);
    }

    private updateStatusBar(track: TrackInfo | null) {
        const config = vscode.workspace.getConfiguration('music');

        if (!config.get<boolean>('showInStatusBar', true)) {
            this.statusBarItem.hide();
            return;
        }

        if (track && track.status !== 'stopped') {
            const statusIcon = track.status === 'playing' ? '$(play)' : '$(debug-pause)';
            const text = `${statusIcon} ${track.title} - ${track.artist}`;
            this.statusBarItem.text = text;
            this.statusBarItem.tooltip = `${track.title}\n${track.artist}\n${track.album}`;
            this.statusBarItem.command = 'music.showMusicPanel';
            this.statusBarItem.show();
        } else {
            this.statusBarItem.text = '$(music) No music playing';
            this.statusBarItem.tooltip = 'No music currently playing';
            this.statusBarItem.command = 'music.showMusicPanel';
            this.statusBarItem.show();
        }
    }

    private updateCornerWidget(track: TrackInfo | null) {
        if (!this.cornerWidget) {
            return;
        }

        if (track && track.status !== 'stopped') {
            const statusIcon = track.status === 'playing' ? '♪' : '⏸';
            this.cornerWidget.text = `${statusIcon} ${track.title}`;
            this.cornerWidget.tooltip = `${track.title} - ${track.artist}`;
        } else {
            this.cornerWidget.text = '♪ No music';
            this.cornerWidget.tooltip = 'No music playing';
        }
    }

    private showCornerWidget() {
        if (!this.cornerWidget) {
            this.cornerWidget = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
            this.cornerWidget.command = 'music.showMusicPanel';
        }

        const currentTrack = this.musicService.getCurrentTrack();
        this.updateCornerWidget(currentTrack);
        this.cornerWidget.show();

        vscode.window.showInformationMessage('Music corner widget is now visible');
    }

    private hideCornerWidget() {
        if (this.cornerWidget) {
            this.cornerWidget.hide();
            vscode.window.showInformationMessage('Music corner widget is now hidden');
        }
    }

    private showMusicPanel() {
        vscode.commands.executeCommand('musicExplorer.focus');
    }

    private handleConfigurationChange() {
        const config = vscode.workspace.getConfiguration('music');

        // Handle status bar visibility
        if (config.get<boolean>('showInStatusBar', true)) {
            this.statusBarItem.show();
        } else {
            this.statusBarItem.hide();
        }

        // Handle corner widget
        if (config.get<boolean>('enableCornerWidget', true) && !this.cornerWidget) {
            this.showCornerWidget();
        } else if (!config.get<boolean>('enableCornerWidget', true) && this.cornerWidget) {
            this.hideCornerWidget();
        }
    }

    public dispose() {
        this.musicService.dispose();
        this.disposables.forEach(d => d.dispose());
        if (this.cornerWidget) {
            this.cornerWidget.dispose();
        }
    }
}

class MusicWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private currentTrack: TrackInfo | null = null;
    private currentPosition: number = 0;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private musicService: CrossPlatformMusicService
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'playPause':
                    await this.musicService.playPause();
                    break;
                case 'nextTrack':
                    await this.musicService.nextTrack();
                    break;
                case 'previousTrack':
                    await this.musicService.previousTrack();
                    break;
            }
        });
    }

    public updateTrack(track: TrackInfo | null) {
        this.currentTrack = track;
        this._updateWebview();
    }

    public updatePosition(position: number) {
        this.currentPosition = position;
        this._updateWebview();
    }

    public refresh() {
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        }
    }

    private _updateWebview() {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'updateTrack',
                track: this.currentTrack,
                position: this.currentPosition
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Music Player</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            margin: 0;
            padding: 16px;
        }
        
        .music-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .track-info {
            text-align: center;
            padding: 12px;
            background-color: var(--vscode-editor-background);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .track-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .track-artist {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
            margin-bottom: 2px;
        }
        
        .track-album {
            color: var(--vscode-descriptionForeground);
            font-size: 11px;
        }
        
        .progress-container {
            margin: 8px 0;
        }
        
        .progress-bar {
            width: 100%;
            height: 4px;
            background-color: var(--vscode-progressBar-background);
            border-radius: 2px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background-color: var(--vscode-progressBar-background);
            transition: width 0.3s ease;
        }
        
        .time-info {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        
        .controls {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 12px;
        }
        
        .control-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 12px;
            transition: background-color 0.2s;
        }
        
        .control-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .control-btn:active {
            transform: scale(0.95);
        }
        
        .no-music {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            padding: 24px;
        }
        
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 6px;
        }
        
        .status-playing {
            background-color: var(--vscode-testing-iconPassed);
            animation: pulse 1.5s infinite;
        }
        
        .status-paused {
            background-color: var(--vscode-testing-iconQueued);
        }
        
        .status-stopped {
            background-color: var(--vscode-testing-iconFailed);
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="music-container">
        <div id="trackInfo" class="no-music">
            No music currently playing
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        let currentTrack = null;
        let currentPosition = 0;

        function formatTime(seconds) {
            if (!seconds || isNaN(seconds)) return '--:--';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return mins + ':' + (secs < 10 ? '0' : '') + secs;
        }

        function updateUI() {
            const container = document.getElementById('trackInfo');
            
            if (!currentTrack || currentTrack.status === 'stopped') {
                container.className = 'no-music';
                container.innerHTML = 'No music currently playing';
                return;
            }

            const progressPercent = currentTrack.duration ? 
                (currentPosition / currentTrack.duration) * 100 : 0;

            container.className = 'track-info';
            container.innerHTML = \`
                <div class="track-title">
                    <span class="status-indicator status-\${currentTrack.status}"></span>
                    \${currentTrack.title}
                </div>
                <div class="track-artist">\${currentTrack.artist}</div>
                <div class="track-album">\${currentTrack.album}</div>
                
                \${currentTrack.duration ? \`
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: \${progressPercent}%"></div>
                    </div>
                    <div class="time-info">
                        <span>\${formatTime(currentPosition)}</span>
                        <span>\${formatTime(currentTrack.duration)}</span>
                    </div>
                </div>
                \` : ''}
                
                <div class="controls">
                    <button class="control-btn" onclick="sendCommand('previousTrack')">⏮</button>
                    <button class="control-btn" onclick="sendCommand('playPause')">
                        \${currentTrack.status === 'playing' ? '⏸' : '▶'}
                    </button>
                    <button class="control-btn" onclick="sendCommand('nextTrack')">⏭</button>
                </div>
            \`;
        }

        function sendCommand(command) {
            vscode.postMessage({ type: command });
        }

        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'updateTrack') {
                currentTrack = message.track;
                currentPosition = message.position || 0;
                updateUI();
            }
        });

        // Initial UI setup
        updateUI();
    </script>
</body>
</html>`;
    }
}