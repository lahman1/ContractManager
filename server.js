require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const Datastore = require('@seald-io/nedb');
const { z } = require('zod');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ---------- SQL (SQLite) ----------
let sql;
try {
  sql = new Database('./db/contacts.sqlite3', { fileMustExist: true });
} catch (e) {
  console.error('SQLite DB not found. Run `npm run db:init` first.');
  process.exit(1);
}

const contactSchema = z.object({
  first_name: z.string().min(1),
  last_name:  z.string().min(1),
  email:      z.string().email(),
  phone:      z.string().optional().nullable(),
  company:    z.string().optional().nullable()
});

// GET /api/contacts?search=&page=&pageSize=&sort=last_name:asc
app.get('/api/contacts', (req, res) => {
  const { search = '', page = 1, pageSize = 10, sort = 'last_name:asc' } = req.query;
  const [sortCol, sortDir] = (sort || 'last_name:asc').split(':');

  const safeCol = ['first_name','last_name','email','created_at','updated_at'].includes(sortCol) ? sortCol : 'last_name';
  const safeDir = (sortDir || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const like = `%${search}%`;
  const offset = (Number(page) - 1) * Number(pageSize);

  const total = sql.prepare(
    `SELECT COUNT(*) AS c FROM contacts
     WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?`
  ).get(like, like, like).c;

  const rows = sql.prepare(
    `SELECT * FROM contacts
     WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
     ORDER BY ${safeCol} ${safeDir}
     LIMIT ? OFFSET ?`
  ).all(like, like, like, Number(pageSize), offset);

  res.json({ data: rows, page: Number(page), pageSize: Number(pageSize), total });
});

// GET /api/contacts/:id
app.get('/api/contacts/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = sql.prepare(`SELECT * FROM contacts WHERE id = ?`).get(id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// POST /api/contacts
app.post('/api/contacts', (req, res) => {
  const parse = contactSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const { first_name, last_name, email, phone = null, company = null } = parse.data;

  try {
    const stmt = sql.prepare(
      `INSERT INTO contacts (first_name,last_name,email,phone,company,created_at,updated_at)
       VALUES (?,?,?,?,?,datetime('now'),datetime('now'))`
    );
    const info = stmt.run(first_name, last_name, email, phone, company);
    const row = sql.prepare(`SELECT * FROM contacts WHERE id = ?`).get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (e) {
    if (String(e).includes('UNIQUE constraint failed: contacts.email')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Insert failed' });
  }
});

// PUT /api/contacts/:id
app.put('/api/contacts/:id', (req, res) => {
  const id = Number(req.params.id);
  const parse = contactSchema.partial().safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const existing = sql.prepare(`SELECT * FROM contacts WHERE id = ?`).get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const updated = { ...existing, ...parse.data };
  try {
    sql.prepare(
      `UPDATE contacts
       SET first_name=?, last_name=?, email=?, phone=?, company=?, updated_at=datetime('now')
       WHERE id=?`
    ).run(updated.first_name, updated.last_name, updated.email, updated.phone, updated.company, id);
    const row = sql.prepare(`SELECT * FROM contacts WHERE id = ?`).get(id);
    res.json(row);
  } catch (e) {
    if (String(e).includes('UNIQUE constraint failed: contacts.email')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Update failed' });
  }
});

// DELETE /api/contacts/:id
app.delete('/api/contacts/:id', (req, res) => {
  const id = Number(req.params.id);
  const changes = sql.prepare(`DELETE FROM contacts WHERE id = ?`).run(id).changes;
  if (!changes) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

// ---------- NoSQL (NeDB) ----------
const Preferences = new Datastore({ filename: './db/preferences.db', autoload: true });
const Notes = new Datastore({ filename: './db/notes.db', autoload: true });

// Promisify NeDB methods for easier async/await usage
const findOne = (collection, query) => new Promise((resolve, reject) => {
  collection.findOne(query, (err, doc) => err ? reject(err) : resolve(doc));
});

const find = (collection, query) => new Promise((resolve, reject) => {
  collection.find(query).sort({ createdAt: -1 }).exec((err, docs) => err ? reject(err) : resolve(docs));
});

const update = (collection, query, update, options) => new Promise((resolve, reject) => {
  collection.update(query, update, options, (err, numAffected, affectedDocuments) => {
    err ? reject(err) : resolve(affectedDocuments);
  });
});

const insert = (collection, doc) => new Promise((resolve, reject) => {
  collection.insert(doc, (err, newDoc) => err ? reject(err) : resolve(newDoc));
});

// GET/PUT preferences
app.get('/api/preferences', async (req, res) => {
  const prefs = await findOne(Preferences, { userId: 'demo' }) ||
    { userId: 'demo', theme: 'light', defaultSort: 'last_name:asc', rowsPerPage: 10 };
  res.json(prefs);
});

app.put('/api/preferences', async (req, res) => {
  const { theme = 'light', defaultSort = 'last_name:asc', rowsPerPage = 10 } = req.body || {};
  await update(
    Preferences,
    { userId: 'demo' },
    { userId: 'demo', theme, defaultSort, rowsPerPage },
    { upsert: true }
  );
  const prefs = await findOne(Preferences, { userId: 'demo' });
  res.json(prefs);
});

// Notes per contact (optional)
app.get('/api/contacts/:id/notes', async (req, res) => {
  const contactId = Number(req.params.id);
  const notes = await find(Notes, { contactId, userId: 'demo' });
  res.json(notes);
});

app.post('/api/contacts/:id/notes', async (req, res) => {
  const contactId = Number(req.params.id);
  const { body } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({ error: 'Note body required' });
  const note = { contactId, userId: 'demo', body: String(body), createdAt: new Date() };
  const newNote = await insert(Notes, note);
  res.status(201).json(newNote);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\nAPI running on http://localhost:${PORT}`);
  console.log(`SQLite database: ./db/contacts.sqlite3`);
  console.log(`NeDB databases: ./db/preferences.db, ./db/notes.db`);
  console.log(`\nOpen your browser and go to: http://localhost:${PORT}\n`);
});
