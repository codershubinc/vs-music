import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { ArtworkUtil } from '../../linux/utils/artworkUtil';
import { IMusicController } from '../models/models';
import { MusicControllerFactory } from '../musicControllerFactory';

// Unified webview provider that works across all platforms using platform-specific controllers
export class MusicWebviewProvider implements vscode.WebviewViewProvider {
    // Unique identifier for webview type, must match package.json
    public static readonly viewType = 'vsMusicPlayer';

    private _view?: vscode.WebviewView;
    private _controller: IMusicController | null;
    private _updateTimer?: NodeJS.Timeout;
    private _context: vscode.ExtensionContext;

    // Initialize webview provider and platform-specific music controller
    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        // Use factory to get the correct controller
        this._controller = MusicControllerFactory.create(context, this._view?.webview);
    }

    // Called by VS Code when webview needs to be displayed - sets up content and event handlers
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        this._controller = MusicControllerFactory.create(this._context, this._view?.webview);

        // Configure webview security permissions
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(this._context.extensionPath),
                vscode.Uri.file('/home')
            ]
        };

        webviewView.webview.html = this._getHtml();

        // Set up message handling for webview communication
        webviewView.webview.onDidReceiveMessage(
            (message) => {
                this.handleWebviewMessage(message);
            },
            undefined,
            this._context.subscriptions
        );

        // Start/stop updates based on visibility
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this.startPeriodicUpdates();
                this.updateWebview();
            } else {
                this.stopPeriodicUpdates();
            }
        });

        if (webviewView.visible) {
            this.startPeriodicUpdates();
            this.updateWebview();
        }
    }

    // Handle user interactions from webview (play/pause, next, previous buttons)
    private async handleWebviewMessage(message: any): Promise<void> {
        try {
            switch (message.command) {
                case 'webviewReady':
                    console.log('🎵 Webview ready, sending initial music data...');
                    await this.updateWebview();
                    break;

                case 'playPause':
                    console.log('🎵 User triggered play/pause');
                    await this._controller?.playPause();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                case 'next':
                    console.log('🎵 User triggered next track');
                    await this._controller?.next();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                case 'previous':
                    console.log('🎵 User triggered previous track');
                    await this._controller?.previous();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                default:
                    console.warn(`❌ Unknown webview message command: ${message.command}`);
            }
        } catch (error) {
            console.error('💥 Error handling webview message:', error);
            vscode.window.showErrorMessage(`Music control error: ${error}`);
        }
    }

    // Start polling for music updates every 1 second
    private startPeriodicUpdates(): void {
        if (this._updateTimer) {
            return;
        }

        console.log('▶️ Starting periodic music updates (1 second interval)');
        this._updateTimer = setInterval(() => {
            this.updateWebview();
        }, 1000);
    }

    // Stop periodic updates to save resources
    private stopPeriodicUpdates(): void {
        if (this._updateTimer) {
            console.log('⏹️ Stopping periodic music updates');
            clearInterval(this._updateTimer);
            this._updateTimer = undefined;
        }
    }

    // Fetch current music data and send to webview for UI updates
    private async updateWebview(): Promise<void> {
        if (!this._view || !this._view.visible) {
            return;
        }

        try {
            const trackInfo = await this._controller?.getCurrentTrack();
            const currentPosition = await this._controller?.getPosition();

            if (process.platform === 'win32') {
                return;
            }
            // Handle no music playing state
            if (!trackInfo || !trackInfo.title) {
                this._view.webview.postMessage({
                    command: 'updateTrack',
                    track: null
                });
                return;
            }

            // Prefer to get local path from ArtworkUtil and provide both a webview URI
            // and a base64 data-URI fallback (data URI helps when the CDN mapping fails)
            let webviewArtworkUri = '';
            let artworkDataUri = '';

            try {
                const localPath = await ArtworkUtil.downloadArtwork(trackInfo.artUrl || '');
                if (localPath) {
                    try {
                        const fileUri = vscode.Uri.file(localPath);
                        webviewArtworkUri = this._view!.webview.asWebviewUri(fileUri).toString();
                    } catch {
                        webviewArtworkUri = '';
                    }

                    try {
                        // Synchronous read here is acceptable because updates are infrequent and small images
                        const buffer = fs.readFileSync(localPath);
                        const ext = path.extname(localPath).toLowerCase();
                        let mime = 'image/jpeg';
                        if (ext === '.png') mime = 'image/png';
                        else if (ext === '.webp') mime = 'image/webp';
                        else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';

                        artworkDataUri = `data:${mime};base64,${buffer.toString('base64')}`;
                    } catch {
                        artworkDataUri = '';
                    }
                }
            } catch (err) {
                webviewArtworkUri = '';
                artworkDataUri = '';
            }

            // Send updated data to webview (include both URIs; webview prefers data URI if provided)
            this._view.webview.postMessage({
                command: 'updateTrack',
                track: trackInfo,
                artworkUri: webviewArtworkUri,
                artworkDataUri: artworkDataUri,
                position: currentPosition || 0,
                showProgressBar: this.getShowProgressBar()
            });

        } catch (error) {
            console.error('💥 Error updating webview:', error);
            this._view?.webview.postMessage({
                command: 'updateTrack',
                track: null
            });
        }
    }

    // Load and process HTML content with proper webview URIs for CSS/JS files
    private _getHtml(): string {
        try {
            // Try packaged extension paths first (dist/), fallback to src/ for development
            let htmlPath = path.join(this._context.extensionPath, 'dist', 'src', 'common', 'ui', 'webview', 'musicPlayer.html');
            let cssPath = path.join(this._context.extensionPath, 'dist', 'src', 'common', 'ui', 'webview', 'static', 'css', 'musicPlayer.css');
            let jsPath = path.join(this._context.extensionPath, 'dist', 'src', 'common', 'ui', 'webview', 'static', 'js', 'utils', 'musicPlayer.js');

            if (!fs.existsSync(htmlPath)) {
                console.log('📁 Dist files not found, using development paths');
                htmlPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'musicPlayer.html');
                cssPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'musicPlayer.css');
                jsPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'musicPlayer.js');
            }

            let htmlContent = fs.readFileSync(htmlPath, 'utf8');

            // Convert file paths to webview-compatible URIs
            const cssUri = this._view?.webview.asWebviewUri(vscode.Uri.file(cssPath));
            const jsUri = this._view?.webview.asWebviewUri(vscode.Uri.file(jsPath));

            // Replace placeholders with actual URIs
            htmlContent = htmlContent.replace(/\{\{\s*cssUri\s*\}\}/g, cssUri ? cssUri.toString() : '');
            htmlContent = htmlContent.replace(/\{\{\s*jsUri\s*\}\}/g, jsUri ? jsUri.toString() : '');

            return htmlContent;

        } catch (error) {
            console.error('💥 Error loading HTML files:', error);
            return `
                <html>
                <head>
                    <style>
                        body { 
                            font-family: var(--vscode-font-family); 
                            color: var(--vscode-errorForeground); 
                            padding: 20px; 
                            text-align: center; 
                        }
                    </style>
                </head>
                <body>
                    <h3>⚠️ Music Player Error</h3>
                    <p>Unable to load music player interface.</p>
                    <p>Error: ${error}</p>
                    <p>Try reloading VS Code or reinstalling the extension.</p>
                </body>
                </html>
            `;
        }
    }
    // Get user setting for progress bar visibility
    private getShowProgressBar(): boolean {
        const config = vscode.workspace.getConfiguration('music');
        return config.get<boolean>('showProgressBar', true);
    }

    // Force immediate webview update
    public async forceUpdate(): Promise<void> {
        console.log('🔄 Force updating webview...');
        await this.updateWebview();
    }

    // Show webview panel
    public show(): void {
        if (this._view) {
            this._view.show?.(true);
            console.log('👁️ Showing music player webview');
        }
    }

    // Clean up resources when extension deactivates
    public dispose(): void {
        console.log('🧹 Disposing music webview provider...');
        this.stopPeriodicUpdates();
        this._controller?.dispose();
        this._view = undefined;
        console.log('✅ Music webview provider disposed successfully');
    }
}