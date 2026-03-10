# Real-Time Collaborative Whiteboard

## Overview
A real-time collaborative whiteboard where multiple users can create and modify content on a shared canvas. The application supports live collaboration, offline editing, automatic synchronization, and persistent board state.

---

# Features

### Shared Whiteboard Sessions
- Users can create or join whiteboard sessions.
- Multiple users can collaborate on the same board simultaneously.
- Each board maintains its own state and collaborators.

### Canvas Drawing and Editing
Users can interact with elements on the canvas:
- Draw rectangles, circles, text, and sticky notes
- Move elements using drag and drop
- Edit and delete elements

### Zoom and Pan
- Canvas supports zooming using mouse wheel.
- Users can navigate large boards using pan interactions.

### Real-Time Collaboration
- Changes made by one user appear for all users instantly.
- Implemented using Socket.IO.
- Includes live cursor indicators for collaborators.

### Offline Editing
- Users can continue editing when internet connection is lost.
- Changes are stored locally in IndexedDB.

### Automatic Sync
- When internet connectivity returns, offline changes are automatically synced with the server.

### Conflict Resolution
- Version-based conflict resolution prevents overwriting newer changes from other users.

### Connection Status Indicators
Visual indicators display current connection status:
- 🟢 Online
- 🔴 Offline
- 🟡 Syncing

### Board Persistence
- All board elements are stored in MongoDB.
- Board state is restored when the page reloads.

---

# Tech Stack

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- Socket.IO
- JWT Authentication

### Frontend
- React
- TypeScript
- Redux Toolkit
- RTK Query
- Material UI
- React-Konva
- Dexie (IndexedDB)

---

# Startup Commands

## Backend
```bash
cd backend
npm install
npm run dev
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```

Backend runs on:
```
http://localhost:5000
```

Frontend runs on:
```
http://localhost:3000
```

---

# Environment Variables

### Backend `.env`

```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_ACCESS_SECRET=your_secret
JWT_REFRESH_SECRET=your_secret
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:3000
```

### Frontend `.env`

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

# Result
This system demonstrates a full collaborative application with:

- Real-time synchronization
- Offline-first editing
- Conflict resolution
- Persistent board storage
- Multi-user collaboration