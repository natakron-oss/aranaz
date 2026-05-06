(function () {
  /*
   * load-products.js
   * Sequence: requestProducts() -> fetch(path-to-json-file) -> renderUI()
   * Exposes: window.requestProducts(path, selector) and window.renderUI(products, selector)
   * Purpose: fetch a JSON file containing an array of products and render them
   * into a Bootstrap-style grid inside the element matching `selector`.
   */

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

  /**
   * renderUI
   * - Responsible only for DOM rendering.
   * - Receives a list of product objects and a container selector.
   * - Renders markup that mirrors the existing `product-entry` HTML block used
   *   across the site so styling remains consistent.
   * Data flow: products (array) ---> renderUI ---> DOM
   */
  function renderUI(products, containerSelector) {
    var container = document.querySelector(containerSelector);
    if (!container) {
      console.error('Product container not found:', containerSelector);
      return;
    }
    // Clear existing content and create a single row wrapper
    container.innerHTML = '';
    var row = document.createElement('div');
    row.className = 'row row-pb-md';

    products.forEach(function (p) {
      var col = document.createElement('div');
      col.className = 'col-lg-3 mb-4 text-center';
      
      // คำนวณราคาเพื่อใช้ใน data-price
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
            // เพิ่มส่วนของปุ่ม Add to Cart ด้านล่างนี้
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

  // In-memory cache of last-loaded products for client-side filtering
  var allProducts = [];

  function normalizeText(str) {
    return (str || '').toString().toLowerCase();
  }

  // Simple filter: matches query tokens against name and category
  function filterProducts(products, query) {
    if (!query) return products.slice();
    var q = normalizeText(query).split(/\s+/).filter(Boolean);
    if (q.length === 0) return products.slice();
    return products.filter(function (p) {
      var hay = normalizeText([p.name, p.category, p.price_display].join(' '));
      return q.every(function (token) { return hay.indexOf(token) !== -1; });
    });
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
  }
  /**
   * fetchJson
   * - Thin wrapper around the native fetch to clarify the sequence diagram.
   * - Accepts a path to a JSON file and returns a promise that resolves to parsed JSON.
   * Data flow: requestProducts -> fetchJson(path) -> parsed JSON
   */
  // delay helper for retry backoff
  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  /**
   * fetchJson
   * - Wrapper around `fetch` that adds:
   *   - HTTP status handling (attaches `status` to thrown Error)
   *   - Retry/backoff for transient failures (network errors and 5xx gateway statuses)
   * - Returns a Promise resolving to parsed JSON.
   * Options:
   *   { retries: number, retryDelay: ms }
   */
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
        throw new Error("Unauthorized"); // 🔥 สำคัญ
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

  /**
   * requestProducts
   * - Top-level function matching your sequence diagram.
   * - Orchestrates the request: calls fetchJson(path) then renderUI(products).
   * - Returns a promise that resolves to the product array (for further chaining).
   * Sequence details:
   *  1) UI or app calls requestProducts(path, selector)
   *  2) requestProducts calls fetchJson(path) (this performs the network request)
   *  3) fetchJson resolves to parsed JSON (array expected)
   *  4) requestProducts calls renderUI(parsedArray, selector) to update DOM
   */
  function requestProducts(path, containerSelector) {
    path = path || '/api/products?category=men';
    containerSelector = containerSelector || '#product-container';

    // Accept optional options param by reading arguments[2]
    var options = arguments[2] || { retries: 2, retryDelay: 600 };

    // Call fetchJson with retry options; callers may override by passing options.
    return fetchJson(path, options).then(function (data) {
      // รองรับ API backend + JSON เดิม
        var items = [];

        if (data && data.data) {
          // มาจาก backend API
          items = data.data;
        } else if (Array.isArray(data)) {
          // JSON แบบเดิม
          items = data;
        } else if (data.products) {
          items = data.products;
        }
      // cache for client-side search/filter
      allProducts = items.slice();
      renderUI(items, containerSelector);
      // if controls exist, populate dynamic filter options
      try {
        var controls = document.getElementById('product-controls');
        if (controls && typeof controls.populateFilterCategories === 'function') {
          controls.populateFilterCategories(allProducts);
        }
      } catch (e) {}
      return items;
    }).catch(function (err) {
      // Provide HTTP-status-specific feedback in the UI where possible
      console.error('Failed to load products:', err);
      var container = document.querySelector(containerSelector);
      if (container) {
        var message = 'Failed to load products. Please try again later.';
        if (err && err.status) {
          if (err.status === 401) message = 'Unauthorized — please sign in to view products.';
          else if (err.status === 404) message = 'Products not found (404).';
          else if (err.status >= 500 && err.status < 600) message = 'Server error — please try again later.';
          else message = 'Error loading products (HTTP ' + err.status + ').';
        } else if (err instanceof TypeError || err.name === 'TypeError') {
          message = 'Network error — check your connection and try again.';
        }
        container.innerHTML = '<p class="text-danger">' + message + '</p>';
      }
      throw err;
    });
  }

  /**
   * renderControls
   * - Inserts a small UI above the product container to configure retry options
   *   (`retries` and `retryDelay`) and to manually reload products.
   * - If an element with id `product-controls` exists, it will be reused.
   */
  function renderControls(containerSelector, path) {
    containerSelector = containerSelector || '#product-container';
    path = path || 'data/products.json';

    var container = document.querySelector(containerSelector);
    if (!container) return;

    var controlsId = 'product-controls';
    var controls = document.getElementById(controlsId);
    if (!controls) {
      controls = document.createElement('div');
      controls.id = controlsId;
      controls.style.margin = '0 0 1em 0';
      // Insert controls before the product container
      container.parentNode.insertBefore(controls, container);
    }

    controls.innerHTML = '' +
      '<div style="margin-bottom:8px">' +
        '<label style="margin-right:8px">Retries: <input id="product-retries" type="number" min="0" value="2" style="width:64px"></label>' +
        '<label style="margin-right:8px">Delay (ms): <input id="product-retryDelay" type="number" min="0" value="600" style="width:80px"></label>' +
        '<button id="product-reload">Reload Products</button>' +
      '</div>' +
      '<div id="product-filters" style="margin-bottom:8px">' +
        '<strong>Filters:</strong> ' +
        '<span id="filter-categories"></span> ' +
        '<label style="margin-left:8px">Price: <input id="filter-min-price" type="number" min="0" placeholder="Min" style="width:80px"> - <input id="filter-max-price" type="number" min="0" placeholder="Max" style="width:80px"></label>' +
        '<label style="margin-left:8px">Sort: <select id="filter-sort"><option value="">Default</option><option value="price_asc">Price ↑</option><option value="price_desc">Price ↓</option><option value="name_asc">Name A→Z</option><option value="name_desc">Name Z→A</option></select></label>' +
      '</div>';

    var btn = document.getElementById('product-reload');
    var inputRetries = document.getElementById('product-retries');
    var inputDelay = document.getElementById('product-retryDelay');

    btn.addEventListener('click', function () {
      var retries = parseInt(inputRetries.value, 10);
      var retryDelay = parseInt(inputDelay.value, 10);
      if (isNaN(retries) || retries < 0) retries = 0;
      if (isNaN(retryDelay) || retryDelay < 0) retryDelay = 0;
      // Call requestProducts with options read from the UI
      requestProducts(path, containerSelector, { retries: retries, retryDelay: retryDelay }).catch(function () {});
    });

    // wire filter inputs (they'll work once products are loaded)
    var catsHolder = document.getElementById('filter-categories');
    var minPrice = document.getElementById('filter-min-price');
    var maxPrice = document.getElementById('filter-max-price');
    var sortSel = document.getElementById('filter-sort');

    function applyFilters() {
      // If products not loaded yet, load then apply
      var items = allProducts && allProducts.length ? allProducts.slice() : [];
      if (!items.length) {
        requestProducts(path, containerSelector).then(function (it) { items = it || []; doApply(items); }).catch(function () { doApply([]); });
      } else {
        doApply(items);
      }
    }

    function doApply(items) {
      // categories
      var checked = [];
      if (catsHolder) {
        var inputs = catsHolder.querySelectorAll('input[type="checkbox"]');
        inputs.forEach(function (cb) { if (cb.checked) checked.push(cb.value); });
      }

      var filtered = items.filter(function (p) {
        if (checked.length && checked.indexOf(p.category) === -1) return false;
        var min = parseFloat(minPrice && minPrice.value) || 0;
        var max = parseFloat(maxPrice && maxPrice.value) || Number.POSITIVE_INFINITY;
        var price = Number(p.price) || 0;
        if (price < min) return false;
        if (price > max) return false;
        return true;
      });

      // sort
      var sort = sortSel && sortSel.value;
      if (sort === 'price_asc') filtered.sort(function (a,b){return (Number(a.price)||0)-(Number(b.price)||0);});
      else if (sort === 'price_desc') filtered.sort(function (a,b){return (Number(b.price)||0)-(Number(a.price)||0);});
      else if (sort === 'name_asc') filtered.sort(function (a,b){return (a.name||'').localeCompare(b.name||'');});
      else if (sort === 'name_desc') filtered.sort(function (a,b){return (b.name||'').localeCompare(a.name||'');});

      renderUI(filtered, containerSelector);
    }

    var debouncedApply = debounce(applyFilters, 200);
    if (minPrice) minPrice.addEventListener('input', debouncedApply);
    if (maxPrice) maxPrice.addEventListener('input', debouncedApply);
    if (sortSel) sortSel.addEventListener('change', applyFilters);

    // expose a helper to populate categories once products are loaded
    controls.populateFilterCategories = function (items) {
      if (!catsHolder) return;
      var cats = {};
      (items||[]).forEach(function (p) { if (p && p.category) cats[p.category]=true; });
      var html = '';
      Object.keys(cats).sort().forEach(function (c) {
        html += '<label style="margin-right:6px"><input type="checkbox" value="' + c + '"> ' + c + '</label>';
      });
      catsHolder.innerHTML = html;
      // wire checkbox change
      var boxes = catsHolder.querySelectorAll('input[type="checkbox"]');
      boxes.forEach(function (b) { b.addEventListener('change', debouncedApply); });
    };
  }

  // Expose the functions for use elsewhere and for testing in the console
  window.requestProducts = requestProducts;
  window.renderUI = renderUI;
  window.setupProductControls = renderControls;
  // Expose client-side search helpers
  window.filterProducts = filterProducts;

  // Setup a client-side search box that filters the currently-loaded products.
  // If products are not yet loaded, it will trigger a load and then attach.
  window.setupClientSearch = function (inputSelector, containerSelector, options) {
    options = options || {};
    var wait = typeof options.debounceMs === 'number' ? options.debounceMs : 250;
    var input = document.querySelector(inputSelector);
    var container = containerSelector || '#product-container';
    if (!input) return;

    function ensureProducts(callback) {
      if (allProducts && allProducts.length) return callback(allProducts.slice());
      requestProducts('data/products.json', container).then(function (items) { callback(items); }).catch(function () { callback([]); });
    }

    var onInput = debounce(function () {
      var q = input.value || '';
      ensureProducts(function (items) {
        var results = filterProducts(items, q);
        renderUI(results, container);
      });
    }, wait);

    input.addEventListener('input', onInput);
  };

  // Convenience: auto-run on DOMContentLoaded — insert controls and load products
  document.addEventListener('DOMContentLoaded', function () {
    try { renderControls('#product-container', '/api/products?category=men'); } catch (e) {}
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
function loadCategory(category) {
  const token = localStorage.getItem('token');

  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  fetch(`/api/products?category=${category}`, {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(res => {
    if (res.status === 401) {
      alert("Session expired, login again");
      localStorage.removeItem('token');
      window.location.href = "login.html";
      return;
    }
    return res.json();
  })
  .then(data => {
    const container = document.getElementById('product-container');
    container.innerHTML = '';

    data.forEach(p => {
      container.innerHTML += `
        <div>
          <h3>${p.name}</h3>
          <p>${p.price}</p>
        </div>
      `;
    });
  });
}
})();
