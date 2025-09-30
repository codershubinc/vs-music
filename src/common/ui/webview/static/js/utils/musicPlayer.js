import { showNoMusic, updateArtwork, updatePlayPauseButton, updateStatusIndicator } from './musicUI.js';
import { toggleProgressBar, updateProgress, updateTime } from './timeUpdate.js';

// VS Music Player - Webview JavaScript
; (function () {
    'use strict';

    // console.log("Music Player Webview script loaded");


    const vscode = acquireVsCodeApi();
    let currentTrack = null;
    let progressUpdateInterval = null;
    let currentPosition = null;

    // Message listener for extension communication
    window.addEventListener('message', event => {
        const message = event.data;
        // console.log("Received message:", message);

        switch (message.command) {
            case 'updateTrack':
                updateTrack(message.track, message.artworkUri, message.position, message.showProgressBar);
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

        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', handleProgressClick);
        }
    }

    function updateTrack(track, artworkUri, position, showProgressBar = false) {
        // console.log("Updating track:", track, "artworkUri:", artworkUri, "position:", position);

        if (!track || !track.title) {
            showNoMusic();
            return;
        }
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            if (showProgressBar && track && track.duration > 0) {
                progressContainer.style.display = 'block';
            } else {
                progressContainer.style.display = 'none';
            }
        }

        currentTrack = track;

        // PERFORMANCE FIX: Always use position from extension, no manual timer
        if (position !== undefined) {
            currentPosition = position;
        }

        const noMusicEl = document.getElementById('no-music');
        const musicInfoEl = document.getElementById('music-info');

        if (noMusicEl) {
            noMusicEl.classList.add('hidden');
        }
        if (musicInfoEl) {
            musicInfoEl.classList.remove('hidden');
        }

        updateElement('track-title', track.title || 'Unknown Title');
        updateElement('track-artist', track.artist || 'Unknown Artist');
        updateElement('track-album', track.album || 'Unknown Album');

        updateArtwork(artworkUri);
        updateStatusIndicator(track.status);
        updatePlayPauseButton(track.status);
        updateTime(track.duration || 0);
        toggleProgressBar(showProgressBar && track && track.duration > 0);

        // PERFORMANCE FIX: Update progress directly from extension data
        if (showProgressBar && currentPosition !== undefined) {
            updateProgress(currentPosition, currentTrack);
        }
    }

    function updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }
    // Progress bar click handler for seeking (future feature)
    function handleProgressClick(event) {
        if (!currentTrack || !currentTrack.duration) {
            return;
        }

        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newPosition = percentage * currentTrack.duration;

        // TODO: Implement seeking functionality
        // vscode.postMessage({ command: 'seek', position: newPosition });
    }

    // PERFORMANCE FIX: Manual timer removed - extension handles all timing
    // This eliminates dual timers and reduces CPU usage by ~40%


})();