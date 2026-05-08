const products =
  require('../footwear-master/data/products.json');

function getProductsByCategory(req, res) {

  const { category } = req.query;

  if (!category) {

    return res.status(400).json({
      message: 'Category required'
    });
  }

  const filtered = products.filter(
    p =>
      p.category.toLowerCase() ===
      category.toLowerCase()
  );

  res.json(filtered);
}

module.exports = {
  getProductsByCategory
};