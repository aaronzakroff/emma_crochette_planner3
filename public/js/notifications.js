class NotificationManager {
    constructor() {
        this.subscription = null;
        this.vapidPublicKey = null;
        this.initializeServiceWorker();
    }

    async initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js', {
                    scope: '/'
                });
                console.log('Service Worker registered:', registration);
                
                // Wait for service worker to be ready
                await navigator.serviceWorker.ready;
                
                // Get VAPID key and subscribe (this will handle permission request)
                await this.initializePushNotifications();
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        } else {
            console.log('Service Workers are not supported');
        }
    }

    async initializePushNotifications() {
        try {
            // Check if we're on iOS
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            
            // Check if running as PWA on iOS
            const isStandalone = window.navigator.standalone || 
                                (window.matchMedia('(display-mode: standalone)').matches);
            
            if (isIOS && !isStandalone) {
                console.log('iOS detected but not installed as PWA. Please add to home screen for notifications.');
                // Show a helpful message to the user
                this.showIOSInstallPrompt();
                return;
            }
            
            // Request notification permission explicitly for iOS
            if ('Notification' in window) {
                if (Notification.permission === 'default') {
                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') {
                        console.log('Notification permission denied');
                        return;
                    }
                } else if (Notification.permission === 'denied') {
                    console.log('Notification permission was previously denied');
                    return;
                }
            }
            
            // Get VAPID public key
            const response = await API.getVAPIDKey();
            this.vapidPublicKey = response.publicKey;
            
            // Subscribe to push notifications
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                const registration = await navigator.serviceWorker.ready;
                
                // Check if already subscribed
                let subscription = await registration.pushManager.getSubscription();
                
                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
                    });
                }
                
                this.subscription = subscription;
                
                // Send subscription to server
                await API.subscribeToNotifications(this.subscription);
                console.log('Subscribed to push notifications');
            } else {
                console.log('Push notifications not supported');
            }
        } catch (error) {
            console.error('Push notification subscription failed:', error);
            // On iOS, some errors are expected if not installed as PWA
            if (error.name === 'NotSupportedError' || error.name === 'NotAllowedError') {
                console.log('Push notifications require the app to be installed as a PWA');
            }
        }
    }
    
    showIOSInstallPrompt() {
        // Only show once per session
        if (sessionStorage.getItem('ios-install-prompt-shown')) {
            return;
        }
        sessionStorage.setItem('ios-install-prompt-shown', 'true');
        
        // Show a helpful message
        const message = 'To receive notifications on iOS, please:\n\n' +
                       '1. Tap the Share button (square with arrow)\n' +
                       '2. Select "Add to Home Screen"\n' +
                       '3. Open the app from your home screen\n' +
                       '4. Allow notifications when prompted';
        
        setTimeout(() => {
            if (confirm(message)) {
                // User acknowledged
            }
        }, 2000);
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async loadSettings() {
        try {
            const settings = await API.getNotificationSettings();
            
            document.getElementById('enable-8am').checked = settings.enable_8am === 1;
            document.getElementById('enable-1hour').checked = settings.enable_1hour === 1;
            document.getElementById('enable-30min').checked = settings.enable_30min === 1;
            
            const time8am = new Date();
            time8am.setHours(settings.custom_8am_hour || 8, settings.custom_8am_minute || 0);
            document.getElementById('8am-time').value = this.formatTimeForInput(time8am);
            
            // Show/hide 8am time picker
            this.toggle8amTimePicker();
        } catch (error) {
            console.error('Error loading notification settings:', error);
        }
    }

    async saveSettings() {
        try {
            const time8am = document.getElementById('8am-time').value;
            const [hours, minutes] = time8am.split(':').map(Number);
            
            const settings = {
                enable_8am: document.getElementById('enable-8am').checked,
                enable_1hour: document.getElementById('enable-1hour').checked,
                enable_30min: document.getElementById('enable-30min').checked,
                custom_8am_hour: hours,
                custom_8am_minute: minutes
            };
            
            await API.updateNotificationSettings(settings);
            this.hideNotificationSettings();
            alert('Notification settings saved!');
        } catch (error) {
            console.error('Error saving notification settings:', error);
            alert('Failed to save notification settings: ' + error.message);
        }
    }

    showNotificationSettings() {
        this.loadSettings();
        document.getElementById('notification-settings-modal').classList.add('active');
    }

    hideNotificationSettings() {
        document.getElementById('notification-settings-modal').classList.remove('active');
    }

    toggle8amTimePicker() {
        const enabled = document.getElementById('enable-8am').checked;
        document.getElementById('8am-time-group').style.display = enabled ? 'block' : 'none';
    }

    formatTimeForInput(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
}



