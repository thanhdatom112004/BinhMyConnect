(function () {
  const API = window.BinhMyConnect;
  if (!API) return;

  const CAT = { rau: "Rau", trai_cay: "Trái cây", dac_san: "Đặc sản" };
  const NEWS_CAT = { nong_nghiep: "Nông nghiệp", du_lich: "Du lịch", su_kien: "Sự kiện" };
  const ROLE = {
    customer: "Khách hàng",
    farmer: "Nông dân",
    business: "Doanh nghiệp",
    admin: "Admin",
  };

  function pageName() {
    const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    return file || "index.html";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function money(n) {
    return Number(n || 0).toLocaleString("vi-VN") + " đ";
  }

  function img(p) {
    if (!p) return "img/fruite-item-1.jpg";
    return p;
  }

  function stars(n) {
    const r = Math.round(Number(n) || 0);
    let html = "";
    for (let i = 1; i <= 5; i++) {
      html +=
        '<i class="fa fa-star ' + (i <= r ? "text-secondary" : "") + '"></i>';
    }
    return html;
  }

  function farmName(p) {
    if (!p) return "";
    if (p.farm && p.farm.name) return p.farm.name;
    if (p.farmer && p.farmer.farmerProfile) return p.farmer.farmerProfile.householdName || "";
    return "";
  }

  function authorName(u) {
    if (!u) return "Khách";
    return (
      (u.customerProfile && u.customerProfile.fullName) ||
      (u.farmerProfile && u.farmerProfile.householdName) ||
      (u.businessProfile && u.businessProfile.companyName) ||
      "Người dùng"
    );
  }

  function productCard(p, col) {
    const cat = CAT[p.category] || p.category;
    const src = img((p.images && p.images[0]) || "");
    return (
      '<div class="' +
      (col || "col-md-6 col-lg-6 col-xl-4") +
      '">' +
      '<div class="rounded position-relative fruite-item h-100">' +
      '<div class="fruite-img"><a href="shop-detail.html?id=' +
      p._id +
      '"><img src="' +
      esc(src) +
      '" class="img-fluid w-100 rounded-top" alt="" style="height:220px;object-fit:cover"></a></div>' +
      '<div class="text-white bg-secondary px-3 py-1 rounded position-absolute" style="top: 10px; left: 10px;">' +
      esc(cat) +
      "</div>" +
      '<div class="p-4 border border-secondary border-top-0 rounded-bottom">' +
      ' <h4><a class="text-dark" href="shop-detail.html?id=' +
      p._id +
      '">' +
      esc(p.name) +
      "</a></h4>" +
      "<p>" +
      esc((p.description || "").slice(0, 80)) +
      (p.description && p.description.length > 80 ? "…" : "") +
      "</p>" +
      '<p class="text-muted small mb-2">' +
      esc(farmName(p)) +
      " · " +
      stars(p.avgRating) +
      " (" +
      (p.reviewCount || 0) +
      ")</p>" +
      '<div class="d-flex justify-content-between flex-lg-wrap align-items-center">' +
      '<p class="text-dark fs-5 fw-bold mb-0">' +
      money(p.price) +
      " / " +
      esc(p.unit) +
      "</p>" +
      '<button type="button" class="btn border border-secondary rounded-pill px-3 text-primary bmc-add" data-id="' +
      p._id +
      '"><i class="fa fa-shopping-bag me-2 text-primary"></i>Thêm giỏ</button>' +
      "</div></div></div></div>"
    );
  }

  function farmCard(f, col) {
    const tags = (f.tags || []).slice(0, 3).join(" · ");
    return (
      '<div class="' +
      (col || "col-md-6 col-lg-4") +
      '">' +
      '<div class="rounded position-relative fruite-item h-100">' +
      '<div class="fruite-img"><a href="farm-detail.html?id=' +
      f._id +
      '"><img src="' +
      esc(img(f.coverImage)) +
      '" class="img-fluid w-100 rounded-top" alt="" style="height:220px;object-fit:cover"></a></div>' +
      '<div class="text-white bg-primary px-3 py-1 rounded position-absolute" style="top: 10px; left: 10px;">' +
      esc(f.hamlet || "") +
      "</div>" +
      '<div class="p-4 border border-secondary border-top-0 rounded-bottom">' +
      "<h4>" +
      esc(f.name) +
      "</h4>" +
      "<p>" +
      esc((f.intro || "").slice(0, 90)) +
      "…</p>" +
      '<p class="small mb-2">' +
      stars(f.avgRating) +
      " " +
      (f.avgRating || 0) +
      " · " +
      esc(tags) +
      "</p>" +
      '<a href="farm-detail.html?id=' +
      f._id +
      '" class="btn border border-secondary rounded-pill px-3 text-primary">Xem nông trại</a>' +
      "</div></div></div>"
    );
  }

  async function addToCart(id, qty) {
    if (!API.token()) {
      alert("Đăng nhập tài khoản khách để mua hàng. Ví dụ: an.nguyen@gmail.com / 123456");
      location.href = "login.html";
      return;
    }
    try {
      await API.addCart(id, qty || 1);
      await refreshCartBadge();
      alert("Đã thêm vào giỏ");
    } catch (e) {
      alert(e.message);
    }
  }

  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".bmc-add");
    if (!btn) return;
    e.preventDefault();
    addToCart(btn.getAttribute("data-id"), 1);
  });

  async function refreshCartBadge() {
    const badge = document.querySelector(".fa-shopping-bag") && document.querySelector(".fa-shopping-bag").parentElement.querySelector("span");
    if (!badge) return;
    if (!API.token()) {
      badge.textContent = "0";
      return;
    }
    try {
      const res = await API.cart();
      const n = (res.data || []).reduce(function (s, i) {
        return s + (i.quantity || 0);
      }, 0);
      badge.textContent = String(n);
    } catch (e) {
      badge.textContent = "0";
    }
  }

  function applyChrome() {
    document.title = document.title.replace("Fruitables - Vegetable Website Template", "Bình Mỹ Connect");
    if (document.title.indexOf("Bình Mỹ") < 0 && document.title.indexOf("Fruitables") >= 0) {
      document.title = "Bình Mỹ Connect";
    }
    const brand = document.querySelector(".navbar-brand h1");
    if (brand) brand.textContent = "Bình Mỹ Connect";
    const loc = document.querySelector(".top-info a");
    if (loc) loc.textContent = "Xã Bình Mỹ, Củ Chi, TP.HCM";
    const mail = document.querySelectorAll(".top-info a")[1];
    if (mail) mail.textContent = "hello@binhmyconnect.vn";
    const topLinks = document.querySelector(".top-link");
    if (topLinks) {
      topLinks.innerHTML =
        '<a href="login.html" class="text-white"><small class="text-white mx-2">Đăng nhập</small>/</a>' +
        '<a href="login.html?tab=register" class="text-white"><small class="text-white mx-2">Đăng ký</small></a>';
    }
    const nav = document.querySelector(".navbar-nav");
    const file = pageName();
    function active(name) {
      return file === name ? " active" : "";
    }
    if (nav) {
      nav.innerHTML =
        '<a href="index.html" class="nav-item nav-link' +
        active("index.html") +
        '">Trang chủ</a>' +
        '<a href="shop.html" class="nav-item nav-link' +
        active("shop.html") +
        active("shop-detail.html") +
        '">Nông sản</a>' +
        '<a href="farms.html" class="nav-item nav-link' +
        active("farms.html") +
        active("farm-detail.html") +
        '">Nông trại</a>' +
        '<a href="tours.html" class="nav-item nav-link' +
        active("tours.html") +
        '">Tour &amp; xe</a>' +
        '<a href="news.html" class="nav-item nav-link' +
        active("news.html") +
        '">Tin tức</a>' +
        '<div class="nav-item dropdown">' +
        '<a href="#" class="nav-link dropdown-toggle' +
        (file === "cart.html" || file === "chackout.html" || file === "testimonial.html" ? " active" : "") +
        '" data-bs-toggle="dropdown">Tài khoản</a>' +
        '<div class="dropdown-menu m-0 bg-secondary rounded-0">' +
        '<a href="cart.html" class="dropdown-item">Giỏ hàng</a>' +
        '<a href="chackout.html" class="dropdown-item">Thanh toán</a>' +
        '<a href="testimonial.html" class="dropdown-item">Đánh giá</a>' +
        '<a href="login.html" class="dropdown-item">Đăng nhập</a>' +
        "</div></div>" +
        '<a href="contact.html" class="nav-item nav-link' +
        active("contact.html") +
        '">Liên hệ</a>';
    }
    const bag = document.querySelector(".fa-shopping-bag");
    if (bag && bag.parentElement && bag.parentElement.tagName === "A") {
      bag.parentElement.setAttribute("href", "cart.html");
    }
    const userIcon = document.querySelector(".fa-user");
    if (userIcon && userIcon.parentElement) {
      const u = API.user();
      userIcon.parentElement.setAttribute("href", "login.html");
      if (u) userIcon.parentElement.title = authorName(u);
    }
    document.querySelectorAll(".footer h1, .footer-item").forEach(function () {});
    const footBrand = document.querySelector(".footer h1");
    if (footBrand) {
      footBrand.textContent = "Bình Mỹ Connect";
      const sub = footBrand.nextElementSibling;
      if (sub) sub.textContent = "Nông sản & trải nghiệm Bình Mỹ";
    }
    const why = document.querySelector(".footer-item p.mb-4");
    if (why) why.textContent = "Kết nối nông dân xã Bình Mỹ với khách hàng nội thành và doanh nghiệp tour, xe, dịch vụ nông nghiệp trải nghiệm.";
    const contactCol = document.querySelectorAll(".footer-item")[3];
    if (contactCol) {
      contactCol.innerHTML =
        '<h4 class="text-light mb-3">Liên hệ</h4>' +
        "<p>Xã Bình Mỹ, Củ Chi, TP.HCM</p>" +
        "<p>Email: hello@binhmyconnect.vn</p>" +
        "<p>Điện thoại: 0900 000 001</p>";
    }
    const copy = document.querySelector(".copyright .text-light");
    if (copy) copy.innerHTML = '<span class="text-light">Bình Mỹ Connect — đồ án kết nối nông sản &amp; trải nghiệm</span>';

    const searchTitle = document.querySelector("#searchModal .modal-title");
    if (searchTitle) searchTitle.textContent = "Tìm nông sản, nông trại, tour";
    const searchInput = document.querySelector("#searchModal input[type=search]");
    if (searchInput) {
      searchInput.setAttribute("placeholder", "Nhập từ khóa…");
      searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          location.href = "shop.html?q=" + encodeURIComponent(searchInput.value);
        }
      });
    }
  }

  async function fillHome() {
    const res = await API.home();
    const d = res.data || {};
    const brand = d.brand || {};
    const heroH4 = document.querySelector(".hero-header h4");
    const heroH1 = document.querySelector(".hero-header h1");
    if (heroH4) heroH4.textContent = brand.location || "Xã Bình Mỹ, Củ Chi, TP.HCM";
    if (heroH1) heroH1.textContent = brand.name || "Bình Mỹ Connect";
    const heroSearch = document.querySelector(".hero-header input");
    if (heroSearch) {
      heroSearch.type = "search";
      heroSearch.placeholder = "Tìm nông sản, nông trại, tour";
      const btn = heroSearch.parentElement.querySelector("button");
      if (btn) {
        btn.textContent = "Tìm";
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          location.href = "shop.html?q=" + encodeURIComponent(heroSearch.value);
        });
      }
    }
    const labels = document.querySelectorAll(".carousel-item a.btn");
    if (labels[0]) {
      labels[0].textContent = "Nông sản";
      labels[0].href = "shop.html";
    }
    if (labels[1]) {
      labels[1].textContent = "Nông trại";
      labels[1].href = "farms.html";
    }

    const feats = document.querySelectorAll(".featurs-item");
    const blocks = d.blocks || [];
    const icons = ["fa-leaf", "fa-map-marked-alt", "fa-bus", "fa-newspaper"];
    const hrefs = ["shop.html", "farms.html", "tours.html", "news.html"];
    feats.forEach(function (el, i) {
      const b = blocks[i] || {};
      const h5 = el.querySelector("h5");
      const p = el.querySelector("p");
      if (h5) h5.textContent = b.title || h5.textContent;
      if (p) p.textContent = "Xem ngay";
      el.style.cursor = "pointer";
      el.addEventListener("click", function () {
        location.href = hrefs[i];
      });
      const ic = el.querySelector("i");
      if (ic && icons[i]) ic.className = "fas " + icons[i] + " fa-3x text-white";
    });

    const shopTitle = document.querySelector(".fruite h1");
    if (shopTitle) shopTitle.textContent = "Nông sản bán chạy";
    const tabList = document.querySelector(".fruite .nav-pills");
    if (tabList) {
      tabList.innerHTML =
        '<li class="nav-item"><a class="d-flex m-2 py-2 bg-light rounded-pill active" href="shop.html"><span class="text-dark" style="width:130px">Tất cả</span></a></li>' +
        '<li class="nav-item"><a class="d-flex m-2 py-2 bg-light rounded-pill" href="shop.html?category=rau"><span class="text-dark" style="width:130px">Rau</span></a></li>' +
        '<li class="nav-item"><a class="d-flex m-2 py-2 bg-light rounded-pill" href="shop.html?category=trai_cay"><span class="text-dark" style="width:130px">Trái cây</span></a></li>' +
        '<li class="nav-item"><a class="d-flex m-2 py-2 bg-light rounded-pill" href="shop.html?category=dac_san"><span class="text-dark" style="width:130px">Đặc sản</span></a></li>';
    }
    const allTab = document.querySelector("#tab-1 .row.g-4 .row.g-4") || document.querySelector("#tab-1 .row.g-4");
    const grid = document.querySelector("#tab-1 .col-lg-12 > .row.g-4");
    if (grid) {
      grid.innerHTML = (d.bestSellers || []).map(function (p) {
        return productCard(p, "col-md-6 col-lg-4 col-xl-3");
      }).join("");
    }
    ["tab-2", "tab-3", "tab-4", "tab-5"].forEach(function (id) {
      const pane = document.getElementById(id);
      if (pane) pane.remove();
    });

    const serviceRow = document.querySelector(".service .row");
    if (serviceRow) {
      const farms = d.featuredFarms || [];
      serviceRow.innerHTML = farms.slice(0, 3).map(function (f, i) {
        const cls = i === 1 ? "bg-dark border-dark" : i === 2 ? "bg-primary border-primary" : "bg-secondary border-secondary";
        const inner = i === 1 ? "bg-light" : "bg-primary";
        const titleCls = i === 1 ? "text-primary" : "text-white";
        return (
          '<div class="col-md-6 col-lg-4"><a href="farm-detail.html?id=' +
          f._id +
          '"><div class="service-item ' +
          cls +
          ' rounded border">' +
          '<img src="' +
          esc(img(f.coverImage)) +
          '" class="img-fluid rounded-top w-100" alt="" style="height:220px;object-fit:cover">' +
          '<div class="px-4 rounded-bottom"><div class="service-content ' +
          inner +
          ' text-center p-4 rounded"><h5 class="' +
          titleCls +
          '">' +
          esc(f.name) +
          "</h5><h3 class='mb-0'>" +
          esc(f.hamlet) +
          "</h3></div></div></div></a></div>"
        );
      }).join("");
    }

    const vegTitle = document.querySelector(".vesitable h1");
    if (vegTitle) vegTitle.textContent = "Nông trại nổi bật";
    const veg = document.querySelector(".vegetable-carousel");
    if (veg && window.jQuery) {
      const $ = window.jQuery;
      if ($(veg).data("owl.carousel")) $(veg).trigger("destroy.owl.carousel");
      veg.className = "owl-carousel vegetable-carousel justify-content-center";
      veg.innerHTML = (d.featuredFarms || [])
        .map(function (f) {
          return (
            '<div class="border border-primary rounded position-relative vesitable-item">' +
            '<div class="vesitable-img"><img src="' +
            esc(img(f.coverImage)) +
            '" class="img-fluid w-100 rounded-top" alt="" style="height:180px;object-fit:cover"></div>' +
            '<div class="text-white bg-primary px-3 py-1 rounded position-absolute" style="top:10px;right:10px">' +
            esc((f.tags && f.tags[0]) || "Trải nghiệm") +
            "</div>" +
            '<div class="p-4 rounded-bottom"><h4>' +
            esc(f.name) +
            "</h4><p>" +
            esc(f.hamlet) +
            " · " +
            stars(f.avgRating) +
            '</p><a href="farm-detail.html?id=' +
            f._id +
            '" class="btn border border-secondary rounded-pill px-3 text-primary">Đặt trải nghiệm</a></div></div>'
          );
        })
        .join("");
      $(veg).owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        dots: true,
        loop: (d.featuredFarms || []).length > 1,
        margin: 25,
        nav: true,
        navText: ['<i class="bi bi-arrow-left"></i>', '<i class="bi bi-arrow-right"></i>'],
        responsive: { 0: { items: 1 }, 768: { items: 2 }, 992: { items: 3 }, 1200: { items: 4 } },
      });
    }

    const bannerH1 = document.querySelector(".banner h1.display-3");
    if (bannerH1) bannerH1.textContent = "Tour miệt vườn từ TP.HCM";
    const bannerP = document.querySelector(".banner p.display-3");
    if (bannerP) bannerP.textContent = "1 ngày tại Bình Mỹ";
    const bannerDesc = document.querySelector(".banner p.mb-4");
    if (bannerDesc) bannerDesc.textContent = brand.banner || "";
    const bannerBtn = document.querySelector(".banner a.banner-btn");
    if (bannerBtn) {
      bannerBtn.textContent = "Xem tour";
      bannerBtn.href = "tours.html";
    }

    const bestHead = document.querySelector(".container.py-5 .text-center.mx-auto.mb-5 h1.display-4");
    if (bestHead) bestHead.textContent = "Gợi ý nông sản";
    const bestP = bestHead && bestHead.nextElementSibling;
    if (bestP && bestP.tagName === "P") bestP.textContent = "Mua trực tiếp từ hộ dân xã Bình Mỹ.";
    const bestRow = bestHead && bestHead.closest(".container") && bestHead.closest(".container").querySelector(".row.g-4");
    if (bestRow) {
      bestRow.innerHTML = (d.bestSellers || [])
        .slice(0, 6)
        .map(function (p) {
          return (
            '<div class="col-lg-6 col-xl-4"><div class="p-4 rounded bg-light"><div class="row align-items-center">' +
            '<div class="col-6"><img src="' +
            esc(img(p.images && p.images[0])) +
            '" class="img-fluid rounded-circle w-100" alt="" style="height:140px;object-fit:cover"></div>' +
            '<div class="col-6"><a href="shop-detail.html?id=' +
            p._id +
            '" class="h5">' +
            esc(p.name) +
            "</a><div class='d-flex my-3'>" +
            stars(p.avgRating) +
            '</div><h4 class="mb-3">' +
            money(p.price) +
            '</h4><button type="button" class="btn border border-secondary rounded-pill px-3 text-primary bmc-add" data-id="' +
            p._id +
            '"><i class="fa fa-shopping-bag me-2 text-primary"></i>Thêm giỏ</button></div></div></div></div>'
          );
        })
        .join("");
    }

    const testiHead = document.querySelector(".testimonial-header h4");
    if (testiHead) testiHead.textContent = "Tin mới nhất";
    const testiH1 = document.querySelector(".testimonial-header h1");
    if (testiH1) testiH1.textContent = "Bản tin Bình Mỹ";
    const testiCar = document.querySelector(".testimonial-carousel");
    if (testiCar && window.jQuery) {
      const $ = window.jQuery;
      if ($(testiCar).data("owl.carousel")) $(testiCar).trigger("destroy.owl.carousel");
      testiCar.innerHTML = (d.latestNews || [])
        .map(function (n) {
          return (
            '<div class="testimonial-item img-border-radius bg-light rounded p-4"><div class="position-relative">' +
            '<div class="mb-4 pb-4 border-bottom border-secondary"><p class="mb-0">' +
            esc((n.content || "").slice(0, 160)) +
            "…</p></div>" +
            '<div class="d-flex align-items-center"><div><h4 class="text-dark">' +
            esc(n.title) +
            '</h4><p class="m-0 pb-3">' +
            esc(NEWS_CAT[n.category] || n.category) +
            '</p><a href="news.html?id=' +
            n._id +
            '">Đọc tiếp</a></div></div></div></div>'
          );
        })
        .join("");
      $(testiCar).owlCarousel({
        autoplay: true,
        smartSpeed: 2000,
        dots: true,
        loop: (d.latestNews || []).length > 1,
        margin: 25,
        nav: true,
        navText: ['<i class="bi bi-arrow-left"></i>', '<i class="bi bi-arrow-right"></i>'],
        responsive: { 0: { items: 1 }, 992: { items: 2 } },
      });
    }
  }

  async function fillShop() {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    const category = params.get("category") || "";
    const farm = params.get("farm") || "";
    const h1 = document.querySelector(".page-header h1, .fruite h1");
    if (document.querySelector(".fruite h1")) document.querySelector(".fruite h1").textContent = "Nông sản Bình Mỹ";
    if (document.querySelector(".page-header h1")) document.querySelector(".page-header h1").textContent = "Nông sản";
    const searchBox = document.querySelector(".fruite input[type=search]");
    if (searchBox) searchBox.value = q;
    const sort = document.getElementById("fruits");
    if (sort) {
      sort.innerHTML =
        '<option value="">Bán chạy</option><option value="rating">Điểm đánh giá</option><option value="price_asc">Giá tăng</option><option value="price_desc">Giá giảm</option>';
    }
    async function load() {
      const res = await API.products({
        q: searchBox ? searchBox.value : q,
        category: category,
        farm: farm,
        sort: sort ? sort.value : "",
      });
      const items = res.data || [];
      const cats = { rau: 0, trai_cay: 0, dac_san: 0 };
      items.forEach(function (p) {
        if (cats[p.category] != null) cats[p.category]++;
      });
      const catUl = document.querySelector(".fruite-categorie");
      if (catUl) {
        catUl.innerHTML =
          '<li><div class="d-flex justify-content-between fruite-name"><a href="shop.html"><i class="fas fa-apple-alt me-2"></i>Tất cả</a><span>(' +
          items.length +
          ')</span></div></li>' +
          Object.keys(CAT)
            .map(function (k) {
              return (
                '<li><div class="d-flex justify-content-between fruite-name"><a href="shop.html?category=' +
                k +
                '"><i class="fas fa-apple-alt me-2"></i>' +
                CAT[k] +
                "</a><span>(" +
                (cats[k] || 0) +
                ")</span></div></li>"
              );
            })
            .join("");
      }
      const grid = document.querySelector(".col-lg-9 .row.g-4.justify-content-center");
      if (grid) {
        grid.innerHTML =
          items.map(function (p) {
            return productCard(p);
          }).join("") || '<p class="p-4">Chưa có sản phẩm.</p>';
      }
      const feat = document.querySelector(".col-lg-3 h4.mb-3");
      if (feat && feat.textContent.indexOf("Featured") >= 0) {
        const box = feat.parentElement;
        const tops = items.slice(0, 3);
        let html = "<h4 class='mb-3'>Bán chạy</h4>";
        tops.forEach(function (p) {
          html +=
            '<div class="d-flex align-items-center justify-content-start mb-3">' +
            '<div class="rounded me-4" style="width:80px;height:80px"><img src="' +
            esc(img(p.images && p.images[0])) +
            '" class="img-fluid rounded" style="width:80px;height:80px;object-fit:cover"></div>' +
            "<div><h6 class='mb-2'><a href='shop-detail.html?id=" +
            p._id +
            "'>" +
            esc(p.name) +
            "</a></h6><div class='d-flex mb-2'>" +
            stars(p.avgRating) +
            "</div><h5 class='fw-bold'>" +
            money(p.price) +
            "</h5></div></div>";
        });
        const extra = box.querySelectorAll(".d-flex.align-items-center, .d-flex.justify-content-center");
        extra.forEach(function (n) {
          n.remove();
        });
        feat.outerHTML = html;
      }
    }
    if (searchBox) {
      searchBox.addEventListener("keydown", function (e) {
        if (e.key === "Enter") load();
      });
    }
    if (sort) sort.addEventListener("change", load);
    await load();
  }

  async function fillShopDetail() {
    const id = new URLSearchParams(location.search).get("id");
    let product;
    if (id) {
      const res = await API.product(id);
      product = res.data;
    } else {
      const res = await API.products();
      product = (res.data || [])[0];
      if (product) history.replaceState({}, "", "shop-detail.html?id=" + product._id);
    }
    if (!product) return;
    document.querySelector(".page-header h1").textContent = product.name;
    const imgEl = document.querySelector(".col-lg-6 .border.rounded img");
    if (imgEl) imgEl.src = img(product.images && product.images[0]);
    const h4 = document.querySelector(".col-lg-6 h4.fw-bold");
    if (h4) h4.textContent = product.name;
    const catP = h4 && h4.nextElementSibling;
    if (catP) catP.textContent = "Loại: " + (CAT[product.category] || product.category) + " · Hộ: " + farmName(product);
    const price = document.querySelector(".col-lg-6 h5.fw-bold");
    if (price) price.textContent = money(product.price) + " / " + product.unit;
    const starBox = document.querySelector(".col-lg-6 .d-flex.mb-4");
    if (starBox) starBox.innerHTML = stars(product.avgRating) + " <span class='ms-2'>(" + (product.reviewCount || 0) + ")</span>";
    const ps = document.querySelectorAll(".col-lg-6 > p.mb-4");
    if (ps[0]) ps[0].textContent = product.description || "";
    if (ps[1]) ps[1].textContent = (product.originNote || "") + " · Còn " + product.stock + " " + product.unit;
    const addBtn = document.querySelector(".col-lg-6 a.btn");
    if (addBtn) {
      addBtn.textContent = "";
      addBtn.innerHTML = '<i class="fa fa-shopping-bag me-2 text-primary"></i>Thêm giỏ / Mua';
      addBtn.href = "#";
      addBtn.addEventListener("click", function (e) {
        e.preventDefault();
        const qty = Number(document.querySelector(".quantity input").value || 1);
        addToCart(product._id, qty);
      });
    }
    const about = document.querySelector("#nav-about");
    if (about) {
      about.innerHTML =
        "<p>" +
        esc(product.description) +
        "</p><p>" +
        esc(product.originNote) +
        "</p>" +
        (product.farm
          ? '<p><a href="farm-detail.html?id=' +
            (product.farm._id || product.farm) +
            '">Xem vườn ' +
            esc(product.farm.name || "") +
            "</a></p>"
          : "") +
        (product.farmer
          ? '<p><button type="button" class="btn btn-outline-primary rounded-pill" id="bmc-msg-farmer">Nhắn chủ hộ</button></p>'
          : "");
      const msgBtn = document.getElementById("bmc-msg-farmer");
      if (msgBtn) {
        msgBtn.addEventListener("click", async function () {
          if (!API.token()) return (location.href = "login.html");
          const text = prompt("Nội dung nhắn chủ hộ:");
          if (!text) return;
          try {
            await API.sendMessage({
              toUserId: product.farmer._id || product.farmer,
              text: text,
              relatedType: "product",
              relatedId: product._id,
            });
            alert("Đã gửi tin nhắn");
          } catch (e) {
            alert(e.message);
          }
        });
      }
    }
    const revPane = document.querySelector("#nav-mission");
    if (revPane) {
      const revs = await API.reviews({ targetType: "product", targetId: product._id });
      const list = revs.data || [];
      revPane.innerHTML = list.length
        ? list
            .map(function (r) {
              return (
                '<div class="d-flex mb-4"><img src="img/avatar.jpg" class="img-fluid rounded-circle p-3" style="width:90px;height:90px"><div><p class="mb-2">' +
                new Date(r.createdAt).toLocaleDateString("vi-VN") +
                "</p><div class='d-flex justify-content-between'><h5>" +
                esc(authorName(r.author)) +
                "</h5><div>" +
                stars(r.rating) +
                "</div></div><p>" +
                esc(r.comment) +
                "</p></div></div>"
              );
            })
            .join("")
        : "<p>Chưa có đánh giá (chỉ người đã mua và hoàn tất đơn mới được đánh giá).</p>";
    }
  }

  async function fillCart() {
    const h = document.querySelector(".page-header h1");
    if (h) h.textContent = "Giỏ hàng";
    const tbody = document.querySelector(".table tbody");
    if (!API.token()) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="p-4">Hãy <a href="login.html">đăng nhập</a> tài khoản khách để xem giỏ. Mẫu: an.nguyen@gmail.com / 123456</td></tr>';
      return;
    }
    const res = await API.cart();
    const items = res.data || [];
    if (!tbody) return;
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="p-4">Giỏ trống. <a href="shop.html">Mua nông sản</a></td></tr>';
      return;
    }
    let sub = 0;
    tbody.innerHTML = items
      .map(function (line) {
        const p = line.product || {};
        const total = (p.price || 0) * (line.quantity || 0);
        sub += total;
        const pid = p._id;
        return (
          "<tr>" +
          '<th scope="row"><div class="d-flex align-items-center"><img src="' +
          esc(img(p.images && p.images[0])) +
          '" class="img-fluid me-5 rounded-circle" style="width:80px;height:80px;object-fit:cover"></div></th>' +
          '<td><p class="mb-0 mt-4"><a href="shop-detail.html?id=' +
          pid +
          '">' +
          esc(p.name) +
          "</a></p></td>" +
          '<td><p class="mb-0 mt-4">' +
          money(p.price) +
          "</p></td>" +
          '<td><p class="mb-0 mt-4">' +
          line.quantity +
          " " +
          esc(p.unit || "") +
          "</p></td>" +
          '<td><p class="mb-0 mt-4">' +
          money(total) +
          "</p></td>" +
          '<td><button class="btn btn-md rounded-circle bg-light border mt-4 bmc-del" data-id="' +
          pid +
          '"><i class="fa fa-times text-danger"></i></button></td></tr>'
        );
      })
      .join("");
    tbody.querySelectorAll(".bmc-del").forEach(function (b) {
      b.addEventListener("click", async function () {
        await API.removeCart(b.getAttribute("data-id"));
        location.reload();
      });
    });
    const totals = document.querySelectorAll(".bg-light.rounded p.mb-0");
    if (totals[0]) totals[0].textContent = money(sub);
    const shipNote = document.querySelector(".bg-light.rounded p.text-end");
    if (shipNote) shipNote.textContent = "Giao theo địa chỉ khi thanh toán";
    const totalLine = document.querySelector(".border-top.border-bottom p.mb-0");
    if (totalLine) totalLine.textContent = money(sub);
    const checkoutBtn = document.querySelector(".bg-light.rounded button");
    if (checkoutBtn) {
      checkoutBtn.textContent = "Thanh toán";
      checkoutBtn.addEventListener("click", function () {
        location.href = "chackout.html";
      });
    }
  }

  async function fillCheckout() {
    const h = document.querySelector(".page-header h1");
    if (h) h.textContent = "Đặt hàng";
    const form = document.querySelector("form");
    if (!form) return;
    if (!API.token()) {
      form.innerHTML = '<p>Hãy <a href="login.html">đăng nhập</a> tài khoản khách. Mẫu: an.nguyen@gmail.com / 123456</p>';
      return;
    }
    const me = (await API.me()).user;
    const cart = (await API.cart()).data || [];
    const inputs = form.querySelectorAll("input.form-control");
    if (inputs[0]) inputs[0].value = authorName(me).split(" ").slice(-1).join(" ");
    if (inputs[1]) inputs[1].value = authorName(me);
    const addr = form.querySelector('input[placeholder="House Number Street Name"]');
    if (addr) {
      addr.placeholder = "Địa chỉ nhận hàng";
      addr.id = "bmc-address";
    }
    const phone = form.querySelector('input[type=tel]');
    if (phone) {
      phone.id = "bmc-phone";
      phone.value = me.phone || "";
    }
    const note = form.querySelector("textarea");
    if (note) note.id = "bmc-note";
    const tbody = form.querySelector("table tbody");
    let sub = 0;
    if (tbody) {
      tbody.innerHTML = cart
        .map(function (line) {
          const p = line.product || {};
          const t = (p.price || 0) * line.quantity;
          sub += t;
          return (
            "<tr><th><img src='" +
            esc(img(p.images && p.images[0])) +
            "' style='width:70px;height:70px;object-fit:cover' class='rounded'></th><td>" +
            esc(p.name) +
            "</td><td>" +
            money(p.price) +
            "</td><td>" +
            line.quantity +
            "</td><td>" +
            money(t) +
            "</td></tr>"
          );
        })
        .join("");
    }
    const placeBtn = form.querySelector('button[type=submit], .btn.border-secondary.py-3');
    const buttons = form.querySelectorAll("button");
    const lastBtn = buttons[buttons.length - 1];
    if (lastBtn) {
      lastBtn.textContent = "Đặt hàng";
      lastBtn.type = "button";
      lastBtn.addEventListener("click", async function () {
        try {
          const address = (document.getElementById("bmc-address") || {}).value;
          const ph = (document.getElementById("bmc-phone") || {}).value;
          if (!address) return alert("Nhập địa chỉ nhận");
          await API.checkout({
            shippingAddress: address,
            phone: ph,
            note: (document.getElementById("bmc-note") || {}).value,
          });
          alert("Đã tạo đơn. Nông dân sẽ xác nhận.");
          location.href = "cart.html";
        } catch (e) {
          alert(e.message);
        }
      });
    }
  }

  async function fillTestimonials() {
    document.querySelector(".page-header h1").textContent = "Đánh giá";
    const h4 = document.querySelector(".testimonial-header h4");
    if (h4) h4.textContent = "Người đã mua / đã đi";
    const h1 = document.querySelector(".testimonial-header h1");
    if (h1) h1.textContent = "Đánh giá nông sản & trải nghiệm";
    const res = await API.reviews();
    const list = res.data || [];
    const car = document.querySelector(".testimonial-carousel");
    if (!car || !window.jQuery) return;
    const $ = window.jQuery;
    if ($(car).data("owl.carousel")) $(car).trigger("destroy.owl.carousel");
    const labels = { product: "Nông sản", farm: "Nông trại", tour: "Tour", vehicle: "Xe" };
    car.innerHTML = list
      .map(function (r) {
        return (
          '<div class="testimonial-item img-border-radius bg-light rounded p-4"><div class="position-relative">' +
          '<div class="mb-4 pb-4 border-bottom border-secondary"><p class="mb-0">' +
          esc(r.comment) +
          "</p></div>" +
          '<div class="d-flex align-items-center"><img src="img/avatar.jpg" class="img-fluid rounded" style="width:80px;height:80px">' +
          '<div class="ms-4"><h4>' +
          esc(authorName(r.author)) +
          "</h4><p class='m-0 pb-3'>" +
          (labels[r.targetType] || r.targetType) +
          "</p><div>" +
          stars(r.rating) +
          "</div></div></div></div></div>"
        );
      })
      .join("");
    $(car).owlCarousel({
      autoplay: true,
      smartSpeed: 2000,
      dots: true,
      loop: list.length > 1,
      margin: 25,
      nav: true,
      navText: ['<i class="bi bi-arrow-left"></i>', '<i class="bi bi-arrow-right"></i>'],
      responsive: { 0: { items: 1 }, 992: { items: 2 } },
    });
  }

  async function fillContact() {
    document.querySelector(".page-header h1").textContent = "Liên hệ chủ vườn";
    const title = document.querySelector(".contact h1");
    if (title) title.textContent = "Nhắn nông dân / doanh nghiệp";
    const intro = document.querySelector(".contact p.mb-4");
    if (intro) intro.textContent = "Chọn hộ bên dưới hoặc gửi tin sau khi đăng nhập. Địa điểm: xã Bình Mỹ, Củ Chi.";
    const iframe = document.querySelector(".contact iframe");
    if (iframe) {
      iframe.src =
        "https://www.google.com/maps?q=Binh+My+Cu+Chi+Ho+Chi+Minh&output=embed";
    }
    const farms = (await API.farms()).data || [];
    const info = document.querySelector(".col-lg-5");
    if (info) {
      info.innerHTML = farms
        .map(function (f) {
          const phone = (f.owner && f.owner.phone) || "";
          return (
            '<div class="d-flex p-4 rounded mb-4 bg-white">' +
            '<i class="fas fa-map-marker-alt fa-2x text-primary me-4"></i><div>' +
            "<h4>" +
            esc(f.name) +
            "</h4><p class='mb-1'>" +
            esc(f.address) +
            "</p><p class='mb-0'>" +
            esc(phone) +
            "</p></div></div>"
          );
        })
        .join("");
    }
    const form = document.querySelector(".contact form");
    if (form) {
      form.innerHTML =
        '<select id="bmc-farm" class="w-100 form-control border-0 py-3 mb-4">' +
        farms
          .map(function (f) {
            return '<option value="' + f.owner._id + '" data-farm="' + f._id + '">' + esc(f.name) + "</option>";
          })
          .join("") +
        "</select>" +
        '<textarea id="bmc-msg" class="w-100 form-control border-0 mb-4" rows="5" placeholder="Nội dung nhắn"></textarea>' +
        '<button class="w-100 btn form-control border-secondary py-3 bg-white text-primary" type="submit">Gửi tin</button>';
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!API.token()) return (location.href = "login.html");
        const sel = document.getElementById("bmc-farm");
        try {
          await API.sendMessage({
            toUserId: sel.value,
            text: document.getElementById("bmc-msg").value,
            relatedType: "farm",
            relatedId: sel.options[sel.selectedIndex].getAttribute("data-farm"),
          });
          alert("Đã gửi tin nhắn");
          form.reset();
        } catch (err) {
          alert(err.message);
        }
      });
    }
  }

  async function fillFarms() {
    const res = await API.farms();
    const grid = document.getElementById("bmc-grid");
    if (grid) grid.innerHTML = (res.data || []).map(function (f) { return farmCard(f); }).join("");
  }

  async function fillFarmDetail() {
    const id = new URLSearchParams(location.search).get("id");
    if (!id) return (location.href = "farms.html");
    const res = await API.farm(id);
    const farm = res.data.farm;
    const products = res.data.products || [];
    const tours = res.data.tours || [];
    const root = document.getElementById("bmc-detail");
    if (!root) return;
    document.querySelector(".page-header h1").textContent = farm.name;
    root.innerHTML =
      '<div class="row g-4"><div class="col-lg-6"><img src="' +
      esc(img(farm.coverImage)) +
      '" class="img-fluid rounded w-100" style="max-height:420px;object-fit:cover"></div>' +
      '<div class="col-lg-6"><h2>' +
      esc(farm.name) +
      "</h2><p>" +
      stars(farm.avgRating) +
      " " +
      (farm.avgRating || 0) +
      " (" +
      (farm.reviewCount || 0) +
      " đánh giá)</p><p>" +
      esc(farm.intro) +
      "</p><p><strong>Giờ mở cửa:</strong> " +
      esc(farm.openHours) +
      "</p><p><strong>Địa chỉ:</strong> " +
      esc(farm.address) +
      "</p><p><strong>Chỉ đường:</strong> " +
      esc(farm.mapDirections) +
      "</p><p>Tag: " +
      esc((farm.tags || []).join(", ")) +
      "</p><p>Dịch vụ: " +
      esc((farm.onSiteServices || []).join(", ")) +
      "</p>" +
      (farm.isOpenForVisitors ? "<p class='text-success'>Đang mở đón khách</p>" : "<p class='text-danger'>Chưa mở đón khách</p>") +
      "</div></div>" +
      "<h3 class='mt-5'>Gói trải nghiệm</h3><div class='row g-4'>" +
      (farm.packages || [])
        .map(function (pk) {
          return (
            '<div class="col-md-4"><div class="p-4 bg-light rounded"><h5>' +
            esc(pk.name) +
            "</h5><p>" +
            esc(pk.description || "") +
            "</p><p>" +
            money(pk.price) +
            " · tối đa " +
            pk.maxGuests +
            " khách · " +
            pk.durationMinutes +
            " phút</p></div></div>"
          );
        })
        .join("") +
      "</div>" +
      "<h3 class='mt-5'>Nông sản của hộ</h3><div class='row g-4'>" +
      products.map(function (p) { return productCard(p); }).join("") +
      "</div>" +
      "<h3 class='mt-5'>Tour gắn điểm này</h3>" +
      (tours
        .map(function (t) {
          return '<p><a href="tours.html">' + esc(t.title) + "</a> — " + money(t.price) + "</p>";
        })
        .join("") || "<p>Chưa có tour.</p>");
  }

  async function fillTours() {
    const [tours, vehicles] = await Promise.all([API.tours(), API.vehicles()]);
    const grid = document.getElementById("bmc-grid");
    if (!grid) return;
    grid.innerHTML =
      "<div class='col-12'><h2>Tour trải nghiệm</h2></div>" +
      (tours.data || [])
        .map(function (t) {
          return (
            '<div class="col-md-6 col-lg-4"><div class="rounded border p-0 overflow-hidden h-100">' +
            '<img src="' +
            esc(img(t.coverImage)) +
            '" class="img-fluid w-100" style="height:200px;object-fit:cover">' +
            '<div class="p-4"><h4>' +
            esc(t.title) +
            "</h4><p>" +
            (t.durationType === "mot_ngay" ? "1 ngày" : "Nửa ngày") +
            " · từ " +
            (t.startFrom === "tphcm" ? "TP.HCM" : "Củ Chi") +
            "</p><p>" +
            esc(t.departureSchedule) +
            "</p><p>" +
            money(t.price) +
            " · " +
            t.seats +
            " chỗ</p><p>" +
            stars(t.avgRating) +
            "</p></div></div></div>"
          );
        })
        .join("") +
      "<div class='col-12 mt-4'><h2>Đặt xe nội vùng</h2></div>" +
      (vehicles.data || [])
        .map(function (v) {
          const type = { xe_4_cho: "Xe 4 chỗ", xe_7_cho: "Xe 7 chỗ", dua_don_nhom: "Đưa đón nhóm" }[v.vehicleType];
          return (
            '<div class="col-md-4"><div class="p-4 bg-light rounded"><h5>' +
            esc(v.name) +
            "</h5><p>" +
            esc(type) +
            "</p><p>" +
            money(v.price) +
            " / " +
            esc(v.priceUnit) +
            "</p></div></div>"
          );
        })
        .join("");
  }

  async function fillNews() {
    const id = new URLSearchParams(location.search).get("id");
    const grid = document.getElementById("bmc-grid");
    if (!grid) return;
    if (id) {
      const item = (await API.newsItem(id)).data;
      document.querySelector(".page-header h1").textContent = item.title;
      grid.innerHTML =
        '<div class="col-12"><img src="' +
        esc(img(item.coverImage)) +
        '" class="img-fluid rounded mb-4" style="max-height:360px;object-fit:cover;width:100%"><h2>' +
        esc(item.title) +
        "</h2><p class='text-muted'>" +
        new Date(item.publishedAt || item.createdAt).toLocaleDateString("vi-VN") +
        " · " +
        esc(NEWS_CAT[item.category]) +
        "</p><p style='white-space:pre-wrap'>" +
        esc(item.content) +
        "</p></div>";
      return;
    }
    const res = await API.news();
    grid.innerHTML = (res.data || [])
      .map(function (n) {
        return (
          '<div class="col-md-6 col-lg-4"><div class="bg-light rounded overflow-hidden h-100">' +
          '<img src="' +
          esc(img(n.coverImage)) +
          '" class="img-fluid w-100" style="height:200px;object-fit:cover"><div class="p-4"><span class="badge bg-secondary">' +
          esc(NEWS_CAT[n.category]) +
          "</span><h4 class='mt-2'><a href='news.html?id=" +
          n._id +
          "'>" +
          esc(n.title) +
          "</a></h4><p>" +
          esc((n.content || "").slice(0, 120)) +
          "…</p></div></div></div>"
        );
      })
      .join("");
  }

  function fillLogin() {
    const form = document.getElementById("bmc-login-form");
    if (!form) return;
    const u = API.user();
    const info = document.getElementById("bmc-login-info");
    if (u && info) {
      info.innerHTML =
        "<p>Đang đăng nhập: <strong>" +
        esc(authorName(u)) +
        "</strong> (" +
        esc(ROLE[u.role] || u.role) +
        ' — ' +
        esc(u.email) +
        ')</p><button type="button" class="btn btn-outline-danger mb-4" id="bmc-logout">Đăng xuất</button>';
      document.getElementById("bmc-logout").onclick = function () {
        API.logout();
        location.reload();
      };
    }
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      try {
        await API.login(document.getElementById("bmc-email").value, document.getElementById("bmc-password").value);
        location.href = "index.html";
      } catch (err) {
        alert(err.message);
      }
    });
    const reg = document.getElementById("bmc-register-form");
    if (reg) {
      reg.addEventListener("submit", async function (e) {
        e.preventDefault();
        try {
          await API.register({
            email: document.getElementById("bmc-reg-email").value,
            password: document.getElementById("bmc-reg-password").value,
            role: document.getElementById("bmc-reg-role").value,
            phone: document.getElementById("bmc-reg-phone").value,
            fullName: document.getElementById("bmc-reg-name").value,
            householdName: document.getElementById("bmc-reg-name").value,
            companyName: document.getElementById("bmc-reg-name").value,
            area: document.getElementById("bmc-reg-area").value,
            hamlet: document.getElementById("bmc-reg-area").value,
          });
          location.href = "index.html";
        } catch (err) {
          alert(err.message);
        }
      });
    }
  }

  function listPageShellNeeded() {
    return ["farms.html", "farm-detail.html", "tours.html", "news.html", "login.html"].indexOf(pageName()) >= 0;
  }

  async function boot() {
    applyChrome();
    await refreshCartBadge();
    const p = pageName();
    try {
      if (p === "index.html" || p === "" || p === "/") await fillHome();
      else if (p === "shop.html") await fillShop();
      else if (p === "shop-detail.html") await fillShopDetail();
      else if (p === "cart.html") await fillCart();
      else if (p === "chackout.html") await fillCheckout();
      else if (p === "testimonial.html") await fillTestimonials();
      else if (p === "contact.html") await fillContact();
      else if (p === "farms.html") await fillFarms();
      else if (p === "farm-detail.html") await fillFarmDetail();
      else if (p === "tours.html") await fillTours();
      else if (p === "news.html") await fillNews();
      else if (p === "login.html") fillLogin();
    } catch (e) {
      console.error(e);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
