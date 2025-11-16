# Contact Manager – API (My Part of the Project)

This is the backend/API section of our Contact Manager project. I set up both databases (SQL + NoSQL) and built the API routes the front-end team will use. This includes CRUD operations for contacts, search, sorting, pagination, and user preferences.

## How to Run It

```bash
cd server
npm install
cp .env.example .env
npm run db:init
npm run dev
```

The API will be live at:

```
http://localhost:4000
```

Make sure you have **MongoDB running locally**, or use **MongoDB Atlas** and update the `.env` file with your connection string.

## Main Endpoints

### Contacts
- `GET /api/contacts`
- `GET /api/contacts/:id`
- `POST /api/contacts`
- `PUT /api/contacts/:id`
- `DELETE /api/contacts/:id`

### Preferences
- `GET /api/preferences`
- `PUT /api/preferences`

### Optional Notes
- `GET /api/contacts/:id/notes`
- `POST /api/contacts/:id/notes`

## Testing Examples

```bash
curl http://localhost:4000/api/contacts
```

```bash
curl -X POST http://localhost:4000/api/contacts   -H "Content-Type: application/json"   -d '{"first_name":"Test","last_name":"User","email":"test@example.com"}'
```

This part of the project is fully complete and ready for the front-end team to connect their pages.
