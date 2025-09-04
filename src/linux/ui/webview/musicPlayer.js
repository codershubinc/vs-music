// VS Music Player - Compact UI JavaScript
(function() {
    'use strict';

    const vscode = acquireVsCodeApi();
    let currentTrack = null;

    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        console.log('Webview received message:', message);

        switch (message.command) {
            case 'updateTrack':
                updateTrack(message.track, message.artworkUri, message.position);
                break;
            case 'updateProgress':
                updateProgress(message.position);
                break;
        }
    });

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeControls();
        // Signal that webview is ready
        vscode.postMessage({ command: 'webviewReady' });
    });

    function initializeControls() {
        // Control button event listeners
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

        // Progress bar click for seeking (future enhancement)
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', handleProgressClick);
        }
    }

    function updateTrack(track, artworkUri, position) {
        console.log('Updating track:', track, 'Artwork:', artworkUri, 'Position:', position);

        if (!track || !track.title) {
            showNoMusic();
            return;
        }

        currentTrack = track;

        // Show music info, hide no-music
        const noMusicEl = document.getElementById('no-music');
        const musicInfoEl = document.getElementById('music-info');
        
        if (noMusicEl) noMusicEl.classList.add('hidden');
        if (musicInfoEl) musicInfoEl.classList.remove('hidden');

        // Update track details
        updateElement('track-title', track.title || 'Unknown Title');
        updateElement('track-artist', track.artist || 'Unknown Artist');
        updateElement('track-album', track.album || 'Unknown Album');

        // Update artwork
        updateArtwork(artworkUri);

        // Update play/pause button
        updatePlayPauseButton(track.status);

        // Update progress and time
        updateProgress(position || track.position || 0);
        updateTime(track.duration || 0);
    }

    function updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    function updateArtwork(artworkUri) {
        const albumArt = document.getElementById('album-art');
        if (!albumArt) return;

        if (artworkUri && artworkUri !== '') {
            albumArt.innerHTML = `<img src="${artworkUri}" alt="Album artwork" onerror="this.parentElement.innerHTML='🎵'">`;
        } else {
            albumArt.innerHTML = '🎵';
        }
    }

    function updatePlayPauseButton(status) {
        const playPauseBtn = document.getElementById('play-pause-btn');
        if (!playPauseBtn) return;

        if (status === 'playing') {
            playPauseBtn.textContent = '⏸️';
            playPauseBtn.title = 'Pause';
        } else {
            playPauseBtn.textContent = '▶️';
            playPauseBtn.title = 'Play';
        }
    }

    function updateProgress(currentPosition) {
        if (!currentTrack) return;

        const duration = currentTrack.duration || 0;
        const progressFill = document.getElementById('progress-fill');
        const currentTimeElement = document.getElementById('current-time');

        if (progressFill && duration > 0) {
            const percentage = Math.min((currentPosition / duration) * 100, 100);
            progressFill.style.width = `${percentage}%`;
        }

        if (currentTimeElement) {
            currentTimeElement.textContent = formatTime(currentPosition);
        }
    }

    function updateTime(duration) {
        const totalTimeElement = document.getElementById('total-time');
        if (totalTimeElement) {
            totalTimeElement.textContent = formatTime(duration);
        }
    }

    function showNoMusic() {
        const musicInfoEl = document.getElementById('music-info');
        const noMusicEl = document.getElementById('no-music');
        
        if (musicInfoEl) musicInfoEl.classList.add('hidden');
        if (noMusicEl) noMusicEl.classList.remove('hidden');
        
        currentTrack = null;
    }

    function formatTime(seconds) {
        if (!seconds || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function handleProgressClick(event) {
        if (!currentTrack || !currentTrack.duration) return;
        
        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newPosition = percentage * currentTrack.duration;
        
        // Send seek command to extension (for future implementation)
        // vscode.postMessage({ command: 'seek', position: newPosition });
    }

})();