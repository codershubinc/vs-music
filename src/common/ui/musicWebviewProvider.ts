import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Import platform-specific controllers
import LinuxMusicController from '../../linux/index';
// TODO: Import WindowsMusicController when implemented

/**
 * Common Music Webview Provider
 * Uses platform-specific controllers for cross-platform compatibility
 */
export class MusicWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vsMusicPlayer';

    private _view?: vscode.WebviewView;
    private _controller: LinuxMusicController; // Will be union type when Windows is added
    private _updateTimer?: NodeJS.Timeout;
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;

        // Initialize platform-specific controller
        const platform = os.platform();
        switch (platform) {
            case 'linux':
                this._controller = new LinuxMusicController(context);
                break;
            // case 'win32':
            //     this._controller = new WindowsMusicController(context);
            //     break;
            default:
                // Fallback to Linux controller for now
                this._controller = new LinuxMusicController(context);
                console.warn(`Platform ${platform} not fully supported, using Linux controller`);
                break;
        }
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

        webviewView.webview.html = this._getHtml();

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
                    await this._controller.playPause();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                case 'next':
                    await this._controller.next();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                case 'previous':
                    await this._controller.previous();
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
            const trackInfo = await this._controller.getCurrentTrack();
            const currentPosition = await this._controller.getPosition();

            if (!trackInfo || !trackInfo.title) {
                this._view.webview.postMessage({
                    command: 'updateTrack',
                    track: null
                });
                return;
            }

            // Use controller's artwork processing
            const artworkUri = await this._controller.getArtworkUri(
                trackInfo.artUrl || '',
                this._view.webview
            );

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

    private _getHtml(): string {
        try {
            // Try to read from the dist directory first (packaged extension)
            let htmlPath = path.join(this._context.extensionPath, 'dist', 'src', 'common', 'ui', 'webview', 'compactPlayer.html');
            let cssPath = path.join(this._context.extensionPath, 'dist', 'src', 'common', 'ui', 'webview', 'musicPlayer.css');
            let jsPath = path.join(this._context.extensionPath, 'dist', 'src', 'common', 'ui', 'webview', 'musicPlayer.js');

            if (!fs.existsSync(htmlPath)) {
                // Fallback to src directory (development)
                htmlPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'compactPlayer.html');
                cssPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'musicPlayer.css');
                jsPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'musicPlayer.js');
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
            console.error('Error reading HTML file:', error);
            return `<html><body><div style='color:red;padding:1em;'>Error loading music player UI.</div></body></html>`;
        }
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
        this._controller.dispose();
    }
}