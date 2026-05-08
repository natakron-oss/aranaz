function validateCheckout(
  items,
  email,
  creditCard
) {

  if (!items || items.length === 0) {
    throw new Error('Cart is empty');
  }

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error('Invalid email');
  }

  const cardRegex = /^\d{16}$/;

  if (!cardRegex.test(creditCard)) {
    throw new Error('Invalid credit card');
  }
}

function calculateTotal(items) {

  return items.reduce((sum, item) => {
    return sum + item.price * item.qty;
  }, 0);
}

module.exports = {
  validateCheckout,
  calculateTotal
};