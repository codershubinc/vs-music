import { showNoMusic, updateArtwork, updatePlayPauseButton, updateStatusIndicator } from './musicUI.js';

// VS Music Player - Webview JavaScript
; (function () {
    'use strict';

    const vscode = acquireVsCodeApi();
    let currentTrack = null;

    // Message listener for extension communication
    window.addEventListener('message', event => {
        const message = event.data;

        switch (message.command) {
            case 'updateTrack':
                const artworkToUse = message.artworkDataUri || message.artworkUri;
                updateTrack(message.track, artworkToUse);
                break;
        }
    });

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        initializeControls();
        vscode.postMessage({ command: 'webviewReady' });
    });

    function initializeControls() {
        const playPauseBtn = document.getElementById('play-pause-btn');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'playPause' });
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'previous' });
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'next' });
            });
        }
    }

    function updateTrack(track, artworkUri) {
        if (!track || !track.title) {
            showNoMusic();
            return;
        }

        currentTrack = track;

        const noMusicEl = document.getElementById('no-music');
        const musicInfoEl = document.getElementById('music-info');

        if (noMusicEl) { noMusicEl.classList.add('hidden'); }
        if (musicInfoEl) { musicInfoEl.classList.remove('hidden'); }

        updateElement('track-title', track.title || 'Unknown Title');
        updateElement('track-artist', track.artist || 'Unknown Artist');
        updateElement('track-album', track.album || 'Unknown Album');

        updateArtwork(artworkUri, track.title);
        updateStatusIndicator(track.status);
        updatePlayPauseButton(track.status);
    }

    function updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

})();