const express = require('express');
const path = require('path');

const app = express();

const PORT = 3000;

const authRoutes =
  require('./routes/authRoutes');

const productRoutes =
  require('./routes/productRoutes');

const orderRoutes =
  require('./routes/orderRoutes');

app.use(express.json());

app.use('/api', authRoutes);

app.use('/api/products', productRoutes);

app.use('/api', orderRoutes);

app.use(
  express.static(
    path.join(__dirname, 'footwear-master')
  )
);

app.get('/', (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      'footwear-master',
      'index.html'
    )
  );
});

app.listen(PORT, () => {

  console.log(
    `Server running http://localhost:${PORT}`
  );
});