// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize managers
    window.calendar = new Calendar();
    window.clientManager = new ClientManager();
    window.notificationManager = new NotificationManager();
    
    // Load initial data
    await window.calendar.loadLessons();
    await window.calendar.render();
    
    // Notification settings button
    document.getElementById('notification-settings-btn').addEventListener('click', () => {
        window.notificationManager.showNotificationSettings();
    });
    
    // Close notification settings modal
    document.getElementById('close-notification-modal').addEventListener('click', () => {
        window.notificationManager.hideNotificationSettings();
    });
    
    // Save notification settings
    document.getElementById('save-notification-settings').addEventListener('click', () => {
        window.notificationManager.saveSettings();
    });
    
    // Toggle 8am time picker
    document.getElementById('enable-8am').addEventListener('change', () => {
        window.notificationManager.toggle8amTimePicker();
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Easter egg: Click on title to show image
    const title = document.querySelector('.app-header h1');
    const easterEggOverlay = document.getElementById('easter-egg-overlay');
    
    if (title && easterEggOverlay) {
        title.style.cursor = 'pointer';
        title.addEventListener('click', () => {
            // Reset overlay state
            easterEggOverlay.classList.remove('active', 'fade-in', 'fade-out');
            
            // Prepare audio
            const audio = new Audio('/audio/dark-mystery-intro.mp3');
            audio.volume = 0.7; // Set volume to 70%
            
            // Show overlay and start fade-in (3 seconds)
            easterEggOverlay.classList.add('active', 'fade-in');
            
            // Play audio after 1.5 seconds from click
            setTimeout(() => {
                audio.play().catch(err => {
                    console.log('Audio file not found. Please download the sound from https://pixabay.com/sound-effects/dark-mystery-intro-398656/ and save it as public/audio/dark-mystery-intro.mp3');
                });
            }, 1500); // Audio starts 1.5s after click
            
            // After fade-in (3s) + visible time (3s) = 6s, start fade-out
            setTimeout(() => {
                easterEggOverlay.classList.remove('fade-in');
                easterEggOverlay.classList.add('fade-out');
                
                // After fade-out completes (3s), remove overlay and stop audio
                setTimeout(() => {
                    easterEggOverlay.classList.remove('active', 'fade-out');
                    // Stop audio if still playing
                    audio.pause();
                    audio.currentTime = 0;
                }, 3000); // Fade-out duration (3 seconds)
            }, 6000); // Fade-in (3s) + visible (3s) = 6s
        });
    }
    
    console.log('App initialized');
});




