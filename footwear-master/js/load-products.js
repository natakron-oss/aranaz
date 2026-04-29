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
      col.innerHTML =
        '<div class="product-entry border">' +
          '<a href="' + (p.url || '#') + '" class="prod-img">' +
            '<img src="' + (p.image || '') + '" class="img-fluid" alt="' + escapeHtml(p.name) + '">' +
          '</a>' +
          '<div class="desc">' +
            '<h2><a href="' + (p.url || '#') + '">' + escapeHtml(p.name) + '</a></h2>' +
            '<span class="price">' + (p.price_display || ('$' + (Number(p.price) || 0).toFixed(2))) + '</span>' +
          '</div>' +
        '</div>';
      row.appendChild(col);
    });

    container.appendChild(row);
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
    var retryStatuses = [502, 503, 504]; // transient server errors worth retrying

    function attempt(remaining) {
      return fetch(path).then(function (res) {
        if (!res.ok) {
          var err = new Error('HTTP error: ' + res.status);
          err.status = res.status;
          // Retry for transient statuses if we have attempts left
          if (retryStatuses.indexOf(res.status) !== -1 && remaining > 0) {
            return delay(retryDelay).then(function () { return attempt(remaining - 1); });
          }
          throw err;
        }
        return res.json();
      }).catch(function (err) {
        // Network error (TypeError) or other issues — retry if attempts remain
        var isNetworkError = err instanceof TypeError || err.name === 'TypeError';
        if (isNetworkError && remaining > 0) {
          return delay(retryDelay).then(function () { return attempt(remaining - 1); });
        }
        throw err;
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
    path = path || 'data/products.json';
    containerSelector = containerSelector || '#product-container';

    // Accept optional options param by reading arguments[2]
    var options = arguments[2] || { retries: 2, retryDelay: 600 };

    // Call fetchJson with retry options; callers may override by passing options.
    return fetchJson(path, options).then(function (data) {
      var items = Array.isArray(data) ? data : (data.products || []);
      renderUI(items, containerSelector);
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
      '<label style="margin-right:8px">Retries: <input id="product-retries" type="number" min="0" value="2" style="width:64px"></label>' +
      '<label style="margin-right:8px">Delay (ms): <input id="product-retryDelay" type="number" min="0" value="600" style="width:80px"></label>' +
      '<button id="product-reload">Reload Products</button>';

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
  }

  // Expose the functions for use elsewhere and for testing in the console
  window.requestProducts = requestProducts;
  window.renderUI = renderUI;
  window.setupProductControls = renderControls;

  // Convenience: auto-run on DOMContentLoaded — insert controls and load products
  document.addEventListener('DOMContentLoaded', function () {
    try { renderControls('#product-container', 'data/products.json'); } catch (e) {}
    requestProducts().catch(function () {});
  });
})();
