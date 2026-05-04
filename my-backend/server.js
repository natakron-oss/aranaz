const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

const products = require('./footwear-master/data/products.json');

// ✅ API
app.get('/api/products', (req, res) => {
  const { category } = req.query;

  // 🛡️ Gatekeeper
  if (!category) {
    return res.status(400).json({
      status: "error",
      message: "Category is required"
    });
  }

  // filter จาก category
  const filtered = products.filter(
    p => p.category === category.toLowerCase()
  );

  res.json({
    status: "success",
    data: filtered
  });
});

// static web
app.use(express.static(path.join(__dirname, 'footwear-master')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'footwear-master', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});