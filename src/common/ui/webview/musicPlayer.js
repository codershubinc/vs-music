// VS Music Player - Webview JavaScript
(function () {
    'use strict';

    const vscode = acquireVsCodeApi();
    let currentTrack = null;
    let progressUpdateInterval = null;

    // Message listener for extension communication
    window.addEventListener('message', event => {
        const message = event.data;

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
        if (!track || !track.title) {
            showNoMusic();
            return;
        }

        const isNewTrack = !currentTrack || currentTrack.title !== track.title || currentTrack.artist !== track.artist;
        const statusChanged = !currentTrack || currentTrack.status !== track.status;

        // Only clear interval if it's a completely new track
        if (isNewTrack) {
            if (progressUpdateInterval) {
                console.log('Clearing interval for new track');
                clearInterval(progressUpdateInterval);
                progressUpdateInterval = null;
            }
        }

        currentTrack = track;

        // Only update position from extension if:
        // 1. We don't have a manual timer running AND it's playing, OR
        // 2. Status changed (pause/play), OR  
        // 3. It's a new track, OR
        // 4. The track is not currently playing
        if (!progressUpdateInterval || statusChanged || isNewTrack || track.status !== 'playing') {
            if (position !== undefined) {
                currentTrack.position = position;
                console.log(`Position updated from extension: ${position}s`);
            }
        } else {
            // Keep our manual position if timer is running and track is playing
            console.log(`Keeping manual position: ${currentTrack.position}s (extension sent: ${position}s)`);
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

    function updateArtwork(artworkUri) {
        const albumArt = document.getElementById('album-art');
        if (!albumArt) {
            return;
        }

        if (artworkUri && artworkUri !== '') {
            albumArt.innerHTML = `<img src="${artworkUri}" alt="Album artwork" onerror="this.parentElement.innerHTML='🎵'">`;
        } else {
            albumArt.innerHTML = '🎵';
        }
    }

    function updateStatusIndicator(status) {
        const statusIndicator = document.getElementById('status-indicator');
        if (!statusIndicator) {
            return;
        }

        // Remove existing status classes
        statusIndicator.className = 'status-indicator';

        // Add appropriate status class and icon
        if (status === 'playing') {
            statusIndicator.classList.add('status-playing');
            statusIndicator.textContent = '▶';
        } else if (status === 'paused') {
            statusIndicator.classList.add('status-paused');
            statusIndicator.textContent = '⏸';
        } else {
            statusIndicator.classList.add('status-stopped');
            statusIndicator.textContent = '⏹';
        }
    }

    function startManualTimeUpdate() {
        let manualUpdatedTime;
        // Clear any existing interval
        if (progressUpdateInterval) {
            clearInterval(progressUpdateInterval);
            progressUpdateInterval = null;
        }

        console.log(`startManualTimeUpdate called - track: ${currentTrack?.title}, status: ${currentTrack?.status}, duration: ${currentTrack?.duration}`);

        // Only start manual updates if playing and has duration
        if (currentTrack && (currentTrack.status === 'playing' || currentTrack.status === 'Playing') && currentTrack.duration > 0) {
            console.log('Starting manual time update interval');
            progressUpdateInterval = setInterval(() => {
                if (currentTrack && (currentTrack.status === 'playing' || currentTrack.status === 'Playing')) {
                    // Increment position by 1 second
                    manualUpdatedTime = (currentTrack.position || 0) + 1;

                    // Don't exceed duration
                    if (manualUpdatedTime >= currentTrack.duration) {
                        currentTrack.position = currentTrack.duration;
                        clearInterval(progressUpdateInterval);
                        progressUpdateInterval = null;
                        console.log('Manual timer stopped - reached end of track');
                        return;
                    }

                    // Store the updated position back to the track object
                    currentTrack.position = manualUpdatedTime;

                    console.log(`Manual Update - Position: ${manualUpdatedTime}s / ${currentTrack.duration}s`);

                    // Update progress display
                    updateProgress(manualUpdatedTime);
                } else {
                    // Stop interval if not playing
                    console.log(`Manual update stopped - status: ${currentTrack?.status}`);
                    clearInterval(progressUpdateInterval);
                    progressUpdateInterval = null;
                }
            }, 1000);
        } else {
            console.log(`Not starting manual update - status: ${currentTrack?.status}, duration: ${currentTrack?.duration}`);
        }
    }

    function updatePlayPauseButton(status) {
        const playPauseBtn = document.getElementById('play-pause-btn');
        if (!playPauseBtn) {
            return;
        }

        if (status === 'playing' || status === 'Playing') {
            playPauseBtn.innerHTML = '⏸️';
            playPauseBtn.title = 'Pause';
        } else {
            playPauseBtn.innerHTML = '▶️';
            playPauseBtn.title = 'Play';
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
            currentTimeElement.textContent = formatTime(currentPosition);
        }
    }

    function updateTime(duration) {
        const totalTimeElement = document.getElementById('total-time');
        const progressContainer = document.getElementById('progress-container');

        if (totalTimeElement) {
            totalTimeElement.textContent = formatTime(duration);
        }

        // Show/hide progress container based on whether we have duration
        if (progressContainer) {
            if (duration && duration > 0) {
                progressContainer.style.display = 'block';
            } else {
                progressContainer.style.display = 'none';
            }
        }
    }

    function showNoMusic() {
        // Clear any running intervals
        if (progressUpdateInterval) {
            clearInterval(progressUpdateInterval);
            progressUpdateInterval = null;
        }

        const musicInfoEl = document.getElementById('music-info');
        const noMusicEl = document.getElementById('no-music');

        if (musicInfoEl) {
            musicInfoEl.classList.add('hidden');
        }
        if (noMusicEl) {
            noMusicEl.classList.remove('hidden');
        }

        currentTrack = null;
    }

    // Helper function to format time in MM:SS format
    function formatTime(seconds) {
        if (!seconds || seconds < 0) {
            return '0:00';
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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