import * as vscode from 'vscode';
import * as os from 'os';
import { LinuxMusicService } from './linux/musicService';
import { LinuxMusicWebviewProvider } from './linux/ui/musicWebviewProvider';
import { WindowsMusicWebviewProvider } from './windows/ui/musicWebviewProvider';

let musicService: LinuxMusicService | undefined;
let webviewProvider: LinuxMusicWebviewProvider | WindowsMusicWebviewProvider | undefined;

// This method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
	console.log('VS Music extension is now active!');

	try {
		// Detect platform and initialize appropriate services
		const platform = os.platform();
		console.log(`Detected platform: ${platform}`);

		switch (platform) {
			case 'linux':
				await initializeLinuxSupport(context);
				break;

			case 'win32':
				initializeWindowsSupport(context);
				break;

			case 'darwin':
				// macOS support could be added here in the future
				vscode.window.showWarningMessage('VS Music: macOS support is not yet available. Coming soon!');
				initializeFallbackSupport(context);
				break;

			default:
				vscode.window.showWarningMessage(`VS Music: Platform ${platform} is not supported yet.`);
				initializeFallbackSupport(context);
				break;
		}

	} catch (error) {
		console.error('Failed to initialize VS Music:', error);
		vscode.window.showErrorMessage(`VS Music initialization failed: ${error}`);
	}
}

async function initializeLinuxSupport(context: vscode.ExtensionContext): Promise<void> {
	try {
		// Initialize Linux music service
		musicService = new LinuxMusicService(context);
		await musicService.initialize();

		// Create and register Linux webview provider
		webviewProvider = new LinuxMusicWebviewProvider(context, musicService);

		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(
				LinuxMusicWebviewProvider.viewType,
				webviewProvider,
				{
					webviewOptions: {
						retainContextWhenHidden: true
					}
				}
			)
		);

		// Register commands
		registerLinuxCommands(context);

		console.log('Linux music support initialized successfully');
		vscode.window.showInformationMessage('VS Music is ready! Music info will appear in the panel.');

	} catch (error) {
		console.error('Failed to initialize Linux music support:', error);
		vscode.window.showErrorMessage(`VS Music (Linux) initialization failed: ${error}`);
		throw error;
	}
}

function initializeWindowsSupport(context: vscode.ExtensionContext): void {
	try {
		// Create and register Windows placeholder webview provider
		webviewProvider = new WindowsMusicWebviewProvider(context);

		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(
				WindowsMusicWebviewProvider.viewType,
				webviewProvider,
				{
					webviewOptions: {
						retainContextWhenHidden: true
					}
				}
			)
		);

		console.log('Windows placeholder support initialized');
		vscode.window.showInformationMessage('VS Music: Windows support is coming soon! Currently available on Linux.');

	} catch (error) {
		console.error('Failed to initialize Windows support:', error);
		throw error;
	}
}

function initializeFallbackSupport(context: vscode.ExtensionContext): void {
	// Use Windows provider as fallback (shows "coming soon" message)
	initializeWindowsSupport(context);
}

function registerLinuxCommands(context: vscode.ExtensionContext): void {
	if (!musicService) {
		return;
	}

	// Play/Pause command
	const playPauseCommand = vscode.commands.registerCommand('vsMusic.playPause', async () => {
		try {
			await musicService?.playPause();
			// Force update webview after action
			setTimeout(() => {
				if (webviewProvider && 'forceUpdate' in webviewProvider) {
					(webviewProvider as LinuxMusicWebviewProvider).forceUpdate();
				}
			}, 100);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to play/pause: ${error}`);
		}
	});

	// Next track command  
	const nextTrackCommand = vscode.commands.registerCommand('vsMusic.nextTrack', async () => {
		try {
			await musicService?.next();
			setTimeout(() => {
				if (webviewProvider && 'forceUpdate' in webviewProvider) {
					(webviewProvider as LinuxMusicWebviewProvider).forceUpdate();
				}
			}, 100);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to skip to next track: ${error}`);
		}
	});

	// Previous track command
	const previousTrackCommand = vscode.commands.registerCommand('vsMusic.previousTrack', async () => {
		try {
			await musicService?.previous();
			setTimeout(() => {
				if (webviewProvider && 'forceUpdate' in webviewProvider) {
					(webviewProvider as LinuxMusicWebviewProvider).forceUpdate();
				}
			}, 100);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to go to previous track: ${error}`);
		}
	});

	// Show music panel command
	const showMusicPanelCommand = vscode.commands.registerCommand('vsMusic.showMusicPanel', () => {
		webviewProvider?.show();
	});

	// Add commands to subscriptions
	context.subscriptions.push(
		playPauseCommand,
		nextTrackCommand,
		previousTrackCommand,
		showMusicPanelCommand
	);
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('VS Music extension deactivated');

	// Cleanup music service
	if (musicService) {
		musicService.dispose();
		musicService = undefined;
	}

	// Cleanup webview provider
	if (webviewProvider) {
		webviewProvider.dispose();
		webviewProvider = undefined;
	}
}
