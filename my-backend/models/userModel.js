const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '../footwear-master/data/user.json'
);

function getUsers() {

  if (!fs.existsSync(filePath)) {
    return [];
  }

  const data = fs.readFileSync(
    filePath,
    'utf8'
  );

  return JSON.parse(data || '[]');
}

function saveUsers(users) {

  fs.writeFileSync(
    filePath,
    JSON.stringify(users, null, 2),
    'utf8'
  );
}

function addUser(user) {

  const users = getUsers();

  users.push(user);

  saveUsers(users);

  return user;
}

function findUserByEmail(email) {

  const users = getUsers();

  return users.find(
    user =>
      user.email.toLowerCase() ===
      email.toLowerCase()
  );
}

function findUserById(id) {

  const users = getUsers();

  return users.find(
    user => user.id === id
  );
}

module.exports = {
  getUsers,
  saveUsers,
  addUser,
  findUserByEmail,
  findUserById
};