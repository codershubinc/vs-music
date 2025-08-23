import * as vscode from 'vscode';
import { MusicService } from './musicService';
import { MusicStatusBarWidget } from './musicStatusBar';
import { MusicCornerWidget } from './musicCornerWidget';

export class MusicController {
    private musicService: MusicService;
    private statusBarWidget: MusicStatusBarWidget;
    private cornerWidget: MusicCornerWidget;
    private disposables: vscode.Disposable[] = [];

    constructor(context: vscode.ExtensionContext) {
        this.musicService = new MusicService();
        this.statusBarWidget = new MusicStatusBarWidget();
        this.cornerWidget = new MusicCornerWidget(context.extensionUri);

        this.setupEventHandlers();
        this.registerCommands(context);
    }

    private setupEventHandlers() {
        // Listen for track changes from music service
        this.musicService.onTrackChanged((track) => {
            this.statusBarWidget.updateTrack(track);
            this.cornerWidget.updateTrack(track);
        });

        // Listen for control commands from corner widget
        this.cornerWidget.onControl((action: string) => {
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
            vscode.commands.registerCommand('music.playPause', () => {
                this.musicService.playPause();
            }),
            vscode.commands.registerCommand('music.nextTrack', () => {
                this.musicService.nextTrack();
            }),
            vscode.commands.registerCommand('music.previousTrack', () => {
                this.musicService.previousTrack();
            })
        ];

        this.disposables.push(...commands);
        context.subscriptions.push(...commands);
    }

    private handleControlAction(action: string) {
        switch (action) {
            case 'playPause':
                this.musicService.playPause();
                break;
            case 'nextTrack':
                this.musicService.nextTrack();
                break;
            case 'previousTrack':
                this.musicService.previousTrack();
                break;
        }
    }

    private handleConfigurationChange() {
        // Recreate status bar widget with new configuration
        this.statusBarWidget.dispose();
        this.statusBarWidget = new MusicStatusBarWidget();

        // Update with current track if available
        const currentTrack = this.musicService.getCurrentTrack();
        if (currentTrack) {
            this.statusBarWidget.updateTrack(currentTrack);
        }
    }

    public getCurrentTrack() {
        return this.musicService.getCurrentTrack();
    }

    public dispose() {
        this.musicService.dispose();
        this.statusBarWidget.dispose();
        this.cornerWidget.dispose();

        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
}