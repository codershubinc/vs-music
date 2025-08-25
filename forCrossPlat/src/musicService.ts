import * as vscode from 'vscode';
import { spawn, ChildProcess, exec } from 'child_process';
import * as os from 'os';

export interface TrackInfo {
    title: string;
    artist: string;
    album: string;
    duration?: number;
    position?: number;
    status: 'playing' | 'paused' | 'stopped';
}

export class CrossPlatformMusicService {
    private updateInterval: NodeJS.Timeout | null = null;
    private currentTrack: TrackInfo | null = null;
    private onTrackChangedCallback?: (track: TrackInfo | null) => void;
    private onPositionChangedCallback?: (position: number) => void;
    private platform: string;
    private musicAPI: WindowsMusicAPI | MacOSMusicAPI | LinuxMusicAPI;

    constructor() {
        this.platform = os.platform();
        console.log(`Detected platform: ${this.platform}`);
        
        switch (this.platform) {
            case 'win32':
                this.musicAPI = new WindowsMusicAPI();
                break;
            case 'darwin':
                this.musicAPI = new MacOSMusicAPI();
                break;
            default: // linux, freebsd, etc.
                this.musicAPI = new LinuxMusicAPI();
                break;
        }
        
        this.initialize();
    }

    private async initialize() {
        await this.musicAPI.initialize();
        this.startPolling();
    }

    private startPolling() {
        const config = vscode.workspace.getConfiguration('music');
        const interval = config.get<number>('updateInterval', 1000);

        this.updateInterval = setInterval(() => {
            this.updateTrackInfo();
        }, interval);
    }

    private async updateTrackInfo() {
        try {
            const trackInfo = await this.musicAPI.getCurrentTrack();
            this.setCurrentTrack(trackInfo);
        } catch (error) {
            console.error('Error updating track info:', error);
            this.setCurrentTrack(null);
        }
    }

    private setCurrentTrack(track: TrackInfo | null) {
        const wasPlayingBefore = this.currentTrack?.status === 'playing';
        const isPlayingNow = track?.status === 'playing';
        const trackChanged = !this.currentTrack ||
            !track ||
            this.currentTrack.title !== track.title ||
            this.currentTrack.artist !== track.artist ||
            this.currentTrack.status !== track.status;

        const positionChanged = this.currentTrack && track &&
            Math.abs((this.currentTrack.position || 0) - (track.position || 0)) > 2;

        this.currentTrack = track;

        if (trackChanged || wasPlayingBefore !== isPlayingNow) {
            if (this.onTrackChangedCallback) {
                this.onTrackChangedCallback(track);
            }
        } else if (positionChanged && track?.position !== undefined && this.onPositionChangedCallback) {
            this.onPositionChangedCallback(track.position);
        }
    }

    public getCurrentTrack(): TrackInfo | null {
        return this.currentTrack;
    }

    public onTrackChanged(callback: (track: TrackInfo | null) => void) {
        this.onTrackChangedCallback = callback;
    }

    public onPositionChanged(callback: (position: number) => void) {
        this.onPositionChangedCallback = callback;
    }

    public async playPause() {
        try {
            await this.musicAPI.playPause();
        } catch (error) {
            console.error('Error toggling play/pause:', error);
            vscode.window.showErrorMessage('Failed to toggle play/pause');
        }
    }

    public async nextTrack() {
        try {
            await this.musicAPI.nextTrack();
        } catch (error) {
            console.error('Error skipping to next track:', error);
            vscode.window.showErrorMessage('Failed to skip to next track');
        }
    }

    public async previousTrack() {
        try {
            await this.musicAPI.previousTrack();
        } catch (error) {
            console.error('Error going to previous track:', error);
            vscode.window.showErrorMessage('Failed to go to previous track');
        }
    }

    public dispose() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.musicAPI) {
            this.musicAPI.dispose?.();
        }
    }
}

// Abstract base class for platform-specific implementations
abstract class MusicAPI {
    abstract initialize(): Promise<void>;
    abstract getCurrentTrack(): Promise<TrackInfo | null>;
    abstract playPause(): Promise<void>;
    abstract nextTrack(): Promise<void>;
    abstract previousTrack(): Promise<void>;
    dispose?(): void;
}

// Windows implementation using PowerShell and Windows Media Control
class WindowsMusicAPI extends MusicAPI {
    private isAvailable = false;

    async initialize(): Promise<void> {
        try {
            // Test if we can access Windows media control
            await this.execPowerShell('Get-Process');
            this.isAvailable = true;
            console.log('Windows Media Control API initialized');
        } catch (error) {
            console.warn('Windows Media Control not available:', error);
            this.isAvailable = false;
        }
    }

    async getCurrentTrack(): Promise<TrackInfo | null> {
        if (!this.isAvailable) {
            return null;
        }

        try {
            // PowerShell script to get current media info
            const script = `
                Add-Type -AssemblyName System.Windows.Forms
                $sessions = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult().GetSessions()
                foreach ($session in $sessions) {
                    $mediaProps = $session.TryGetMediaPropertiesAsync().GetAwaiter().GetResult()
                    $playbackInfo = $session.GetPlaybackInfo()
                    if ($mediaProps -and $playbackInfo.PlaybackStatus -ne 'Closed') {
                        $title = $mediaProps.Title
                        $artist = $mediaProps.Artist
                        $album = $mediaProps.AlbumTitle
                        $status = $playbackInfo.PlaybackStatus.ToString().ToLower()
                        $position = $session.GetTimelineProperties().Position.TotalSeconds
                        $duration = $session.GetTimelineProperties().EndTime.TotalSeconds
                        Write-Output "$title|$artist|$album|$position|$duration|$status"
                        break
                    }
                }
            `;

            const result = await this.execPowerShell(script);
            return this.parseTrackInfo(result);
        } catch (error) {
            console.error('Error getting Windows media info:', error);
            return null;
        }
    }

    private parseTrackInfo(output: string): TrackInfo | null {
        const lines = output.trim().split('\n');
        if (lines.length === 0 || !lines[0]) {
            return null;
        }

        const parts = lines[0].split('|');
        if (parts.length >= 6) {
            return {
                title: parts[0] || 'Unknown Title',
                artist: parts[1] || 'Unknown Artist',
                album: parts[2] || 'Unknown Album',
                position: parseFloat(parts[3]) || 0,
                duration: parseFloat(parts[4]) || undefined,
                status: this.mapStatus(parts[5])
            };
        }

        return null;
    }

    private mapStatus(status: string): 'playing' | 'paused' | 'stopped' {
        switch (status?.toLowerCase()) {
            case 'playing': return 'playing';
            case 'paused': return 'paused';
            default: return 'stopped';
        }
    }

    async playPause(): Promise<void> {
        const script = `
            $sessions = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult().GetSessions()
            foreach ($session in $sessions) {
                $playbackInfo = $session.GetPlaybackInfo()
                if ($playbackInfo.PlaybackStatus -eq 'Playing') {
                    $session.TryPauseAsync().GetAwaiter().GetResult()
                } else {
                    $session.TryPlayAsync().GetAwaiter().GetResult()
                }
                break
            }
        `;
        await this.execPowerShell(script);
    }

    async nextTrack(): Promise<void> {
        const script = `
            $sessions = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult().GetSessions()
            foreach ($session in $sessions) {
                $session.TrySkipNextAsync().GetAwaiter().GetResult()
                break
            }
        `;
        await this.execPowerShell(script);
    }

    async previousTrack(): Promise<void> {
        const script = `
            $sessions = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult().GetSessions()
            foreach ($session in $sessions) {
                $session.TrySkipPreviousAsync().GetAwaiter().GetResult()
                break
            }
        `;
        await this.execPowerShell(script);
    }

    private execPowerShell(script: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(`powershell -Command "${script.replace(/"/g, '\\"')}"`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }
}

// macOS implementation using AppleScript
class MacOSMusicAPI extends MusicAPI {
    private isAvailable = false;

    async initialize(): Promise<void> {
        try {
            await this.execAppleScript('tell application "System Events" to get name of processes');
            this.isAvailable = true;
            console.log('macOS AppleScript API initialized');
        } catch (error) {
            console.warn('AppleScript not available:', error);
            this.isAvailable = false;
        }
    }

    async getCurrentTrack(): Promise<TrackInfo | null> {
        if (!this.isAvailable) {
            return null;
        }

        try {
            // Try different music applications
            const apps = ['Music', 'Spotify', 'iTunes'];
            
            for (const app of apps) {
                try {
                    const script = `
                        tell application "${app}"
                            if player state is not stopped then
                                set trackTitle to name of current track
                                set trackArtist to artist of current track
                                set trackAlbum to album of current track
                                set trackPosition to player position
                                set trackDuration to duration of current track
                                set playerState to player state as string
                                return trackTitle & "|" & trackArtist & "|" & trackAlbum & "|" & trackPosition & "|" & trackDuration & "|" & playerState
                            end if
                        end tell
                    `;

                    const result = await this.execAppleScript(script);
                    const trackInfo = this.parseTrackInfo(result);
                    if (trackInfo) {
                        return trackInfo;
                    }
                } catch (error) {
                    // Try next app
                    continue;
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting macOS media info:', error);
            return null;
        }
    }

    private parseTrackInfo(output: string): TrackInfo | null {
        const parts = output.trim().split('|');
        if (parts.length >= 6) {
            return {
                title: parts[0] || 'Unknown Title',
                artist: parts[1] || 'Unknown Artist',
                album: parts[2] || 'Unknown Album',
                position: parseFloat(parts[3]) || 0,
                duration: parseFloat(parts[4]) || undefined,
                status: this.mapStatus(parts[5])
            };
        }
        return null;
    }

    private mapStatus(status: string): 'playing' | 'paused' | 'stopped' {
        switch (status?.toLowerCase()) {
            case 'playing': return 'playing';
            case 'paused': return 'paused';
            default: return 'stopped';
        }
    }

    async playPause(): Promise<void> {
        const apps = ['Music', 'Spotify', 'iTunes'];
        
        for (const app of apps) {
            try {
                await this.execAppleScript(`tell application "${app}" to playpause`);
                break;
            } catch (error) {
                continue;
            }
        }
    }

    async nextTrack(): Promise<void> {
        const apps = ['Music', 'Spotify', 'iTunes'];
        
        for (const app of apps) {
            try {
                await this.execAppleScript(`tell application "${app}" to next track`);
                break;
            } catch (error) {
                continue;
            }
        }
    }

    async previousTrack(): Promise<void> {
        const apps = ['Music', 'Spotify', 'iTunes'];
        
        for (const app of apps) {
            try {
                await this.execAppleScript(`tell application "${app}" to previous track`);
                break;
            } catch (error) {
                continue;
            }
        }
    }

    private execAppleScript(script: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(`osascript -e '${script.replace(/'/g, "\\'")}'`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }
}

// Linux implementation using playerctl
class LinuxMusicAPI extends MusicAPI {
    private isAvailable = false;

    async initialize(): Promise<void> {
        try {
            await this.execCommand('playerctl --version');
            this.isAvailable = true;
            console.log('Linux playerctl API initialized');
        } catch (error) {
            console.warn('playerctl not available:', error);
            this.isAvailable = false;
        }
    }

    async getCurrentTrack(): Promise<TrackInfo | null> {
        if (!this.isAvailable) {
            return null;
        }

        try {
            const result = await this.execCommand('playerctl metadata --format "{{title}}|{{artist}}|{{album}}|{{duration(position)}}|{{duration(mpris:length)}}|{{status}}"');
            return this.parseTrackInfo(result);
        } catch (error) {
            console.error('Error getting Linux media info:', error);
            return null;
        }
    }

    private parseTrackInfo(output: string): TrackInfo | null {
        const parts = output.trim().split('|');
        if (parts.length >= 6) {
            return {
                title: parts[0] || 'Unknown Title',
                artist: parts[1] || 'Unknown Artist',
                album: parts[2] || 'Unknown Album',
                position: this.parseDuration(parts[3]),
                duration: this.parseDuration(parts[4]),
                status: this.mapStatus(parts[5])
            };
        }
        return null;
    }

    private parseDuration(duration: string): number | undefined {
        if (!duration || duration === '' || duration === 'null') {
            return undefined;
        }
        const parts = duration.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0]);
            const seconds = parseInt(parts[1]);
            if (!isNaN(minutes) && !isNaN(seconds)) {
                return minutes * 60 + seconds;
            }
        }
        return undefined;
    }

    private mapStatus(status: string): 'playing' | 'paused' | 'stopped' {
        switch (status?.toLowerCase()) {
            case 'playing': return 'playing';
            case 'paused': return 'paused';
            default: return 'stopped';
        }
    }

    async playPause(): Promise<void> {
        await this.execCommand('playerctl play-pause');
    }

    async nextTrack(): Promise<void> {
        await this.execCommand('playerctl next');
    }

    async previousTrack(): Promise<void> {
        await this.execCommand('playerctl previous');
    }

    private execCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }
}
