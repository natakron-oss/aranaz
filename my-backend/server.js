const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken'); // 🔥 ย้ายขึ้นมาไว้ข้างบน

const app = express();
const PORT = 3000;

const authRoutes = require('./routes/authRoutes');
const products = require('./footwear-master/data/products.json');

app.use(express.json());

// 🔐 middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, 'secret123');
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// 🔐 login route
app.use('/api', authRoutes);

// 🛍️ products API (🔒 ใส่ middleware)
app.get('/api/products', authMiddleware, (req, res) => {
  const { category } = req.query;

  if (!category) {
    return res.status(400).json({ message: 'Category required' });
  }

  const filtered = products.filter(
    p => p.category.toLowerCase() === category.toLowerCase()
  );

  res.json(filtered);
});

// 🌐 frontend
app.use(express.static(path.join(__dirname, 'footwear-master')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'footwear-master', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running http://localhost:${PORT}`);
});

