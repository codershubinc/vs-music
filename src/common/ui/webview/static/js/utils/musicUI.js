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

function showNoMusic() {
    console.log("Showing no music UI");

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


export {
    updateStatusIndicator,
    updatePlayPauseButton,
    showNoMusic,
    updateArtwork,
};