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
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirm = document.getElementById('confirmPassword').value;

  if (password !== confirm) {
    document.getElementById('result').innerText = "Passwords do not match";
    return;
  }

  fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      // ✅ register เสร็จ → login อัตโนมัติ
      localStorage.setItem('token', data.token);

      document.getElementById('result').style.color = "green";
      document.getElementById('result').innerText = "Register success!";

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);

    } else {
      document.getElementById('result').innerText = data.message || "Register failed";
    }
  })
  .catch(() => {
    document.getElementById('result').innerText = "Server error";
  });
}


module.exports = { login, register };