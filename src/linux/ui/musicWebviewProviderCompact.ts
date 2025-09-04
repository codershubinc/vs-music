import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { LinuxMusicService } from '../musicService';
import { ArtworkUtil } from '../utils/artworkUtil';

export class LinuxMusicWebviewProviderCompact implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vsMusicPlayer';

    private _view?: vscode.WebviewView;
    private _musicService: LinuxMusicService;
    private _updateTimer?: NodeJS.Timeout;
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext, musicService: LinuxMusicService) {
        this._context = context;
        this._musicService = musicService;

        // Initialize artwork utility
        ArtworkUtil.initialize(context);
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

        webviewView.webview.html = this._getCompactHtml();

        webviewView.webview.onDidReceiveMessage(
            (message) => {
                this.handleWebviewMessage(message);
            },
            undefined,
            this._context.subscriptions
        );

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

    private async handleWebviewMessage(message: any): Promise<void> {
        try {
            switch (message.command) {
                case 'webviewReady':
                    console.log('Webview ready, sending initial data...');
                    await this.updateWebview();
                    break;

                case 'playPause':
                    await this._musicService.playPause();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                case 'next':
                    await this._musicService.next();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                case 'previous':
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

    private startPeriodicUpdates(): void {
        if (this._updateTimer) {
            return;
        }

        this._updateTimer = setInterval(() => {
            this.updateWebview();
        }, 1000);
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
            const currentPosition = await this._musicService.getPosition();

            if (!trackInfo || !trackInfo.title) {
                this._view.webview.postMessage({
                    command: 'updateTrack',
                    track: null
                });
                return;
            }

            let artworkUri = '';
            if (trackInfo.artUrl) {
                try {
                    // Use the artwork utility to download and cache artwork
                    const cachedArtworkUri = await ArtworkUtil.downloadArtwork(trackInfo.artUrl);
                    if (cachedArtworkUri) {
                        const artworkFileUri = vscode.Uri.parse(cachedArtworkUri);
                        artworkUri = this._view.webview.asWebviewUri(artworkFileUri).toString();
                        console.log('Converted cached artwork URI:', artworkUri);
                    }
                } catch (error) {
                    console.warn('Error processing artwork:', error);
                }
            }

            this._view.webview.postMessage({
                command: 'updateTrack',
                track: trackInfo,
                artworkUri: artworkUri,
                position: currentPosition || 0
            });

        } catch (error) {
            console.error('Error updating webview:', error);
            this._view?.webview.postMessage({
                command: 'updateTrack',
                track: null
            });
        }
    }

    private _getCompactHtml(): string {
        try {
            // Try to read from the dist directory first (packaged extension)
            let htmlPath = path.join(this._context.extensionPath, 'dist', 'src', 'linux', 'ui', 'webview', 'compactPlayer.html');
            let cssPath = path.join(this._context.extensionPath, 'dist', 'src', 'linux', 'ui', 'webview', 'musicPlayer.css');
            let jsPath = path.join(this._context.extensionPath, 'dist', 'src', 'linux', 'ui', 'webview', 'musicPlayer.js');

            if (!fs.existsSync(htmlPath)) {
                // Fallback to src directory (development)
                htmlPath = path.join(this._context.extensionPath, 'src', 'linux', 'ui', 'webview', 'compactPlayer.html');
                cssPath = path.join(this._context.extensionPath, 'src', 'linux', 'ui', 'webview', 'musicPlayer.css');
                jsPath = path.join(this._context.extensionPath, 'src', 'linux', 'ui', 'webview', 'musicPlayer.js');
            }

            console.log('Trying to read HTML from:', htmlPath);
            let htmlContent = fs.readFileSync(htmlPath, 'utf8');

            // Convert file paths to webview URIs
            const cssUri = this._view?.webview.asWebviewUri(vscode.Uri.file(cssPath));
            const jsUri = this._view?.webview.asWebviewUri(vscode.Uri.file(jsPath));

            // Replace relative paths with webview URIs
            htmlContent = htmlContent.replace('href="musicPlayer.css"', `href="${cssUri}"`);
            htmlContent = htmlContent.replace('src="musicPlayer.js"', `src="${jsUri}"`);

            return htmlContent;
        } catch (error) {
            console.error('Error reading compact HTML file:', error);
            return this._getFallbackHtml();
        }
    }

    private _getFallbackHtml(): string {
        return `<html><body><div style='color:red;padding:1em;'>Error loading music player UI.</div></body></html>`;
    }

    public async forceUpdate(): Promise<void> {
        await this.updateWebview();
    }

    public show(): void {
        if (this._view) {
            this._view.show?.(true);
        }
    }

    public dispose(): void {
        this.stopPeriodicUpdates();
    }
}
