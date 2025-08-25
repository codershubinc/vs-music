import * as vscode from 'vscode';
import { TrackInfo } from './musicService';

export class MusicStatusBarWidget {
    private statusBarItem: vscode.StatusBarItem;
    private currentTrack: TrackInfo | null = null;

    constructor() {
        const config = vscode.workspace.getConfiguration('music');
        const position = config.get<string>('statusBarPosition', 'right');
        const priority = config.get<number>('statusBarPriority', 100);

        const alignment = position === 'left'
            ? vscode.StatusBarAlignment.Left
            : vscode.StatusBarAlignment.Right;

        this.statusBarItem = vscode.window.createStatusBarItem(alignment, priority);
        this.setupStatusBarItem();

    }

    private setupStatusBarItem() {
        this.statusBarItem.command = 'music.toggleCornerWidget';
        this.statusBarItem.tooltip = 'Click to toggle corner music widget';
        this.updateDisplay();
        this.statusBarItem.show();
    }

    public updateTrack(track: TrackInfo | null) {
        this.currentTrack = track;
        this.updateDisplay();
    }

    private updateDisplay() {
        const config = vscode.workspace.getConfiguration('music');
        const enableStatusBar = config.get<boolean>('enableStatusBar', true);

        if (!enableStatusBar) {
            this.statusBarItem.hide();
            return;
        }

        if (!this.currentTrack) {
            this.statusBarItem.text = '$(music) No music playing';
            this.statusBarItem.tooltip = 'No music currently playing';
            this.statusBarItem.show();
            return;
        }

        const maxLength = config.get<number>('maxTitleLength', 30);
        const title = this.truncateText(this.currentTrack.title, maxLength);
        const artist = this.truncateText(this.currentTrack.artist, 20);

        const statusIcon = this.getStatusIcon(this.currentTrack.status);

        this.statusBarItem.text = `${statusIcon} ${title} - ${artist}`;
        this.statusBarItem.tooltip = this.createTooltip(this.currentTrack);
        this.statusBarItem.show();
    }

    private getStatusIcon(status: string): string {
        switch (status) {
            case 'playing': return '$(play)';
            case 'paused': return '$(debug-pause)';
            case 'stopped': return '$(primitive-square)';
            default: return '$(music)';
        }
    }

    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    }

    private createTooltip(track: TrackInfo): string {
        let tooltip = `${track.title}\nby ${track.artist}`;

        if (track.album) {
            tooltip += `\nfrom ${track.album}`;
        }

        if (track.duration && track.position) {
            const progress = this.formatTime(track.position) + ' / ' + this.formatTime(track.duration);
            tooltip += `\n${progress}`;
        }

        tooltip += `\nStatus: ${track.status}`;
        tooltip += '\n\nClick to toggle corner music widget';

        return tooltip;
    }

    private formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    public show() {
        const config = vscode.workspace.getConfiguration('music');
        const enableStatusBar = config.get<boolean>('enableStatusBar', true);

        if (enableStatusBar) {
            this.statusBarItem.show();
        }
    }

    public hide() {
        this.statusBarItem.hide();
    }

    public dispose() {
        this.statusBarItem.dispose();
    }
}