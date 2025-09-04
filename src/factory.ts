import * as vscode from 'vscode';
import * as os from 'os';
import { LinuxMusicService } from './linux/musicService';
import { LinuxMusicWebviewProvider } from './linux/ui/musicWebviewProvider';
import { WindowsMusicWebviewProvider } from './windows/ui/musicWebviewProvider';

/**
 * Platform-specific factory for creating music services and providers
 */
export class MusicPlatformFactory {

    /**
     * Detect the current platform
     */
    public static getCurrentPlatform(): 'linux' | 'windows' | 'macos' | 'unknown' {
        const platform = os.platform();

        switch (platform) {
            case 'linux':
                return 'linux';
            case 'win32':
                return 'windows';
            case 'darwin':
                return 'macos';
            default:
                return 'unknown';
        }
    }

    /**
     * Create a music service for the current platform
     */
    public static async createMusicService(context: vscode.ExtensionContext): Promise<LinuxMusicService | null> {
        const platform = this.getCurrentPlatform();

        switch (platform) {
            case 'linux':
                const service = new LinuxMusicService(context);
                await service.initialize();
                return service;

            case 'windows':
            case 'macos':
            case 'unknown':
            default:
                // No service available for these platforms yet
                return null;
        }
    }

    /**
     * Create a webview provider for the current platform
     */
    public static createWebviewProvider(
        context: vscode.ExtensionContext,
        musicService?: LinuxMusicService
    ): LinuxMusicWebviewProvider | WindowsMusicWebviewProvider {
        const platform = this.getCurrentPlatform();

        switch (platform) {
            case 'linux':
                if (!musicService) {
                    throw new Error('Linux platform requires a music service');
                }
                return new LinuxMusicWebviewProvider(context, musicService);

            case 'windows':
            case 'macos':
            case 'unknown':
            default:
                return new WindowsMusicWebviewProvider(context);
        }
    }

    /**
     * Get platform-specific information for user messages
     */
    public static getPlatformInfo(): { name: string; supported: boolean; message: string } {
        const platform = this.getCurrentPlatform();

        switch (platform) {
            case 'linux':
                return {
                    name: 'Linux',
                    supported: true,
                    message: 'Full music player integration available via playerctl/MPRIS'
                };

            case 'windows':
                return {
                    name: 'Windows',
                    supported: false,
                    message: 'Windows support is coming soon! Will include Windows Media Player and Spotify integration.'
                };

            case 'macos':
                return {
                    name: 'macOS',
                    supported: false,
                    message: 'macOS support is planned for future releases with iTunes/Apple Music integration.'
                };

            default:
                return {
                    name: 'Unknown',
                    supported: false,
                    message: 'Your platform is not currently supported. Linux support is available.'
                };
        }
    }

    /**
     * Get the webview provider view type for the current platform
     */
    public static getWebviewViewType(): string {
        // Both providers use the same view type for consistency
        return 'vsMusicPlayer';
    }
}
