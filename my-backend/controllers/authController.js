const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
  addUser,
  findUserByEmail
} = require('../models/userModel');

const JWT_SECRET = 'secret123';

// LOGIN
async function login(req, res) {

  try {

    const { email, password } = req.body;

    if (!email || !password) {

      return res.status(400).json({
        message: 'Email and password required'
      });
    }

    const user =
      findUserByEmail(email);

    if (!user) {

      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {

      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      JWT_SECRET,
      {
        expiresIn: '1h'
      }
    );

    res.json({ token });

  } catch (err) {

    res.status(500).json({
      message: 'Server error'
    });
  }
}

// REGISTER
async function register(req, res) {

  try {

    const {
      email,
      password,
      firstName
    } = req.body;

    if (
      !email ||
      !password ||
      !firstName
    ) {

      return res.status(400).json({
        message: 'All fields required'
      });
    }

    const existingUser =
      findUserByEmail(email);

    if (existingUser) {

      return res.status(400).json({
        message: 'User already exists'
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now(),
      firstName,
      email,
      password: hashedPassword,
      registeredAt:
        new Date().toISOString()
    };

    addUser(newUser);

    res.json({
      message: 'User created',
      userId: newUser.id
    });

  } catch (err) {

    res.status(500).json({
      message: 'Server error'
    });
  }
}

module.exports = {
  login,
  register
};