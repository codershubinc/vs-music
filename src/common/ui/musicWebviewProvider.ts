import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Import platform-specific controllers
import LinuxMusicController from '../../linux/index';
// TODO: Import WindowsMusicController when implemented

/**
 * ========================================================================
 * COMMON MUSIC WEBVIEW PROVIDER
 * ========================================================================
 * 
 * This is the UNIFIED webview provider that works across all platforms.
 * It abstracts away platform differences by using platform-specific controllers.
 * 
 * ARCHITECTURE BENEFITS:
 * ----------------------
 * 1. Single UI codebase - No need to maintain separate Linux/Windows webviews
 * 2. Platform abstraction - Controllers handle OS-specific music integration
 * 3. Consistent user experience - Same interface on all platforms
 * 4. Easy maintenance - Changes to UI only need to be made in one place
 * 
 * HOW IT WORKS:
 * -------------
 * 1. Constructor detects the operating system (Linux/Windows/macOS)
 * 2. Initializes appropriate platform-specific controller
 * 3. Uses controller methods for all music operations
 * 4. Renders shared HTML/CSS/JS webview interface
 * 
 * DATA FLOW:
 * ----------
 * User clicks button in webview → handleWebviewMessage() → 
 * Controller method (playPause, next, etc.) → Platform-specific implementation
 * 
 * Controller updates → updateWebview() → Send data to webview →
 * JavaScript updates UI elements
 */
export class MusicWebviewProvider implements vscode.WebviewViewProvider {
    /**
     * STATIC PROPERTIES
     * =================
     * viewType: Unique identifier for this webview type in VS Code
     * Must match the "id" in package.json's contributes.views section
     */
    public static readonly viewType = 'vsMusicPlayer';

    /**
     * PRIVATE PROPERTIES
     * ==================
     */
    private _view?: vscode.WebviewView;           // Reference to the actual webview instance
    private _controller: LinuxMusicController;    // Platform-specific music controller (will be union type when Windows is added)
    private _updateTimer?: NodeJS.Timeout;       // Timer for periodic UI updates (every 1 second)
    private _context: vscode.ExtensionContext;    // VS Code extension context for accessing resources

    /**
     * CONSTRUCTOR
     * ===========
     * Initializes the webview provider and detects the platform to create
     * the appropriate music controller.
     * 
     * PLATFORM DETECTION LOGIC:
     * - Linux: Uses LinuxMusicController (MPRIS/playerctl integration)
     * - Windows: Will use WindowsMusicController (SMTC integration) [TODO]
     * - macOS: Falls back to LinuxMusicController for now
     */
    constructor(context: vscode.ExtensionContext) {
        this._context = context;

        /**
         * PLATFORM-SPECIFIC CONTROLLER INITIALIZATION
         * ============================================
         * This is where the magic happens! We detect the operating system
         * and create the appropriate controller that knows how to talk to
         * that platform's music system.
         * 
         * Why this approach?
         * - Linux uses MPRIS (Media Player Remote Interfacing Specification)
         * - Windows uses SMTC (System Media Transport Controls) 
         * - macOS has its own APIs
         * 
         * Each platform has completely different ways to:
         * - Get current track info
         * - Control playback (play/pause/next/previous)
         * - Access album artwork
         * 
         * By using controllers, this webview doesn't need to know about
         * these differences - it just calls controller.playPause() and
         * the controller handles the platform-specific implementation.
         */
        const platform = os.platform();
        switch (platform) {
            case 'linux':
                this._controller = new LinuxMusicController(context);
                console.log('🐧 Initialized Linux music controller (MPRIS/playerctl)');
                break;
            // case 'win32':
            //     this._controller = new WindowsMusicController(context);
            //     console.log('🪟 Initialized Windows music controller (SMTC)');
            //     break;
            default:
                // Fallback to Linux controller for now
                this._controller = new LinuxMusicController(context);
                console.warn(`⚠️ Platform ${platform} not fully supported, using Linux controller as fallback`);
                break;
        }
    }

    /**
     * WEBVIEW RESOLUTION & INITIALIZATION
     * ===================================
     * This method is called by VS Code when the webview needs to be displayed.
     * It's where we set up the webview's security settings, content, and event handlers.
     * 
     * WEBVIEW LIFECYCLE:
     * 1. VS Code calls resolveWebviewView() when user opens the music panel
     * 2. We configure security permissions and load HTML content
     * 3. Set up bidirectional communication (webview ↔ extension)
     * 4. Start periodic updates to keep UI in sync with music player
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        /**
         * WEBVIEW SECURITY CONFIGURATION
         * ===============================
         * VS Code webviews have strict security by default (like web browsers).
         * We need to explicitly grant permissions for what the webview can do.
         */
        webviewView.webview.options = {
            // Allow JavaScript execution in the webview (needed for our music player controls)
            enableScripts: true,

            // Define which local directories the webview can access
            // This is CRITICAL for displaying album artwork and loading CSS/JS files
            localResourceRoots: [
                vscode.Uri.file(this._context.extensionPath), // Extension's own files (CSS, JS, HTML)
                vscode.Uri.file('/home')                      // User's home directory (for cached album art)
            ]
        };

        // Load the HTML content (with embedded CSS and JS references)
        webviewView.webview.html = this._getHtml();

        /**
         * WEBVIEW MESSAGE HANDLING SETUP
         * ===============================
         * This creates a communication channel between the webview (frontend)
         * and the extension (backend). When user clicks buttons in the webview,
         * messages are sent here for processing.
         */
        webviewView.webview.onDidReceiveMessage(
            (message) => {
                this.handleWebviewMessage(message);
            },
            undefined,
            this._context.subscriptions  // Automatically dispose when extension deactivates
        );

        /**
         * VISIBILITY CHANGE HANDLING
         * ===========================
         * Performance optimization: only update the webview when it's visible.
         * No point in fetching music data if the panel is collapsed/hidden.
         */
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this.startPeriodicUpdates();  // Start polling for music updates
                this.updateWebview();         // Immediate update to show current state
            } else {
                this.stopPeriodicUpdates();   // Stop polling to save resources
            }
        });

        // If the webview is initially visible, start updating immediately
        if (webviewView.visible) {
            this.startPeriodicUpdates();
            this.updateWebview();
        }
    }

    /**
     * WEBVIEW MESSAGE HANDLER
     * =======================
     * This is the "command center" that processes all user interactions from the webview.
     * When a user clicks a button in the music player UI, it sends a message here.
     * 
     * MESSAGE FLOW:
     * 1. User clicks "Play" button in webview
     * 2. JavaScript in webview calls: vscode.postMessage({command: 'playPause'})
     * 3. This method receives the message and calls appropriate controller method
     * 4. Controller executes platform-specific command (e.g., playerctl play-pause)
     * 5. UI is updated to reflect the change
     * 
     * SUPPORTED COMMANDS:
     * - webviewReady: Initial handshake when webview loads
     * - playPause: Toggle play/pause state
     * - next: Skip to next track  
     * - previous: Go to previous track
     */
    private async handleWebviewMessage(message: any): Promise<void> {
        try {
            switch (message.command) {
                case 'webviewReady':
                    // Webview JavaScript has loaded and is ready to receive data
                    console.log('🎵 Webview ready, sending initial music data...');
                    await this.updateWebview();
                    break;

                case 'playPause':
                    // User clicked the play/pause button
                    console.log('🎵 User triggered play/pause');
                    await this._controller.playPause();
                    // Small delay to allow the music player to update its state
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                case 'next':
                    // User clicked the next track button
                    console.log('🎵 User triggered next track');
                    await this._controller.next();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                case 'previous':
                    // User clicked the previous track button
                    console.log('🎵 User triggered previous track');
                    await this._controller.previous();
                    setTimeout(() => this.updateWebview(), 100);
                    break;

                default:
                    // Unknown command - might be a bug or future feature
                    console.warn(`❌ Unknown webview message command: ${message.command}`);
            }
        } catch (error) {
            // Handle any errors gracefully - don't crash the extension
            console.error('💥 Error handling webview message:', error);
            vscode.window.showErrorMessage(`Music control error: ${error}`);
        }
    }

    /**
     * PERIODIC UPDATE TIMER MANAGEMENT
     * ================================
     * These methods manage the automatic updating of the music player UI.
     * We poll the music player every 1 second to get current track info and position.
     * 
     * Why polling instead of events?
     * - Not all music players send real-time events
     * - Progress bar needs smooth updates (position changes every second)
     * - Simple and reliable approach that works with any music player
     */

    /**
     * Start polling for music updates every 1 second
     * Only starts if not already running (prevents multiple timers)
     */
    private startPeriodicUpdates(): void {
        if (this._updateTimer) {
            return; // Already running, don't create another timer
        }

        console.log('▶️ Starting periodic music updates (1 second interval)');
        this._updateTimer = setInterval(() => {
            this.updateWebview(); // Update UI with latest music info
        }, 1000); // 1000ms = 1 second
    }

    /**
     * Stop the periodic updates to save system resources
     * Called when webview is hidden or extension is deactivated
     */
    private stopPeriodicUpdates(): void {
        if (this._updateTimer) {
            console.log('⏹️ Stopping periodic music updates');
            clearInterval(this._updateTimer);
            this._updateTimer = undefined;
        }
    }

    /**
     * CORE UI UPDATE METHOD
     * =====================
     * This is the heart of the music player - it fetches current music data
     * from the controller and sends it to the webview for display.
     * 
     * UPDATE PROCESS:
     * 1. Check if webview is visible (no point updating hidden UI)
     * 2. Get current track info from controller (title, artist, album, etc.)
     * 3. Get current playback position for progress bar
     * 4. Process album artwork (download/cache if needed)
     * 5. Send all data to webview JavaScript for UI updates
     * 
     * DATA SENT TO WEBVIEW:
     * - command: 'updateTrack' (tells JS what kind of message this is)
     * - track: Full track information object
     * - artworkUri: VS Code-compatible URI for album artwork
     * - position: Current playback position in seconds
     */
    private async updateWebview(): Promise<void> {
        // Don't waste resources updating hidden webviews
        if (!this._view || !this._view.visible) {
            return;
        }

        try {
            /**
             * FETCH CURRENT MUSIC DATA
             * ========================
             * Ask the controller for the current track and playback position.
             * The controller handles all the platform-specific complexity of
             * talking to the music player (MPRIS on Linux, SMTC on Windows, etc.)
             */
            const trackInfo = await this._controller.getCurrentTrack();
            const currentPosition = await this._controller.getPosition();

            /**
             * HANDLE "NO MUSIC PLAYING" STATE
             * ===============================
             * If no music is playing, send null track to webview.
             * The JavaScript will hide the music info and show "No music playing" message.
             */
            if (!trackInfo || !trackInfo.title) {
                this._view.webview.postMessage({
                    command: 'updateTrack',
                    track: null // null means "no music playing"
                });
                return;
            }

            /**
             * ARTWORK PROCESSING
             * ==================
             * This is where the magic happens for album artwork!
             * The controller's getArtworkUri method:
             * 1. Downloads artwork from URLs or copies from local files
             * 2. Caches artwork to avoid re-downloading
             * 3. Converts to VS Code webview-compatible URIs
             * 4. Handles all the 401/403 errors and security restrictions
             * 
             * Why this is complex:
             * - Music players provide artwork in different formats (file://, http://, etc.)
             * - VS Code webviews have strict security that blocks many URLs
             * - We need to download/copy artwork to extension storage
             * - Must convert to special vscode-resource:// URLs for webview access
             */
            const artworkUri = await this._controller.getArtworkUri(
                trackInfo.artUrl || '',  // URL/path from music player
                this._view.webview       // Webview instance for URI conversion
            );

            /**
             * SEND UPDATED DATA TO WEBVIEW
             * ============================
             * Package all the music data and send to webview JavaScript.
             * The webview's message handler will update the UI elements:
             * - Track title, artist, album text
             * - Album artwork image
             * - Play/pause button state
             * - Progress bar position
             * - Current time display
             */
            this._view.webview.postMessage({
                command: 'updateTrack',           // Message type
                track: trackInfo,                 // Full track object
                artworkUri: artworkUri,           // Processed artwork URI
                position: currentPosition || 0    // Playback position in seconds
            });

            // Log successful update (helpful for debugging)
            console.log(`🎵 Updated webview: "${trackInfo.title}" by ${trackInfo.artist} (${Math.floor(currentPosition || 0)}s)`);

        } catch (error) {
            /**
             * ERROR HANDLING
             * ==============
             * If anything goes wrong (music player crashes, permission issues, etc.),
             * gracefully handle it by showing "no music" state instead of crashing.
             */
            console.error('💥 Error updating webview:', error);
            this._view?.webview.postMessage({
                command: 'updateTrack',
                track: null // Fallback to "no music" state
            });
        }
    }

    /**
     * HTML CONTENT GENERATION
     * =======================
     * This method loads and processes the webview's HTML content.
     * It handles the complexity of loading external CSS and JS files
     * while dealing with VS Code's security restrictions.
     * 
     * FILE LOADING STRATEGY:
     * 1. Try dist/ directory first (packaged extension)
     * 2. Fall back to src/ directory (development mode)
     * 3. Convert file paths to webview-compatible URIs
     * 4. Replace relative paths in HTML with absolute webview URIs
     * 
     * WHY THIS IS COMPLEX:
     * - VS Code extensions can run from different locations (dev vs packaged)
     * - Webviews can't access files using normal file:// paths
     * - Need special vscode-webview-resource:// URIs for security
     * - Must handle both development and production environments
     */
    private _getHtml(): string {
        try {
            /**
             * DETERMINE FILE PATHS
             * ===================
             * Build paths to HTML, CSS, and JS files for both packaged and development modes
             */
            // Try packaged extension paths first (dist/ directory)
            let htmlPath = path.join(this._context.extensionPath, 'dist', 'src', 'common', 'ui', 'webview', 'musicPlayer.html');
            let cssPath = path.join(this._context.extensionPath, 'dist', 'src', 'common', 'ui', 'webview', 'static', 'css', 'musicPlayer.css');
            let jsPath = path.join(this._context.extensionPath, 'dist', 'src', 'common', 'ui', 'webview', 'static', 'js', 'utils', 'musicPlayer.js');

            console.log('📁 Checking for HTML file at:', htmlPath);
            console.log('📁 Checking for CSS file at:', cssPath);
            console.log('📁 Checking for JS file at:', jsPath);

            if (!fs.existsSync(htmlPath)) {
                /**
                 * DEVELOPMENT MODE FALLBACK
                 * ========================
                 * If dist/ files don't exist, we're in development mode.
                 * Load files directly from src/ directory.
                 */
                console.log('📁 Dist files not found, using development paths');
                htmlPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'musicPlayer.html');
                cssPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'musicPlayer.css');
                jsPath = path.join(this._context.extensionPath, 'src', 'common', 'ui', 'webview', 'musicPlayer.js');
            }

            console.log('📄 Loading HTML from:', htmlPath);
            let htmlContent = fs.readFileSync(htmlPath, 'utf8');

            /**
             * WEBVIEW URI CONVERSION
             * =====================
             * Convert file paths to special webview URIs that VS Code allows.
             * This is critical for security - webviews can't access arbitrary files.
             * 
             * Normal file path: /path/to/extension/src/common/ui/webview/musicPlayer.css
             * Webview URI: vscode-webview-resource://authority/path/to/file.css
             */
            const cssUri = this._view?.webview.asWebviewUri(vscode.Uri.file(cssPath));
            const jsUri = this._view?.webview.asWebviewUri(vscode.Uri.file(jsPath));

            /**
             * HTML CONTENT PROCESSING
             * ======================
             * Replace relative file references in HTML with absolute webview URIs.
             * This allows the webview to properly load its CSS styles and JavaScript.
             * 
             * Before: <link rel="stylesheet" href="musicPlayer.css">
             * After:  <link rel="stylesheet" href="vscode-webview-resource://...">
             */
            htmlContent = htmlContent.replace(/\{\{\s*cssUri\s*\}\}/g, cssUri ? cssUri.toString() : '');
            htmlContent = htmlContent.replace(/\{\{\s*jsUri\s*\}\}/g, jsUri ? jsUri.toString() : '');

            console.log('✅ Successfully loaded and processed HTML content');
            return htmlContent;

        } catch (error) {
            /**
             * FALLBACK ERROR HTML
             * ==================
             * If anything goes wrong loading the main UI, show a simple error message.
             * This prevents the webview from being completely blank.
             */
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

    /**
     * PUBLIC API METHODS
     * ==================
     * These methods provide external control over the webview provider.
     * They're called by the main extension or other components.
     */

    /**
     * Force an immediate update of the webview
     * Useful when we know something has changed and want to update UI immediately
     * rather than waiting for the next periodic update
     */
    public async forceUpdate(): Promise<void> {
        console.log('🔄 Force updating webview...');
        await this.updateWebview();
    }

    /**
     * Show the webview panel (bring it to front if hidden)
     * Used by commands or other parts of the extension
     */
    public show(): void {
        if (this._view) {
            this._view.show?.(true); // true = take focus
            console.log('👁️ Showing music player webview');
        }
    }

    /**
     * CLEANUP AND DISPOSAL
     * ====================
     * Called when the extension is deactivated or webview is destroyed.
     * Properly clean up resources to prevent memory leaks.
     * 
     * CLEANUP CHECKLIST:
     * ✅ Stop periodic update timer
     * ✅ Dispose platform-specific controller  
     * ✅ Clear any cached data
     * ✅ Remove event listeners (handled by VS Code automatically)
     */
    public dispose(): void {
        console.log('🧹 Disposing music webview provider...');

        // Stop the update timer to prevent memory leaks
        this.stopPeriodicUpdates();

        // Let the controller clean up its resources (file watchers, caches, etc.)
        this._controller.dispose();

        // Clear our view reference
        this._view = undefined;

        console.log('✅ Music webview provider disposed successfully');
    }
}