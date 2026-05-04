const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../footwear-master/data/user.json');

function getUsers() {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data || '[]');
}

function saveUsers(users) {
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf8');
}

function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
  return user;
}

module.exports = { getUsers, saveUsers, addUser };