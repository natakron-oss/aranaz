const express = require('express');

const router = express.Router();

const authMiddleware =
  require('../middleware/authMiddleware');

const {
  getProductsByCategory
} = require('../controllers/productController');

router.get(
  '/',
  authMiddleware,
  getProductsByCategory
);

module.exports = router;