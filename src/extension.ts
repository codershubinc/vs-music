import * as vscode from 'vscode';
import { MusicWebviewProvider } from './common/ui/musicWebviewProvider';
import { ArtworkUtil } from './linux/utils/artworkUtil';

let webviewProvider: MusicWebviewProvider | undefined;

export async function activate(context: vscode.ExtensionContext) {
	console.log('VS Music extension is now active!');

	ArtworkUtil.initialize(context);

	try {
		webviewProvider = new MusicWebviewProvider(context);

		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(
				MusicWebviewProvider.viewType,
				webviewProvider,
				{
					webviewOptions: {
						retainContextWhenHidden: true
					}
				}
			)
		);

		registerCommands(context);

		console.log('VS Music extension initialized successfully');
		vscode.window.showInformationMessage('VS Music is ready!');

	} catch (error) {
		console.error('Failed to initialize VS Music:', error);
		vscode.window.showErrorMessage(`VS Music initialization failed: ${error}`);
	}
}

function registerCommands(context: vscode.ExtensionContext): void {
	const playPauseCommand = vscode.commands.registerCommand('vsMusic.playPause', async () => {
		try {
			if (webviewProvider) {
				await webviewProvider.forceUpdate();
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to play/pause: ${error}`);
		}
	});

	const nextTrackCommand = vscode.commands.registerCommand('vsMusic.nextTrack', async () => {
		try {
			if (webviewProvider) {
				await webviewProvider.forceUpdate();
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to skip to next track: ${error}`);
		}
	});

	const previousTrackCommand = vscode.commands.registerCommand('vsMusic.previousTrack', async () => {
		try {
			if (webviewProvider) {
				await webviewProvider.forceUpdate();
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to go to previous track: ${error}`);
		}
	});

	const showMusicPanelCommand = vscode.commands.registerCommand('vsMusic.showMusicPanel', () => {
		webviewProvider?.show();
	});

	context.subscriptions.push(
		playPauseCommand,
		nextTrackCommand,
		previousTrackCommand,
		showMusicPanelCommand
	);
}

export async function deactivate() {
	console.log('VS Music extension deactivating...');

	if (webviewProvider) {
		webviewProvider.dispose();
		webviewProvider = undefined;
	}

	// Clean up artwork cache and disk space
	try {
		await ArtworkUtil.dispose();
		console.log('Artwork cache cleaned up successfully');
	} catch (error) {
		console.error('Error cleaning up artwork cache:', error);
	}

	console.log('VS Music extension deactivated');
}

