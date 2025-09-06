import { formatTime } from './helpers/timeFormat.js';

/**
 * Updates the total duration display and shows/hides progress container
 * Called once when track loads or changes
 */
function updateTime(duration) {
    const totalTimeElement = document.getElementById('total-time');
    const progressContainer = document.getElementById('progress-container');

    // Update total duration display
    if (totalTimeElement) {
        totalTimeElement.textContent = formatTime(duration || 0);
    }

    // Show progress UI only if we have a valid duration
    if (progressContainer) {
        if (duration && duration > 0) {
            progressContainer.style.display = 'block';
            progressContainer.setAttribute('aria-hidden', 'false');
        } else {
            progressContainer.style.display = 'none';
            progressContainer.setAttribute('aria-hidden', 'true');
        }
    }
}

/**
 * Updates the progress bar and current time display
 * Called repeatedly during playback (every second)
 */
function updateProgress(currentPosition, currentTrack) {
    // Early return if no track data
    if (!currentTrack) {
        console.warn('updateProgress: No current track provided');
        return;
    }

    // Validate position - allow 0 but not null/undefined
    if (currentPosition === null || currentPosition === undefined) {
        console.warn('updateProgress: Invalid position provided');
        return;
    }

    const duration = currentTrack.duration || 0;
    const progressFill = document.getElementById('progress-fill');
    const currentTimeElement = document.getElementById('current-time');

    // Update progress bar visual
    if (progressFill) {
        if (duration > 0) {
            // Calculate percentage with bounds checking
            const percentage = Math.max(0, Math.min((currentPosition / duration) * 100, 100));
            progressFill.style.width = `${percentage}%`;

            // Add aria attributes for accessibility
            const progressBar = progressFill.parentElement;
            if (progressBar) {
                progressBar.setAttribute('aria-valuenow', Math.round(percentage));
                progressBar.setAttribute('aria-valuetext', `${formatTime(currentPosition)} of ${formatTime(duration)}`);
            }
        } else {
            // No duration - hide progress
            progressFill.style.width = '0%';
        }
    }

    // Update current time display
    if (currentTimeElement) {
        currentTimeElement.textContent = formatTime(currentPosition);

        // Add title attribute for better UX
        currentTimeElement.title = `Current position: ${formatTime(currentPosition)}`;
    }
}

/**
 * Resets progress UI to initial state
 * Useful when no music is playing or track ends
 */
function resetProgress() {
    const progressFill = document.getElementById('progress-fill');
    const currentTimeElement = document.getElementById('current-time');
    const progressContainer = document.getElementById('progress-container');

    if (progressFill) {
        progressFill.style.width = '0%';
    }

    if (currentTimeElement) {
        currentTimeElement.textContent = '0:00';
        currentTimeElement.title = '';
    }

    if (progressContainer) {
        progressContainer.style.display = 'none';
        progressContainer.setAttribute('aria-hidden', 'true');
    }
}

export {
    updateTime,
    updateProgress,
    resetProgress
};