# Contact Manager

CSC441 Web App Development Group Project - A web application to store and manage contacts with names, phone numbers, and email addresses.

## Features

- Add, edit, and delete contacts
- Search and sort contacts
- Add notes to contacts
- Dark/light theme toggle
- Responsive design

## Technology Stack

- **Backend**: Node.js, Express, SQLite (SQL), NeDB (NoSQL)
- **Frontend**: HTML, CSS, JavaScript

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Initialize database**
   ```bash
   npm run db:init
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:4000
   ```

## Database Scripts

- `npm run db:init` - Initialize SQLite database with schema and sample data
- `npm run dev` - Start server with auto-reload

## Team Responsibilities

- **Backend/Database**: Express API, SQLite setup, MongoDB integration, API endpoints
- **JavaScript/Interactivity**: All frontend JavaScript, API calls, search/sort/pagination, modal dialogs, notes feature
- (Martin Aguirre) **UI/Design**: HTML structure, CSS styling, responsive layout, theme system

## API Endpoints

### Contacts (SQLite)
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### NoSQL Features (NeDB)
- `GET/PUT /api/preferences` - User preferences
- `GET/POST /api/contacts/:id/notes` - Contact notes
