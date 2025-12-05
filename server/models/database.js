const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            // Ensure data directory exists before opening database
            const dataDir = path.join(__dirname, '../data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            const dbPath = path.join(__dirname, '../data', 'crochet_calendar.db');
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.initializeTables().then(resolve).catch(reject);
                }
            });
        });
    }

    initializeTables() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Clients table
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS clients (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        parent_name TEXT,
                        student_name TEXT NOT NULL,
                        hourly_rate REAL DEFAULT 0,
                        lesson_address TEXT,
                        city TEXT,
                        favorite_color TEXT,
                        last_row_finished TEXT,
                        current_project_name TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // Lessons table
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS lessons (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        client_id INTEGER NOT NULL,
                        date DATE NOT NULL,
                        time TIME NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
                    )
                `);

                // Notification settings table
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS notification_settings (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        enable_8am BOOLEAN DEFAULT 1,
                        enable_1hour BOOLEAN DEFAULT 1,
                        enable_30min BOOLEAN DEFAULT 1,
                        custom_8am_hour INTEGER DEFAULT 8,
                        custom_8am_minute INTEGER DEFAULT 0
                    )
                `, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Initialize default settings if table is empty
                        this.db.get('SELECT COUNT(*) as count FROM notification_settings', (err, row) => {
                            if (err) {
                                reject(err);
                            } else if (row.count === 0) {
                                this.db.run(`
                                    INSERT INTO notification_settings 
                                    (enable_8am, enable_1hour, enable_30min, custom_8am_hour, custom_8am_minute)
                                    VALUES (1, 1, 1, 8, 0)
                                `, (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    getDb() {
        return this.db;
    }
}

module.exports = new Database();

