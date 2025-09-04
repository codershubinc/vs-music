import * as vscode from 'vscode';

/**
 * Windows placeholder music webview provider
 * Currently shows "coming soon" message for Windows users
 */
export class WindowsMusicWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vsMusicPlayer';

    private _view?: vscode.WebviewView;
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: []
        };

        webviewView.webview.html = this._getHtmlForWebview();
    }

    private _getHtmlForWebview(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
    <title>VS Music Player - Windows</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 30px 20px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 300px;
            margin: 0;
        }
        
        .coming-soon-container {
            max-width: 300px;
        }
        
        .icon {
            font-size: 48px;
            margin-bottom: 20px;
            opacity: 0.7;
        }
        
        .title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            color: var(--vscode-titleBar-activeForeground);
        }
        
        .message {
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 20px;
            color: var(--vscode-descriptionForeground);
        }
        
        .feature-list {
            font-size: 12px;
            text-align: left;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
            padding: 15px;
            margin-top: 15px;
        }
        
        .feature-list h4 {
            margin: 0 0 10px 0;
            font-size: 13px;
            color: var(--vscode-titleBar-activeForeground);
        }
        
        .feature-list ul {
            margin: 0;
            padding-left: 20px;
        }
        
        .feature-list li {
            margin-bottom: 5px;
            color: var(--vscode-descriptionForeground);
        }
        
        .platform-note {
            font-size: 11px;
            color: var(--vscode-textBlockQuote-foreground);
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textBlockQuote-border);
            padding: 10px;
            margin-top: 15px;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="coming-soon-container">
        <div class="icon">🎵</div>
        <div class="title">Windows Support Coming Soon</div>
        <div class="message">
            Music player integration for Windows is currently in development. 
            We're working on supporting Windows Media Player and other popular music applications.
        </div>
        
        <div class="feature-list">
            <h4>Planned Features:</h4>
            <ul>
                <li>Windows Media Player integration</li>
                <li>Spotify for Windows support</li>
                <li>iTunes/Apple Music support</li>
                <li>Universal Windows app detection</li>
                <li>Media key control</li>
            </ul>
        </div>
        
        <div class="platform-note">
            <strong>Currently available:</strong> Linux support with playerctl/MPRIS integration for most music players including Spotify, VLC, Rhythmbox, and more.
        </div>
    </div>
</body>
</html>`;
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
        // Nothing to clean up for now
    }
}