# Crochet Lesson Calendar

A web application for managing crochet lesson clients with a beautiful calendar interface. Optimized for iPhone browsers with PWA support.

## Features

- **Calendar Views**: Monthly and weekly calendar views showing all scheduled lessons
- **Client Profiles**: Detailed client information including:
  - Parent's Name
  - Student's Name
  - Hourly Rate
  - Lesson Address
  - Student's Favorite Color
  - Last Row Finished
  - Current Project Name
- **Notifications**: Web push notifications at:
  - 8:00 AM on the day of the lesson (configurable)
  - 1 hour before the lesson
  - 30 minutes before the lesson
- **Full CRUD Operations**: Add, edit, and delete clients and lessons
- **Beautiful UI**: Soft blue and pink color scheme with yarn-style borders
- **PWA Support**: Can be installed on iPhone home screen

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

### First Time Setup

1. The database will be automatically created on first run
2. Grant notification permissions when prompted by your browser
3. The app will automatically subscribe to push notifications

## Project Structure

```
├── server/
│   ├── server.js              # Express server setup
│   ├── models/
│   │   └── database.js        # SQLite database setup
│   ├── routes/
│   │   ├── clients.js         # Client CRUD endpoints
│   │   ├── lessons.js         # Lesson management endpoints
│   │   └── notifications.js   # Notification settings endpoints
│   └── services/
│       └── notificationService.js  # Web push notification service
├── public/
│   ├── index.html             # Main HTML file
│   ├── css/
│   │   ├── styles.css         # Main styles
│   │   └── calendar.css      # Calendar-specific styles
│   ├── js/
│   │   ├── app.js             # Main app initialization
│   │   ├── api.js             # API communication
│   │   ├── calendar.js        # Calendar views
│   │   ├── client.js          # Client management
│   │   └── notifications.js   # Notification handling
│   ├── service-worker.js      # Service worker for PWA
│   └── manifest.json          # PWA manifest
└── package.json
```

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express
- **Database**: SQLite
- **Notifications**: Web Push API
- **PWA**: Service Worker, Web App Manifest

## Usage

### Adding a Client
1. Click the "+" button in the header
2. Fill in client information
3. Set lesson date and time
4. Click "Save"

### Viewing Client Details
1. Click on any client card on the calendar
2. View all client information and upcoming lessons
3. Edit or delete from the client profile

### Calendar Navigation
- Toggle between Monthly and Weekly views
- Use arrow buttons to navigate between months/weeks
- Click on client cards to view details

### Notification Settings
1. Click the bell icon in the header
2. Configure notification timing
3. Enable/disable specific notification types
4. Save settings

## iPhone Optimization

The app is optimized for iPhone browsers:
- Responsive design for mobile screens
- Touch-friendly interface
- Can be added to home screen (PWA)
- Works offline with service worker caching

## Database

The app uses SQLite for data storage. The database file is created automatically in `server/data/crochet_calendar.db`.

## Notifications

Web push notifications require:
- HTTPS (or localhost for development)
- User permission
- Service worker registration

The app will automatically request notification permissions on first load.

### iOS PWA Notifications

iOS 16.4+ supports web push notifications for PWAs. To enable notifications on iOS:

1. **Install the PWA:**
   - Open the app in Safari on iOS
   - Tap the Share button (square with arrow)
   - Select "Add to Home Screen"
   - Give it a name and tap "Add"

2. **Open from Home Screen:**
   - Open the app from your home screen (not from Safari)
   - The app will request notification permissions
   - Allow notifications when prompted

3. **Requirements:**
   - iOS 16.4 or later
   - App must be installed as PWA (added to home screen)
   - App must be opened from home screen (not Safari)
   - HTTPS required (localhost works for development)

**Note:** Notifications will only work when the app is installed as a PWA and opened from the home screen. They will not work when accessed through Safari.

## Development

### Environment Variables

Create a `.env` file in the root directory for production:
```
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

VAPID keys are automatically generated on first run if not provided.

### Port Configuration

Default port is 3000. Set `PORT` environment variable to change:
```bash
PORT=8080 npm start
```

## License

ISC