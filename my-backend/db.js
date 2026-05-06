const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./store.db', (err) => {
  if (err) console.error(err.message);
  else console.log('Connected to SQLite');
});

module.exports = db;
