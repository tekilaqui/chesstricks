const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_NAME = process.env.NODE_ENV === 'test' ? 'test-database.sqlite' : 'database.sqlite';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../', DB_NAME);

const db = new sqlite3.Database(DB_PATH);

module.exports = { db };
