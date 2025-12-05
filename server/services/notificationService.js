const webpush = require('web-push');
const database = require('../models/database');

class NotificationService {
    constructor() {
        this.subscriptions = new Map(); // Store push subscriptions
        this.vapidKeys = null;
        this.initializeVAPID();
    }

    initializeVAPID() {
        // Generate VAPID keys if they don't exist
        // In production, these should be stored securely and reused
        if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
            this.vapidKeys = webpush.generateVAPIDKeys();
            console.log('VAPID Keys generated. Add these to your .env file:');
            console.log('VAPID_PUBLIC_KEY=' + this.vapidKeys.publicKey);
            console.log('VAPID_PRIVATE_KEY=' + this.vapidKeys.privateKey);
        } else {
            this.vapidKeys = {
                publicKey: process.env.VAPID_PUBLIC_KEY,
                privateKey: process.env.VAPID_PRIVATE_KEY
            };
        }

        webpush.setVapidDetails(
            'mailto:your-email@example.com',
            this.vapidKeys.publicKey,
            this.vapidKeys.privateKey
        );
    }

    getVAPIDPublicKey() {
        return this.vapidKeys.publicKey;
    }

    subscribe(subscription) {
        const key = JSON.stringify(subscription);
        this.subscriptions.set(key, subscription);
        console.log('New subscription added');
    }

    unsubscribe(subscription) {
        const key = JSON.stringify(subscription);
        this.subscriptions.delete(key);
        console.log('Subscription removed');
    }

    async sendNotification(subscription, title, body, data = {}) {
        try {
            // iOS requires specific payload format
            const payload = JSON.stringify({
                title,
                body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: data.tag || 'lesson-notification',
                data: data.data || {},
                ...data
            });

            const options = {
                TTL: 86400, // 24 hours
                urgency: 'normal'
            };

            await webpush.sendNotification(subscription, payload, options);
            console.log('Notification sent:', title);
        } catch (error) {
            console.error('Error sending notification:', error);
            // Remove invalid subscriptions
            if (error.statusCode === 410 || error.statusCode === 404) {
                this.unsubscribe(subscription);
            }
            throw error;
        }
    }

    async scheduleLessonNotifications(lesson) {
        const db = database.getDb();
        
        // Get notification settings
        const settings = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM notification_settings LIMIT 1', (err, row) => {
                if (err) reject(err);
                else resolve(row || {
                    enable_8am: 1,
                    enable_1hour: 1,
                    enable_30min: 1,
                    custom_8am_hour: 8,
                    custom_8am_minute: 0
                });
            });
        });

        // Get client info
        const client = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM clients WHERE id = ?', [lesson.client_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!client) return;

        const lessonDate = new Date(`${lesson.date}T${lesson.time}`);
        const now = new Date();
        const studentName = client.student_name || 'Student';
        const address = client.lesson_address || 'No address';
        const timeString = new Date(lessonDate).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });

        // Schedule 8 AM notification
        if (settings.enable_8am) {
            const eightAM = new Date(lesson.date);
            eightAM.setHours(settings.custom_8am_hour, settings.custom_8am_minute, 0, 0);
            
            if (eightAM < lessonDate && eightAM > now) {
                const delay = eightAM.getTime() - now.getTime();
                setTimeout(() => {
                    this.broadcastNotification(
                        `Lesson Today: ${studentName}`,
                        `Time: ${timeString}\nAddress: ${address}`,
                        { lessonId: lesson.id }
                    );
                }, delay);
            }
        }

        // Schedule 1 hour before
        if (settings.enable_1hour) {
            const oneHourBefore = new Date(lessonDate.getTime() - 60 * 60 * 1000);
            if (oneHourBefore > now) {
                const delay = oneHourBefore.getTime() - now.getTime();
                setTimeout(() => {
                    this.broadcastNotification(
                        `Lesson in 1 Hour: ${studentName}`,
                        `Time: ${timeString}\nAddress: ${address}`,
                        { lessonId: lesson.id }
                    );
                }, delay);
            }
        }

        // Schedule 30 minutes before
        if (settings.enable_30min) {
            const thirtyMinBefore = new Date(lessonDate.getTime() - 30 * 60 * 1000);
            if (thirtyMinBefore > now) {
                const delay = thirtyMinBefore.getTime() - now.getTime();
                setTimeout(() => {
                    this.broadcastNotification(
                        `Lesson in 30 Minutes: ${studentName}`,
                        `Time: ${timeString}\nAddress: ${address}`,
                        { lessonId: lesson.id }
                    );
                }, delay);
            }
        }
    }

    async broadcastNotification(title, body, data = {}) {
        const promises = Array.from(this.subscriptions.values()).map(sub =>
            this.sendNotification(sub, title, body, data)
        );
        await Promise.all(promises);
    }

    startScheduler() {
        // Check for upcoming lessons periodically
        setInterval(async () => {
            const db = database.getDb();
            const now = new Date();
            const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            db.all(`
                SELECT l.* FROM lessons l
                WHERE l.date >= date('now') 
                AND l.date <= date('now', '+1 day')
                ORDER BY l.date, l.time
            `, async (err, lessons) => {
                if (err) {
                    console.error('Error checking lessons:', err);
                    return;
                }

                for (const lesson of lessons) {
                    // This is a simplified scheduler - in production, you'd want
                    // a more robust system that tracks which notifications have been sent
                    await this.scheduleLessonNotifications(lesson);
                }
            });
        }, 60000); // Check every minute
    }
}

module.exports = new NotificationService();
