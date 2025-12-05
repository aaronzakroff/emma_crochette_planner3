const express = require('express');
const router = express.Router();
const database = require('../models/database');

// Ensure database is initialized before handling requests
router.use(async (req, res, next) => {
    if (!database.getDb()) {
        try {
            await database.connect();
        } catch (err) {
            console.error('Database connection error:', err);
            return res.status(500).json({ error: 'Database connection failed' });
        }
    }
    next();
});

// Get all clients
router.get('/', (req, res) => {
    const db = database.getDb();
    db.all('SELECT * FROM clients ORDER BY student_name', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Get client by ID
router.get('/:id', (req, res) => {
    const db = database.getDb();
    const id = req.params.id;
    
    db.get('SELECT * FROM clients WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Client not found' });
        } else {
            res.json(row);
        }
    });
});

// Create new client
router.post('/', (req, res) => {
    const db = database.getDb();
    const {
        parent_name,
        student_name,
        hourly_rate,
        lesson_address,
        city,
        favorite_color,
        last_row_finished,
        current_project_name
    } = req.body;

    if (!student_name) {
        return res.status(400).json({ error: 'Student name is required' });
    }

    db.run(`
        INSERT INTO clients (
            parent_name, student_name, hourly_rate, lesson_address,
            city, favorite_color, last_row_finished, current_project_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        parent_name || null,
        student_name,
        hourly_rate || 0,
        lesson_address || null,
        city || null,
        favorite_color || null,
        last_row_finished || null,
        current_project_name || null
    ], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ id: this.lastID, ...req.body });
        }
    });
});

// Update client
router.put('/:id', (req, res) => {
    const db = database.getDb();
    const id = req.params.id;
    const {
        parent_name,
        student_name,
        hourly_rate,
        lesson_address,
        city,
        favorite_color,
        last_row_finished,
        current_project_name
    } = req.body;

    if (!student_name) {
        return res.status(400).json({ error: 'Student name is required' });
    }

    db.run(`
        UPDATE clients SET
            parent_name = ?,
            student_name = ?,
            hourly_rate = ?,
            lesson_address = ?,
            city = ?,
            favorite_color = ?,
            last_row_finished = ?,
            current_project_name = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [
        parent_name || null,
        student_name,
        hourly_rate || 0,
        lesson_address || null,
        city || null,
        favorite_color || null,
        last_row_finished || null,
        current_project_name || null,
        id
    ], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Client not found' });
        } else {
            res.json({ id: parseInt(id), ...req.body });
        }
    });
});

// Delete client
router.delete('/:id', (req, res) => {
    const db = database.getDb();
    const id = req.params.id;

    db.run('DELETE FROM clients WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Client not found' });
        } else {
            res.json({ message: 'Client deleted successfully' });
        }
    });
});

module.exports = router;




