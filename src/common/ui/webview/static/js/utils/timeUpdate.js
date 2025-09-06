function startManualTimeUpdate() {
    // Clear any existing interval
    if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval);
        progressUpdateInterval = null;
    }

    // Only start manual updates if playing and has duration
    if (currentTrack && (currentTrack.status === 'playing' || currentTrack.status === 'Playing') && currentTrack.duration > 0) {
        progressUpdateInterval = setInterval(() => {
            if (currentTrack && (currentTrack.status === 'playing' || currentTrack.status === 'Playing')) {
                // Increment position by 1 second
                const newPosition = (currentTrack.position || 0) + 1;

                // Don't exceed duration
                if (newPosition >= currentTrack.duration) {
                    currentTrack.position = currentTrack.duration;
                    clearInterval(progressUpdateInterval);
                    progressUpdateInterval = null;
                    return;
                }

                // Store the updated position back to the track object
                currentTrack.position = newPosition;

                // Update progress display
                updateProgress(newPosition);
            } else {
                // Stop interval if not playing
                clearInterval(progressUpdateInterval);
                progressUpdateInterval = null;
            }
        }, 1000);
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



export {
    startManualTimeUpdate,
    updateTime
};