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
        title.addEventListener('click', (e) => {
            // Reset overlay state
            easterEggOverlay.classList.remove('active', 'fade-in', 'fade-out');
            
            // Prepare audio with iOS Safari compatibility
            const audio = new Audio('/audio/dark-mystery-intro.mp3');
            audio.playsInline = true; // Required for iOS Safari
            audio.preload = 'auto'; // Preload for better performance
            audio.volume = 0.7; // Set volume to 70%
            
            // Show overlay and start fade-in (3 seconds)
            easterEggOverlay.classList.add('active', 'fade-in');
            
            // iOS Safari: Must start audio within user gesture context
            // Play immediately to unlock audio policy, then pause and resume at correct time
            const playPromise = audio.play().catch(err => {
                console.log('Audio play failed (iOS policy):', err);
            });
            
            // After unlock, pause and schedule play at 1.5 seconds
            playPromise.then(() => {
                // Pause immediately after unlock
                audio.pause();
                audio.currentTime = 0;
                
                // Play at 1.5 seconds after click
                setTimeout(() => {
                    audio.play().catch(err => {
                        console.log('Audio play failed at 1.5s:', err);
                    });
                }, 1500);
            }).catch(() => {
                // If initial play failed, try again after a short delay
                setTimeout(() => {
                    audio.play().catch(err => {
                        console.log('Audio play failed after retry:', err);
                    });
                }, 100);
            });
            
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
        }, { passive: false }); // Not passive - we need to prevent default if needed
    }
    
    console.log('App initialized');
});




