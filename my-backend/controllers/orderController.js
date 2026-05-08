const {
  validateCheckout,
  calculateTotal
} = require('../services/orderService');

function checkout(req, res) {

  try {

    const {
      items,
      email,
      creditCard
    } = req.body;

    validateCheckout(
      items,
      email,
      creditCard
    );

    const total =
      calculateTotal(items);

    res.json({
      success: true,
      total
    });

  } catch (err) {

    res.status(400).json({
      message:
        'Checkout failed: ' +
        err.message
    });
  }
}

module.exports = {
  checkout
};