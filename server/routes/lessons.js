const express = require('express');
const router = express.Router();
const database = require('../models/database');

// Get all lessons
router.get('/', (req, res) => {
    const db = database.getDb();
    const query = `
        SELECT l.*, c.*, c.id as client_id
        FROM lessons l
        JOIN clients c ON l.client_id = c.id
        ORDER BY l.date, l.time
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            // Format the response
            const lessons = rows.map(row => ({
                id: row.id,
                client_id: row.client_id,
                date: row.date,
                time: row.time,
                client: {
                    id: row.client_id,
                    parent_name: row.parent_name,
                    student_name: row.student_name,
                    hourly_rate: row.hourly_rate,
                    lesson_address: row.lesson_address,
                    city: row.city,
                    favorite_color: row.favorite_color,
                    last_row_finished: row.last_row_finished,
                    current_project_name: row.current_project_name
                }
            }));
            res.json(lessons);
        }
    });
});

// Get lessons for a specific date range
router.get('/range', (req, res) => {
    const db = database.getDb();
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const query = `
        SELECT l.*, c.*, c.id as client_id
        FROM lessons l
        JOIN clients c ON l.client_id = c.id
        WHERE l.date >= ? AND l.date <= ?
        ORDER BY l.date, l.time
    `;
    
    db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            const lessons = rows.map(row => ({
                id: row.id,
                client_id: row.client_id,
                date: row.date,
                time: row.time,
                client: {
                    id: row.client_id,
                    parent_name: row.parent_name,
                    student_name: row.student_name,
                    hourly_rate: row.hourly_rate,
                    lesson_address: row.lesson_address,
                    city: row.city,
                    favorite_color: row.favorite_color,
                    last_row_finished: row.last_row_finished,
                    current_project_name: row.current_project_name
                }
            }));
            res.json(lessons);
        }
    });
});

// Get lesson by ID
router.get('/:id', (req, res) => {
    const db = database.getDb();
    const id = req.params.id;
    
    const query = `
        SELECT l.*, c.*, c.id as client_id
        FROM lessons l
        JOIN clients c ON l.client_id = c.id
        WHERE l.id = ?
    `;
    
    db.get(query, [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Lesson not found' });
        } else {
            res.json({
                id: row.id,
                client_id: row.client_id,
                date: row.date,
                time: row.time,
                client: {
                    id: row.client_id,
                    parent_name: row.parent_name,
                    student_name: row.student_name,
                    hourly_rate: row.hourly_rate,
                    lesson_address: row.lesson_address,
                    city: row.city,
                    favorite_color: row.favorite_color,
                    last_row_finished: row.last_row_finished,
                    current_project_name: row.current_project_name
                }
            });
        }
    });
});

// Create new lesson
router.post('/', (req, res) => {
    const db = database.getDb();
    const { client_id, date, time } = req.body;

    if (!client_id || !date || !time) {
        return res.status(400).json({ error: 'client_id, date, and time are required' });
    }

    db.run(
        'INSERT INTO lessons (client_id, date, time) VALUES (?, ?, ?)',
        [client_id, date, time],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                // Fetch the created lesson with client data
                const query = `
                    SELECT l.*, c.*, c.id as client_id
                    FROM lessons l
                    JOIN clients c ON l.client_id = c.id
                    WHERE l.id = ?
                `;
                db.get(query, [this.lastID], (err, row) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                    } else {
                        res.json({
                            id: row.id,
                            client_id: row.client_id,
                            date: row.date,
                            time: row.time,
                            client: {
                                id: row.client_id,
                                parent_name: row.parent_name,
                                student_name: row.student_name,
                                hourly_rate: row.hourly_rate,
                                lesson_address: row.lesson_address,
                                city: row.city,
                                favorite_color: row.favorite_color,
                                last_row_finished: row.last_row_finished,
                                current_project_name: row.current_project_name
                            }
                        });
                    }
                });
            }
        }
    );
});

// Update lesson
router.put('/:id', (req, res) => {
    const db = database.getDb();
    const id = req.params.id;
    const { client_id, date, time } = req.body;

    if (!date || !time) {
        return res.status(400).json({ error: 'date and time are required' });
    }

    db.run(
        'UPDATE lessons SET client_id = ?, date = ?, time = ? WHERE id = ?',
        [client_id, date, time, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Lesson not found' });
            } else {
                res.json({ id: parseInt(id), client_id, date, time });
            }
        }
    );
});

// Delete lesson
router.delete('/:id', (req, res) => {
    const db = database.getDb();
    const id = req.params.id;

    db.run('DELETE FROM lessons WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Lesson not found' });
        } else {
            res.json({ message: 'Lesson deleted successfully' });
        }
    });
});

module.exports = router;




