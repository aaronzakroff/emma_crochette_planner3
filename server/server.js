const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const database = require('./models/database');
const clientRoutes = require('./routes/clients');
const lessonRoutes = require('./routes/lessons');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory with proper headers for PWA
app.use(express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, filePath) => {
        // Set proper content type for service worker
        if (filePath.endsWith('service-worker.js')) {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Service-Worker-Allowed', '/');
        }
        // Set proper content type for manifest
        if (filePath.endsWith('manifest.json')) {
            res.setHeader('Content-Type', 'application/manifest+json');
        }
    }
}));

// API Routes
app.use('/api/clients', clientRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Initialize database and start server
database.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    await database.close();
    process.exit(0);
});



