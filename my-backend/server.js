const express = require('express');
const path = require('path');

const app = express();

// ให้ใช้โฟลเดอร์ footwear-master เป็นเว็บหลัก
app.use(express.static(path.join(__dirname, 'footwear-master')));

// เปิดหน้า index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'footwear-master', 'index.html'));
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});