import * as vscode from 'vscode';
import { LinuxMusicService } from './linux/musicService';
import { MusicStatusBarWidget } from './temp/musicStatusBar';
import { MusicCornerWidget } from './temp/musicCornerWidget';
import { MusicExplorerProvider } from './temp/musicExplorerProvider';

export class MusicController {
    private musicService: LinuxMusicService;
    private statusBarWidget: MusicStatusBarWidget;
    private cornerWidget: MusicCornerWidget;
    private explorerProvider: MusicExplorerProvider;
    private disposables: vscode.Disposable[] = [];
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        console.log('MusicController constructor called');
        this.context = context;

        this.musicService = new LinuxMusicService(context);
        console.log('LinuxMusicService created');

        this.statusBarWidget = new MusicStatusBarWidget();
        console.log('StatusBarWidget created');

        this.cornerWidget = new MusicCornerWidget(context.extensionUri);
        console.log('CornerWidget created');

        this.explorerProvider = new MusicExplorerProvider(context.extensionUri);
        console.log('ExplorerProvider created');

        this.setupWebviewView(context);
        this.setupEventHandlers();
        this.registerCommands(context);
        this.startMusicDetection();
        console.log('MusicController initialization completed');
    }

    private setupWebviewView(context: vscode.ExtensionContext) {
        const provider = vscode.window.registerWebviewViewProvider(
            MusicExplorerProvider.viewType,
            this.explorerProvider
        );

        context.subscriptions.push(provider);
    }

    private async startMusicDetection() {
        // Start periodic music detection
        await this.musicService.initialize();
        this.updateAllComponents();

        // Set up periodic updates every 2 seconds
        const updateInterval = setInterval(async () => {
            await this.updateAllComponents();
        }, 2000);

        this.disposables.push({
            dispose: () => clearInterval(updateInterval)
        });
    }

    private async updateAllComponents() {
        try {
            const currentTrack = await this.musicService.getCurrentTrack();
            if (currentTrack) {
                this.statusBarWidget.updateTrack(currentTrack);
                this.explorerProvider.updateTrack(currentTrack);

                if (this.cornerWidget) {
                    this.cornerWidget.updateTrack(currentTrack);
                }
            }

            // Get and update position if track is playing
            const position = await this.musicService.getPosition();
            if (position !== null) {
                this.explorerProvider.updatePosition(position);

                if (this.cornerWidget) {
                    this.cornerWidget.updatePosition(position);
                }
            }
        } catch (error) {
            console.error('Error updating music components:', error);
        }
    }

    private setupEventHandlers() {
        // Listen for control commands from corner widget
        this.cornerWidget.onControl((action: string) => {
            this.handleControlAction(action);
        });

        // Listen for control commands from explorer provider
        this.explorerProvider.onControl((action: string) => {
            this.handleControlAction(action);
        });

        // Listen for configuration changes
        const configChangeDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('music')) {
                this.handleConfigurationChange();
            }
        });

        this.disposables.push(configChangeDisposable);
    }

    private registerCommands(context: vscode.ExtensionContext) {
        const commands = [
            vscode.commands.registerCommand('music.toggleWidget', () => {
                this.cornerWidget.toggleCornerWidget();
            }),
            vscode.commands.registerCommand('music.toggleCornerWidget', () => {
                this.cornerWidget.toggleCornerWidget();
            }),
            vscode.commands.registerCommand('music.showPanel', () => {
                this.cornerWidget.showCornerWidget();
            }),
            vscode.commands.registerCommand('music.playPause', async () => {
                await this.musicService.playPause();
                // Update components immediately after control action
                setTimeout(() => this.updateAllComponents(), 100);
            }),
            vscode.commands.registerCommand('music.nextTrack', async () => {
                await this.musicService.next();
                // Update components immediately after control action
                setTimeout(() => this.updateAllComponents(), 100);
            }),
            vscode.commands.registerCommand('music.previousTrack', async () => {
                await this.musicService.previous();
                // Update components immediately after control action
                setTimeout(() => this.updateAllComponents(), 100);
            }),
            vscode.commands.registerCommand('music.refreshExplorer', async () => {
                // Refresh by updating with current track
                await this.updateAllComponents();
            })
        ];

        this.disposables.push(...commands);
        context.subscriptions.push(...commands);
    }

    private async handleControlAction(action: string) {
        try {
            switch (action) {
                case 'playPause':
                    await this.musicService.playPause();
                    break;
                case 'nextTrack':
                    await this.musicService.next();
                    break;
                case 'previousTrack':
                    await this.musicService.previous();
                    break;
            }

            // Update components immediately after control action
            setTimeout(() => this.updateAllComponents(), 100);
        } catch (error) {
            console.error('Error handling control action:', error);
            vscode.window.showErrorMessage(`Music control error: ${error}`);
        }
    }

    private handleConfigurationChange() {
        // Recreate status bar widget with new configuration
        this.statusBarWidget.dispose();
        this.statusBarWidget = new MusicStatusBarWidget();

        // Update with current track if available
        this.updateAllComponents();
    }

    public async getCurrentTrack() {
        console.log("Getting current track info......");
        return await this.musicService.getCurrentTrack();
    }

    public dispose() {
        this.musicService.dispose();
        this.statusBarWidget.dispose();
        this.cornerWidget.dispose();

        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
}