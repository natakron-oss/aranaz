const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUsers, addUser } = require('../models/userModel');

const JWT_SECRET = 'secret123';

// LOGIN
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    db.get(
      `SELECT * FROM users WHERE email = ?`,
      [email],
      async (err, user) => {

        if (err)
          return res.status(500).json({ message: 'DB error' });

        if (!user)
          return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch)
          return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
          { id: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        res.json({ token });
      }
    );

  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}
// REGISTER
async function register(req, res) {
  try {
    const { email, password, firstName } = req.body;

    if (!email || !password || !firstName)
      return res.status(400).json({ message: 'All fields required' });

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (firstName, email, password, registeredAt)
       VALUES (?, ?, ?, ?)`,
      [firstName, email, hashedPassword, new Date().toISOString()],
      function (err) {

        if (err) {
          return res.status(400).json({ message: 'User already exists' });
        }

        res.json({
          message: 'User created',
          userId: this.lastID
        });
      }
    );

  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { login, register };