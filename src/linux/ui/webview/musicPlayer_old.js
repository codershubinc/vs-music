// VS Music Player Webview Script

(function () {
    'use strict';

    // Get VS Code API
    const vscode = acquireVsCodeApi();

    // DOM elements
    let currentTrack = null;
    let webviewReady = false;

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function () {
        initializeWebview();
    });

    function initializeWebview() {
        console.log('Initializing VS Music webview...');

        // Setup control event listeners
        setupControlEvents();

        // Signal that webview is ready
        webviewReady = true;
        vscode.postMessage({
            command: 'webviewReady'
        });

        console.log('Webview ready signal sent');
    }

    function setupControlEvents() {
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
                vscode.postMessage({ command: 'previousTrack' });
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'nextTrack' });
            });
        }
    }

    // Listen for messages from extension
    window.addEventListener('message', event => {
        const message = event.data;

        switch (message.command) {
            case 'updateTrack':
                updateTrackInfo(message.track);
                break;
            case 'updateStatus':
                updatePlaybackStatus(message.status);
                break;
            case 'updatePosition':
                updatePosition(message.position, message.duration);
                break;
            case 'noMusic':
                showNoMusicState();
                break;
        }
    });

    function updateTrackInfo(track) {
        if (!track) {
            showNoMusicState();
            return;
        }

        currentTrack = track;
        console.log('Updating track info:', track);

        // Show music info, hide no-music state
        const musicInfo = document.getElementById('music-info');
        const noMusic = document.getElementById('no-music');

        if (musicInfo && noMusic) {
            musicInfo.style.display = 'block';
            noMusic.style.display = 'none';
        }

        // Update track details
        updateElement('track-title', track.title || 'Unknown Title');
        updateElement('track-artist', track.artist || 'Unknown Artist');
        updateElement('track-album', track.album || 'Unknown Album');

        // Update artwork
        updateArtwork(track.artworkPath);

        // Update status
        updatePlaybackStatus(track.status);

        // Update progress
        if (track.position !== undefined && track.duration !== undefined) {
            updatePosition(track.position, track.duration);
        }
    }

    function updateElement(id, text) {
        const element = document.querySelector(`.${id}`);
        if (element) {
            element.textContent = text;
            element.title = text; // Add tooltip for long text
        }
    }

    function updateArtwork(artworkPath) {
        const artworkContainer = document.querySelector('.artwork-container');
        if (!artworkContainer) {
            return;
        }

        // Remove existing artwork
        const existingArtwork = artworkContainer.querySelector('.artwork');
        if (existingArtwork) {
            existingArtwork.remove();
        }

        const placeholder = artworkContainer.querySelector('.artwork-placeholder');

        if (artworkPath && artworkPath !== 'undefined') {
            // Create and add artwork image
            const img = document.createElement('img');
            img.className = 'artwork';
            img.src = artworkPath;
            img.alt = 'Album artwork';

            img.onload = () => {
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
            };

            img.onerror = () => {
                if (placeholder) {
                    placeholder.style.display = 'flex';
                }
            };

            artworkContainer.appendChild(img);
        } else {
            // Show placeholder
            if (placeholder) {
                placeholder.style.display = 'flex';
            }
        }
    }

    function updatePlaybackStatus(status) {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusIcon = document.querySelector('.status-icon');
        const playPauseBtn = document.getElementById('play-pause-btn');

        // Remove existing status classes
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator';
        }

        switch (status) {
            case 'playing':
                if (statusIndicator) {
                    statusIndicator.classList.add('status-playing');
                }
                if (statusIcon) {
                    statusIcon.textContent = '▶️';
                }
                if (playPauseBtn) {
                    playPauseBtn.textContent = '⏸️';
                    playPauseBtn.title = 'Pause';
                }
                break;

            case 'paused':
                if (statusIndicator) {
                    statusIndicator.classList.add('status-paused');
                }
                if (statusIcon) {
                    statusIcon.textContent = '⏸️';
                }
                if (playPauseBtn) {
                    playPauseBtn.textContent = '▶️';
                    playPauseBtn.title = 'Play';
                }
                break;

            case 'stopped':
            default:
                if (statusIndicator) {
                    statusIndicator.classList.add('status-stopped');
                }
                if (statusIcon) {
                    statusIcon.textContent = '⏹️';
                }
                if (playPauseBtn) {
                    playPauseBtn.textContent = '▶️';
                    playPauseBtn.title = 'Play';
                }
                break;
        }
    }

    function updatePosition(position, duration) {
        // Update progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill && duration > 0) {
            const percentage = (position / duration) * 100;
            progressFill.style.width = `${Math.min(percentage, 100)}%`;
        }

        // Update time displays
        const currentTimeElement = document.querySelector('.current-time');
        const totalTimeElement = document.querySelector('.total-time');

        if (currentTimeElement) {
            currentTimeElement.textContent = formatTime(position);
        }

        if (totalTimeElement) {
            totalTimeElement.textContent = formatTime(duration);
        }
    }

    function showNoMusicState() {
        const musicInfo = document.getElementById('music-info');
        const noMusic = document.getElementById('no-music');

        if (musicInfo && noMusic) {
            musicInfo.style.display = 'none';
            noMusic.style.display = 'block';
        }

        currentTrack = null;
    }

    function formatTime(seconds) {
        if (!seconds || seconds < 0) {
            return '0:00';
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Debug function
    window.debugWebview = function () {
        console.log('Current track:', currentTrack);
        console.log('Webview ready:', webviewReady);
    };

})();