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


app.post('/api/checkout', (req, res) => {
  try {
    const { items, email, creditCard } = req.body;

    // 1. check cart
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 2. email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    // 3. credit card 16 digit
    const cardRegex = /^\d{16}$/;
    if (!cardRegex.test(creditCard)) {
      return res.status(400).json({ message: "Invalid credit card" });
    }

    // 4. calculate total
    let total = items.reduce((sum, item) => {
      return sum + (item.price * item.qty);
    }, 0);

    // 🔥 simulate save order
    // throw new Error("DB error"); // ทดสอบ catch ได้

    res.json({
      success: true,
      total
    });

  } catch (err) {
    res.status(400).json({
      message: "Checkout failed: " + err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running http://localhost:${PORT}`);
});