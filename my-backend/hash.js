const bcrypt = require('bcrypt');

async function hashPassword(plainPassword) {
  const saltRounds = 10;
  const hashed = await bcrypt.hash(plainPassword, saltRounds);
  console.log(hashed);
}

hashPassword("password"); // ลองใส่รหัสที่ต้องการ