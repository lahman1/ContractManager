const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Create db directory if it doesn't exist
const dbDir = path.join(__dirname, '..', 'db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
    console.log('Created db directory');
}

// Database file path
const dbPath = path.join(dbDir, 'contacts.sqlite3');

// Remove existing database if it exists
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Removed existing database');
}

// Create new database
const db = new Database(dbPath);
console.log('Created new database');

// Read and execute schema
const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);
console.log('Applied schema');

// Read and execute seed data
const seedPath = path.join(__dirname, '..', 'sql', 'seed.sql');
const seed = fs.readFileSync(seedPath, 'utf8');
db.exec(seed);
console.log('Inserted seed data');

// Close database
db.close();

console.log('\nDatabase initialization complete!');
console.log('You can now run: npm start');
