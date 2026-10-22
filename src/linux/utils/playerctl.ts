import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

export interface MprisTrackState {
    title: string;
    artist: string;
    album: string;
    artUrl: string;
    positionSecs: number;
    durationSecs: number;
    status: 'playing' | 'paused' | 'stopped';
    player: string;
}

const EMPTY_STATE: MprisTrackState = {
    title: '', artist: '', album: '', artUrl: '',
    positionSecs: 0, durationSecs: 0, status: 'stopped', player: '',
};

export class PlayerCtrlLinux {
    private _process: ChildProcessWithoutNullStreams | null = null;
    private state: MprisTrackState = { ...EMPTY_STATE };
    private onChange: (() => void) | null = null;
    private retryTimer: NodeJS.Timeout | null = null;
    private retryDelay = 2000;
    private isDisposed = false;
    private stdoutBuffer = '';

    constructor() {
        this.startProcess();
    }

    private startProcess() {
        if (this.isDisposed) { return; }
        if (this._process) { this.killProcess(); }

        // We use a custom delimiter "~~DELIM~~" to avoid breaking on quotes in song titles
        const format = '{{status}}~~DELIM~~{{xesam:title}}~~DELIM~~{{xesam:artist}}~~DELIM~~{{xesam:album}}~~DELIM~~{{mpris:artUrl}}~~DELIM~~{{mpris:length}}';

        try {
            this._process = spawn('playerctl', ['metadata', '--format', format, '--follow']);

            this._process.stdout.on('data', (data) => {
                this.stdoutBuffer += data.toString();
                let newlineIndex;
                while ((newlineIndex = this.stdoutBuffer.indexOf('\n')) >= 0) {
                    const line = this.stdoutBuffer.slice(0, newlineIndex);
                    this.stdoutBuffer = this.stdoutBuffer.slice(newlineIndex + 1);
                    if (line.trim()) {
                        this.retryDelay = 2000;
                        this.parseLine(line);
                    }
                }
            });

            this._process.stderr.on('data', (_data) => {
                // "No players found" is common, ignore it
            });

            this._process.on('error', (err) => {
                console.warn('playerctl process error:', err);
            });

            this._process.on('close', (_code) => {
                if (!this.isDisposed) {
                    const delay = this.retryDelay;
                    this.retryDelay = Math.min(this.retryDelay * 2, 15000);
                    this.retryTimer = setTimeout(() => {
                        this.startProcess();
                    }, delay);
                }
            });
        } catch (e) {
            console.error('Failed to spawn playerctl:', e);
        }
    }

    private parseLine(line: string) {
        try {
            const parts = line.split('~~DELIM~~');
            if (parts.length < 6) { return; }

            const status = (parts[0].toLowerCase() as any) || 'stopped';
            const title = parts[1] || '';
            const artist = parts[2] || '';
            const album = parts[3] || '';
            const artUrl = parts[4] || '';

            // Convert microseconds to seconds
            const durationMicros = parseInt(parts[5] || '0', 10);
            const durationSecs = Math.floor(durationMicros / 1_000_000);

            if (
                this.state.status === status &&
                this.state.title === title &&
                this.state.artist === artist &&
                this.state.album === album &&
                this.state.artUrl === artUrl &&
                this.state.durationSecs === durationSecs
            ) {
                return;
            }

            // Update state
            this.state.status = status;
            this.state.title = title;
            this.state.artist = artist;
            this.state.album = album;
            this.state.artUrl = artUrl;
            this.state.durationSecs = durationSecs;

            // Notify UI
            this.onChange?.();
        } catch (e) {
            console.error('Failed to parse playerctl output:', e);
        }
    }

    private killProcess() {
        if (this._process) {
            this._process.kill();
            this._process = null;
        }
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }

    // --- Public API ---

    get isConnected(): boolean {
        return this._process !== null && !this.isDisposed;
    }

    getState(): Readonly<MprisTrackState> {
        return this.state;
    }

    onTrackChange(cb: () => void) {
        this.onChange = cb;
    }

    // Control commands spawn a temporary process (fire and forget)
    playPause() {
        try {
            const p = spawn('playerctl', ['play-pause']);
            p.on('error', (e) => { console.warn('playerctl play-pause error:', e); });
        } catch (e) {
            console.warn('Failed to spawn playerctl play-pause:', e);
        }
    }

    next() {
        try {
            const p = spawn('playerctl', ['next']);
            p.on('error', (e) => { console.warn('playerctl next error:', e); });
        } catch (e) {
            console.warn('Failed to spawn playerctl next:', e);
        }
    }

    previous() {
        try {
            const p = spawn('playerctl', ['previous']);
            p.on('error', (e) => { console.warn('playerctl previous error:', e); });
        } catch (e) {
            console.warn('Failed to spawn playerctl previous:', e);
        }
    }

    dispose() {
        this.isDisposed = true;
        this.killProcess();
        if (playerCtrlLinuxInstance === this) {
            playerCtrlLinuxInstance = null;
        }
    }
}

let playerCtrlLinuxInstance: PlayerCtrlLinux | null = null;

export function getPlayerCtrlLinux(): PlayerCtrlLinux {
    if (!playerCtrlLinuxInstance) {
        playerCtrlLinuxInstance = new PlayerCtrlLinux();
    }
    return playerCtrlLinuxInstance;
}

export default getPlayerCtrlLinux;