const db = require('./db');

db.serialize(() => {

  // USERS
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      email TEXT UNIQUE,
      password TEXT,
      registeredAt TEXT
    )
  `);

  // PRODUCTS
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT,
      price REAL,
      category TEXT,
      image TEXT
    )
  `);

  // ORDERS
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      total_price REAL,
      date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // ORDER ITEMS
  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      price REAL,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);

});