import { showNoMusic, updateArtwork, updatePlayPauseButton, updateStatusIndicator } from './musicUI.js';
import { startManualTimeUpdate, updateTime } from './timeUpdate.js';
import { formatTime } from './helpers/timeFormat.js';

// VS Music Player - Webview JavaScript
; (function () {
    'use strict';

    // console.log("Music Player Webview script loaded");


    const vscode = acquireVsCodeApi();
    let currentTrack = null;
    let progressUpdateInterval = null;

    // Message listener for extension communication
    window.addEventListener('message', event => {
        const message = event.data;
        // console.log("Received message:", message);

        switch (message.command) {
            case 'updateTrack':
                updateTrack(message.track, message.artworkUri, message.position);
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

    function updateTrack(track, artworkUri, position) {
        // console.log("Updating track:", track, "artworkUri:", artworkUri, "position:", position);

        if (!track || !track.title) {
            showNoMusic();
            return;
        }

        const isNewTrack = !currentTrack || currentTrack.title !== track.title || currentTrack.artist !== track.artist;
        const statusChanged = !currentTrack || currentTrack.status !== track.status;

        // Only clear interval if it's a completely new track
        if (isNewTrack) {
            if (progressUpdateInterval) {
                clearInterval(progressUpdateInterval);
                progressUpdateInterval = null;
            }
        }

        currentTrack = track;

        // Only update position from extension if we don't have manual timer running
        // OR if it's a new track OR if status changed to non-playing state
        const isPlaying = (track.status === 'playing' || track.status === 'Playing');
        const wasPlaying = (currentTrack?.status === 'playing' || currentTrack?.status === 'Playing');

        if (!progressUpdateInterval || isNewTrack || (wasPlaying && !isPlaying)) {
            if (position !== undefined) {
                currentTrack.position = position;
            }
        } else {
            // Keep our manual position if timer is running
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
        updateProgress(currentTrack.position || 0);
        updateTime(track.duration || 0);

        // Start manual time update only on status change or new track
        if (statusChanged || isNewTrack) {
            startManualTimeUpdate();
        }
    }

    function updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }







    function updateProgress(currentPosition) {
        if (!currentTrack) {
            return;
        }
        const duration = currentTrack.duration || 0;
        const progressFill = document.getElementById('progress-fill');
        const currentTimeElement = document.getElementById('current-time');

        if (progressFill && duration > 0) {
            const percentage = Math.min((currentPosition / duration) * 100, 100);
            progressFill.style.width = `${percentage}%`;
        }

        if (currentTimeElement) {
            // console.log('Updating current time to from updateProgress', currentPosition, "manual time:");

            currentTimeElement.textContent = formatTime(currentPosition);
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


})();