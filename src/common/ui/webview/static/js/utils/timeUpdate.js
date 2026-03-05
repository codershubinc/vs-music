// Time/progress update logic removed — position comes from D-Bus signals only.
// No manual timers or interpolation.
export { };


// Add a new function to handle progress bar visibility
function toggleProgressBar(show) {
    const progressContainer = document.getElementById('progress-container');
    const currentTimeElement = document.getElementById('current-time');
    const totalTimeElement = document.getElementById('total-time');

    if (progressContainer) {
        if (show) {
            progressContainer.style.display = 'block';
            progressContainer.setAttribute('aria-hidden', 'false');
        } else {
            progressContainer.style.display = 'none';
            progressContainer.setAttribute('aria-hidden', 'true');
        }
    }

    // Optionally hide time elements too
    if (!show) {
        if (currentTimeElement) currentTimeElement.style.display = 'none';
        if (totalTimeElement) totalTimeElement.style.display = 'none';
    } else {
        if (currentTimeElement) currentTimeElement.style.display = 'block';
        if (totalTimeElement) totalTimeElement.style.display = 'block';
    }
}

export {
    updateTime,
    updateProgress,
    resetProgress,
    toggleProgressBar
};