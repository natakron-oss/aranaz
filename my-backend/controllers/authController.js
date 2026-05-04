const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUsers, addUser } = require('../models/userModel');

const JWT_SECRET = 'secret123';

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Unauthorized' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function register(req, res) {
  try {
    const { email, password, firstName } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const users = getUsers();
    if (users.find(u => u.email === email)) return res.status(409).json({ message: 'User exists' });

    const hashed = await bcrypt.hash(password, 10);
    const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const user = { id, email, password: hashed, firstName: firstName || '', registeredAt: new Date().toISOString().slice(0,10) };

    addUser(user);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { login, register };