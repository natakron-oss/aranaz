(function () {

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (s) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[s];
    });
  }

  function renderUI(products, containerSelector) {
    var container = document.querySelector(containerSelector);
    if (!container) {
      console.error('Product container not found:', containerSelector);
      return;
    }

    container.innerHTML = '';
    var row = document.createElement('div');
    row.className = 'row row-pb-md';

    products.forEach(function (p) {
      var col = document.createElement('div');
      col.className = 'col-lg-3 mb-4 text-center';
      
      var priceValue = Number(p.price) || 0;
      var priceDisplay = p.price_display || ('$' + priceValue.toFixed(2));

      col.innerHTML =
        '<div class="product-entry border">' +
          '<a href="' + (p.url || '#') + '" class="prod-img">' +
            '<img src="' + (p.image || '') + '" class="img-fluid" alt="' + escapeHtml(p.name) + '">' +
          '</a>' +
          '<div class="desc">' +
            '<h2><a href="' + (p.url || '#') + '">' + escapeHtml(p.name) + '</a></h2>' +
            '<span class="price">' + priceDisplay + '</span>' +
            '<div class="add-to-cart-wrapper mt-2">' +
              '<button class="btn btn-primary add-to-cart" ' +
                'data-id="' + (p.id || '') + '" ' +
                'data-price="' + priceValue + '">' +
                '<i class="icon-shopping-cart"></i> Add to Cart' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      row.appendChild(col);
    });
    
    container.appendChild(row);
  }

  var allProducts = [];

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function fetchJson(path, options) {
    options = options || {};
    var retries = typeof options.retries === 'number' ? options.retries : 2;
    var retryDelay = typeof options.retryDelay === 'number' ? options.retryDelay : 500;
    var retryStatuses = [502, 503, 504];

    const token = localStorage.getItem('token');

    if (!token) {
      alert("Please login first");
      window.location.href = "login.html";
      return Promise.reject("No token");
    }

    function attempt(remaining) {
      return fetch(path, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      }).then(function (res) {

        if (res.status === 401) {
          alert("Session expired. Please login again.");
          window.location.href = "login.html";
          throw new Error("Unauthorized");
        }

        if (!res.ok) {
          var err = new Error('HTTP error: ' + res.status);
          err.status = res.status;

          if (retryStatuses.includes(res.status) && remaining > 0) {
            return delay(retryDelay).then(function () {
              return attempt(remaining - 1);
            });
          }
          throw err;
        }

        return res.json();
      });
    }

    return attempt(retries);
  }

  function requestProducts(path, containerSelector) {
    path = path || '/api/products?category=men';
    containerSelector = containerSelector || '#product-container';

    var options = arguments[2] || { retries: 2, retryDelay: 600 };

    return fetchJson(path, options).then(function (data) {
      var items = [];

      if (data && data.data) {
        items = data.data;
      } else if (Array.isArray(data)) {
        items = data;
      } else if (data.products) {
        items = data.products;
      }

      allProducts = items.slice();
      renderUI(items, containerSelector);
      return items;
    }).catch(function (err) {
      console.error('Failed to load products:', err);
      var container = document.querySelector(containerSelector);
      if (container) {
        container.innerHTML = '<p class="text-danger">Failed to load products</p>';
      }
      throw err;
    });
  }

  window.requestProducts = requestProducts;
  window.renderUI = renderUI;

  document.addEventListener('DOMContentLoaded', function () {
    requestProducts('/api/products?category=men').catch(function () {});
  });

  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.add-to-cart');
    if (!btn) return;

    var id = btn.dataset.id;
    var price = Number(btn.dataset.price);
    var name = btn.closest('.desc').querySelector('h2').innerText;
    var image = btn.closest('.product-entry').querySelector('img').src;

    var cart = JSON.parse(localStorage.getItem('cart')) || [];

    var existing = cart.find(function(item) {
      return item.id === id;
    });

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: id,
        name: name,
        price: price,
        image: image,
        qty: 1
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart!');
  });

})();