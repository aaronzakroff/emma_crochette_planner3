const express = require('express');
const router = express.Router();
const database = require('../models/database');
const notificationService = require('../services/notificationService');

// Get VAPID public key
router.get('/vapid-key', (req, res) => {
    res.json({ publicKey: notificationService.getVAPIDPublicKey() });
});

// Subscribe to push notifications
router.post('/subscribe', (req, res) => {
    const subscription = req.body;
    if (!subscription) {
        return res.status(400).json({ error: 'Subscription is required' });
    }
    notificationService.subscribe(subscription);
    res.json({ success: true });
});

// Unsubscribe from push notifications
router.post('/unsubscribe', (req, res) => {
    const subscription = req.body;
    if (subscription) {
        notificationService.unsubscribe(subscription);
    }
    res.json({ success: true });
});

// Get notification settings
router.get('/settings', (req, res) => {
    const db = database.getDb();
    db.get('SELECT * FROM notification_settings LIMIT 1', (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            const settings = row || {
                id: 1,
                enable_8am: 1,
                enable_1hour: 1,
                enable_30min: 1,
                custom_8am_hour: 8,
                custom_8am_minute: 0
            };
            res.json(settings);
        }
    });
});

// Update notification settings
router.put('/settings', (req, res) => {
    const db = database.getDb();
    const {
        enable_8am,
        enable_1hour,
        enable_30min,
        custom_8am_hour,
        custom_8am_minute
    } = req.body;

    db.run(`
        UPDATE notification_settings SET
            enable_8am = ?,
            enable_1hour = ?,
            enable_30min = ?,
            custom_8am_hour = ?,
            custom_8am_minute = ?
        WHERE id = 1
    `, [
        enable_8am ? 1 : 0,
        enable_1hour ? 1 : 0,
        enable_30min ? 1 : 0,
        custom_8am_hour || 8,
        custom_8am_minute || 0
    ], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            // Create settings if they don't exist
            db.run(`
                INSERT INTO notification_settings 
                (enable_8am, enable_1hour, enable_30min, custom_8am_hour, custom_8am_minute)
                VALUES (?, ?, ?, ?, ?)
            `, [
                enable_8am ? 1 : 0,
                enable_1hour ? 1 : 0,
                enable_30min ? 1 : 0,
                custom_8am_hour || 8,
                custom_8am_minute || 0
            ], function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                } else {
                    res.json({ id: this.lastID, ...req.body });
                }
            });
        } else {
            res.json({ id: 1, ...req.body });
        }
    });
});

module.exports = router;




