/** Client API Bình Mỹ Connect */
(function (window) {
  const API = window.BINHMY_API || "/api";

  async function request(path, options) {
    const token = localStorage.getItem("bmc_token");
    const headers = Object.assign({ "Content-Type": "application/json" }, (options && options.headers) || {});
    if (token) headers.Authorization = "Bearer " + token;
    const res = await fetch(API + path, Object.assign({}, options, { headers }));
    const data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) throw new Error(data.message || "Lỗi API");
    return data;
  }

  function qs(params) {
    if (!params) return "";
    const sp = new URLSearchParams();
    Object.keys(params).forEach(function (k) {
      if (params[k] !== undefined && params[k] !== null && params[k] !== "") sp.set(k, params[k]);
    });
    const s = sp.toString();
    return s ? "?" + s : "";
  }

  window.BinhMyConnect = {
    request: request,
    home: function () {
      return request("/home");
    },
    search: function (q, type) {
      return request("/search" + qs({ q: q, type: type }));
    },
    products: function (params) {
      return request("/products" + qs(params));
    },
    product: function (id) {
      return request("/products/" + id);
    },
    farms: function (params) {
      return request("/farms" + qs(params));
    },
    farm: function (id) {
      return request("/farms/" + id);
    },
    tours: function (params) {
      return request("/tours" + qs(params));
    },
    tour: function (id) {
      return request("/tours/" + id);
    },
    vehicles: function () {
      return request("/vehicles");
    },
    news: function (params) {
      return request("/news" + qs(params));
    },
    newsItem: function (id) {
      return request("/news/" + id);
    },
    reviews: function (params) {
      return request("/reviews" + qs(params));
    },
    topFarms: function () {
      return request("/reviews/top/farms");
    },
    topProducts: function () {
      return request("/reviews/top/products");
    },
    cart: function () {
      return request("/cart");
    },
    addCart: function (productId, quantity) {
      return request("/cart", {
        method: "POST",
        body: JSON.stringify({ productId: productId, quantity: quantity || 1 }),
      });
    },
    updateCart: function (productId, quantity) {
      return request("/cart/" + productId, {
        method: "PUT",
        body: JSON.stringify({ quantity: quantity }),
      });
    },
    removeCart: function (productId) {
      return request("/cart/" + productId, { method: "DELETE" });
    },
    checkout: function (body) {
      return request("/cart/checkout", { method: "POST", body: JSON.stringify(body) });
    },
    login: function (email, password) {
      return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email, password: password }),
      }).then(function (data) {
        if (data.token) localStorage.setItem("bmc_token", data.token);
        if (data.user) localStorage.setItem("bmc_user", JSON.stringify(data.user));
        return data;
      });
    },
    register: function (body) {
      return request("/auth/register", { method: "POST", body: JSON.stringify(body) }).then(function (data) {
        if (data.token) localStorage.setItem("bmc_token", data.token);
        if (data.user) localStorage.setItem("bmc_user", JSON.stringify(data.user));
        return data;
      });
    },
    me: function () {
      return request("/auth/me");
    },
    logout: function () {
      localStorage.removeItem("bmc_token");
      localStorage.removeItem("bmc_user");
    },
    sendMessage: function (body) {
      return request("/messages", { method: "POST", body: JSON.stringify(body) });
    },
    token: function () {
      return localStorage.getItem("bmc_token");
    },
    user: function () {
      try {
        return JSON.parse(localStorage.getItem("bmc_user") || "null");
      } catch (e) {
        return null;
      }
    },
  };
})(window);
