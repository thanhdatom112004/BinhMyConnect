require("dotenv").config();
const mongoose = require("mongoose");
const { connectDb } = require("../config/db");
const User = require("../models/User");
const Farm = require("../models/Farm");
const Product = require("../models/Product");
const Tour = require("../models/Tour");
const Vehicle = require("../models/Vehicle");
const News = require("../models/News");
const Order = require("../models/Order");
const { ExperienceBooking, TourBooking, VehicleBooking } = require("../models/Booking");
const Review = require("../models/Review");
const Conversation = require("../models/Conversation");
const Partnership = require("../models/Partnership");
const { setTargetRating } = require("../utils/ratings");

async function reset() {
  await Promise.all([
    User.deleteMany({}),
    Farm.deleteMany({}),
    Product.deleteMany({}),
    Tour.deleteMany({}),
    Vehicle.deleteMany({}),
    News.deleteMany({}),
    Order.deleteMany({}),
    ExperienceBooking.deleteMany({}),
    TourBooking.deleteMany({}),
    VehicleBooking.deleteMany({}),
    Review.deleteMany({}),
    Conversation.deleteMany({}),
    Partnership.deleteMany({}),
  ]);
}

async function seed() {
  await connectDb();
  await reset();

  const admin = await User.create({
    email: "admin@binhmyconnect.vn",
    password: "admin123",
    role: "admin",
    phone: "0900000001",
    customerProfile: { fullName: "Quản trị Bình Mỹ Connect", area: "Củ Chi" },
  });

  const customers = await User.create([
    {
      email: "an.nguyen@gmail.com",
      password: "123456",
      role: "customer",
      phone: "0908123456",
      customerProfile: { fullName: "Nguyễn Minh An", area: "Quận 1, TP.HCM" },
    },
    {
      email: "linh.tran@gmail.com",
      password: "123456",
      role: "customer",
      phone: "0912345678",
      customerProfile: { fullName: "Trần Khánh Linh", area: "Quận Bình Thạnh, TP.HCM" },
    },
    {
      email: "hung.pham@gmail.com",
      password: "123456",
      role: "customer",
      phone: "0987654321",
      customerProfile: { fullName: "Phạm Quốc Hùng", area: "TP. Thủ Đức, TP.HCM" },
    },
  ]);

  const farmers = await User.create([
    {
      email: "uttam@binhmyconnect.vn",
      password: "123456",
      role: "farmer",
      phone: "0903111222",
      farmerProfile: {
        householdName: "Vườn trái cây Út Tám",
        hamlet: "Ấp 3",
        gardenDescription:
          "Vườn 2 ha sầu riêng Ri6, mít Thái, chôm chôm. Cuối tuần mở hái trái và làm bánh dân gian.",
        photos: ["/img/hero-img-2.jpg", "/img/fruite-item-1.jpg"],
        mainProducts: ["Sầu riêng Ri6", "Mít Thái", "Chôm chôm"],
      },
    },
    {
      email: "nhamuoi@binhmyconnect.vn",
      password: "123456",
      role: "farmer",
      phone: "0903555666",
      farmerProfile: {
        householdName: "Vườn rau hữu cơ Nhà Mười",
        hamlet: "Ấp 1",
        gardenDescription: "Rau ăn lá canh tác hữu cơ, tưới nước giếng, thu hoạch sáng sớm.",
        photos: ["/img/vegetable-item-1.jpg"],
        mainProducts: ["Rau muống", "Cải xanh", "Rau dền"],
      },
    },
    {
      email: "bosua@binhmyconnect.vn",
      password: "123456",
      role: "farmer",
      phone: "0903777888",
      farmerProfile: {
        householdName: "Trang trại bò sữa Bình Mỹ",
        hamlet: "Ấp 5",
        gardenDescription: "Đàn bò sữa 40 con, cho khách xem vắt sữa, nếm sữa tươi và làm bánh flan.",
        photos: ["/img/featur-1.jpg"],
        mainProducts: ["Sữa tươi", "Sữa chua", "Bánh flan"],
      },
    },
    {
      email: "colan@binhmyconnect.vn",
      password: "123456",
      role: "farmer",
      phone: "0903999000",
      farmerProfile: {
        householdName: "Vườn miệt vườn Cô Lan",
        hamlet: "Ấp 4",
        gardenDescription: "Kênh rạch, chèo xuồng, đãi trái tại vườn, có chỗ ăn cơm vườn.",
        photos: ["/img/banner-fruits.jpg"],
        mainProducts: ["Xoài cát", "Ổi", "Mật ong"],
      },
    },
  ]);

  const businesses = await User.create([
    {
      email: "mietvuon@binhmyconnect.vn",
      password: "123456",
      role: "business",
      phone: "02873001234",
      businessProfile: {
        companyName: "Tour Miệt Vườn Củ Chi",
        serviceTypes: ["tour", "an_uong"],
      },
    },
    {
      email: "xebinhmy@binhmyconnect.vn",
      password: "123456",
      role: "business",
      phone: "0904888999",
      businessProfile: {
        companyName: "Xe đưa đón Bình Mỹ",
        serviceTypes: ["xe"],
      },
    },
  ]);

  const [utTam, nhaMuoi, boSua, coLan] = farmers;
  const [tourBiz, xeBiz] = businesses;

  const farms = await Farm.create([
    {
      owner: utTam._id,
      name: "Vườn trái cây Út Tám",
      coverImage: "/img/hero-img-2.jpg",
      hamlet: "Ấp 3",
      address: "Ấp 3, xã Bình Mỹ, Củ Chi, TP.HCM",
      intro:
        "Vườn nhà Út Tám trồng sầu riêng, mít Thái. Khách có thể hái trái theo mùa, làm bánh chuối nướng và nghỉ mát dưới chòi lá.",
      openHours: "07:30 - 17:30 (Thứ 6, 7, CN)",
      mapDirections:
        "Từ ngã tư Củ Chi đi Quốc lộ 22 khoảng 8 km, rẽ phải vào đường Bình Mỹ, gặp chợ Bình Mỹ rẽ trái 700 m thấy bảng Vườn Út Tám.",
      gallery: ["/img/fruite-item-1.jpg", "/img/fruite-item-2.jpg", "/img/best-product-1.jpg"],
      tags: ["hái trái", "làm bánh", "sầu riêng"],
      onSiteServices: ["tham quan", "trải nghiệm", "ăn uống"],
      isOpenForVisitors: true,
      isVisible: true,
      approvalStatus: "approved",
      featured: true,
      packages: [
        {
          name: "Gói hái trái nửa ngày",
          price: 150000,
          maxGuests: 10,
          durationMinutes: 180,
          description: "Tham quan vườn, hái trái theo mùa, nước mát tại chòi.",
        },
        {
          name: "Gói làm bánh dân gian",
          price: 220000,
          maxGuests: 8,
          durationMinutes: 240,
          description: "Hái trái + làm bánh chuối / bánh xèo miền Tây.",
        },
      ],
    },
    {
      owner: nhaMuoi._id,
      name: "Vườn rau hữu cơ Nhà Mười",
      coverImage: "/img/vegetable-item-1.jpg",
      hamlet: "Ấp 1",
      address: "Ấp 1, xã Bình Mỹ, Củ Chi, TP.HCM",
      intro: "Luống rau sạch, khách có thể tự hái rau mang về, nghe hướng dẫn canh tác không thuốc trừ sâu.",
      openHours: "06:00 - 11:00 hằng ngày",
      mapDirections: "Vào xã Bình Mỹ theo đường ấp 1, gặp trạm y tế đi thêm 300 m bên phải.",
      gallery: ["/img/vegetable-item-4.jpg", "/img/vegetable-item-6.jpg"],
      tags: ["hái rau", "hữu cơ"],
      onSiteServices: ["tham quan", "trải nghiệm"],
      isOpenForVisitors: true,
      isVisible: true,
      approvalStatus: "approved",
      featured: true,
      packages: [
        {
          name: "Hái rau buổi sáng",
          price: 80000,
          maxGuests: 15,
          durationMinutes: 90,
          description: "Hái rau, cân mang về (trừ tiền rau theo kg).",
        },
      ],
    },
    {
      owner: boSua._id,
      name: "Trang trại bò sữa Bình Mỹ",
      coverImage: "/img/featur-1.jpg",
      hamlet: "Ấp 5",
      address: "Ấp 5, xã Bình Mỹ, Củ Chi, TP.HCM",
      intro: "Tham quan chuồng bò, xem vắt sữa, nếm sữa tươi và làm bánh flan sữa.",
      openHours: "08:00 - 16:00",
      mapDirections: "Từ UBND xã Bình Mỹ đi ấp 5 khoảng 1,5 km, biển Trang trại bò sữa.",
      gallery: ["/img/featur-2.jpg", "/img/featur-3.jpg"],
      tags: ["bò sữa", "làm bánh"],
      onSiteServices: ["tham quan", "trải nghiệm", "ăn uống"],
      isOpenForVisitors: true,
      isVisible: true,
      approvalStatus: "approved",
      featured: true,
      packages: [
        {
          name: "Tham quan + nếm sữa",
          price: 120000,
          maxGuests: 20,
          durationMinutes: 120,
          description: "Tham quan trại, ly sữa tươi, ảnh với bò.",
        },
      ],
    },
    {
      owner: coLan._id,
      name: "Vườn miệt vườn Cô Lan",
      coverImage: "/img/banner-fruits.jpg",
      hamlet: "Ấp 4",
      address: "Ấp 4, xã Bình Mỹ, Củ Chi, TP.HCM",
      intro: "Kênh rạch, chèo xuồng, đãi trái cây, cơm vườn cá đồng.",
      openHours: "08:00 - 17:00 (đặt trước)",
      mapDirections: "Rẽ vào ấp 4, đi dọc kênh đến cầu tre thứ hai, vườn bên trái.",
      gallery: ["/img/fruite-item-5.jpg", "/img/best-product-5.jpg"],
      tags: ["chèo xuồng", "hái trái", "cơm vườn"],
      onSiteServices: ["tham quan", "ăn uống", "trải nghiệm"],
      isOpenForVisitors: true,
      isVisible: true,
      approvalStatus: "approved",
      featured: true,
      packages: [
        {
          name: "Chèo xuồng + đãi trái",
          price: 180000,
          maxGuests: 12,
          durationMinutes: 180,
          description: "Xuồng đôi, đãi xoài – ổi, nước đá me.",
        },
      ],
    },
    {
      owner: utTam._id,
      name: "Chòi trái cây Út Tám (đang chuẩn bị)",
      coverImage: "/img/fruite-item-6.jpg",
      hamlet: "Ấp 3",
      address: "Khu vườn mới Ấp 3, xã Bình Mỹ",
      intro: "Khu chòi mới, chưa mở đón khách.",
      openHours: "Chưa cố định",
      mapDirections: "Cạnh vườn chính Út Tám, đi sâu thêm 200 m.",
      tags: ["hái trái"],
      onSiteServices: ["tham quan"],
      isOpenForVisitors: false,
      isVisible: false,
      approvalStatus: "pending",
      featured: false,
      packages: [],
    },
  ]);

  const [farmUtTam, farmRau, farmBo, farmLan] = farms;

  const products = await Product.create([
    {
      farmer: utTam._id,
      farm: farmUtTam._id,
      name: "Sầu riêng Ri6 tại vườn",
      category: "trai_cay",
      description: "Sầu riêng Ri6 chín cây, cơm vàng, hạt lép. Giao trong ngày khu vực Củ Chi – nội thành.",
      images: ["/img/fruite-item-1.jpg", "/img/best-product-1.jpg"],
      price: 89000,
      unit: "kg",
      stock: 80,
      originNote: "Xuất xứ: Vườn trái cây Út Tám, Ấp 3, xã Bình Mỹ",
      approvalStatus: "approved",
      soldCount: 46,
    },
    {
      farmer: utTam._id,
      farm: farmUtTam._id,
      name: "Mít Thái lồng",
      category: "trai_cay",
      description: "Mít Thái ngọt, xơ to, đã tách múi theo yêu cầu.",
      images: ["/img/fruite-item-2.jpg"],
      price: 35000,
      unit: "kg",
      stock: 120,
      originNote: "Xuất xứ: Vườn Út Tám, Ấp 3",
      approvalStatus: "approved",
      soldCount: 30,
    },
    {
      farmer: nhaMuoi._id,
      farm: farmRau._id,
      name: "Rau muống hữu cơ",
      category: "rau",
      description: "Thu hoạch sáng, không thuốc trừ sâu. Bó 500g.",
      images: ["/img/vegetable-item-1.jpg"],
      price: 18000,
      unit: "bó",
      stock: 200,
      originNote: "Xuất xứ: Vườn rau Nhà Mười, Ấp 1",
      approvalStatus: "approved",
      soldCount: 90,
    },
    {
      farmer: nhaMuoi._id,
      farm: farmRau._id,
      name: "Cải xanh hữu cơ",
      category: "rau",
      description: "Cải xanh non, phù hợp nấu canh hoặc xào.",
      images: ["/img/vegetable-item-6.jpg"],
      price: 22000,
      unit: "kg",
      stock: 70,
      originNote: "Xuất xứ: Vườn rau Nhà Mười, Ấp 1",
      approvalStatus: "approved",
      soldCount: 40,
    },
    {
      farmer: boSua._id,
      farm: farmBo._id,
      name: "Sữa tươi thanh trùng",
      category: "dac_san",
      description: "Sữa bò sáng vắt, thanh trùng, chai 1 lít.",
      images: ["/img/best-product-5.jpg"],
      price: 45000,
      unit: "chai",
      stock: 60,
      originNote: "Xuất xứ: Trang trại bò sữa Bình Mỹ, Ấp 5",
      approvalStatus: "approved",
      soldCount: 75,
    },
    {
      farmer: coLan._id,
      farm: farmLan._id,
      name: "Xoài cát Hòa Lộc tại vườn",
      category: "trai_cay",
      description: "Xoài cát chín cây, vị ngọt đậm.",
      images: ["/img/fruite-item-5.jpg"],
      price: 55000,
      unit: "kg",
      stock: 50,
      originNote: "Xuất xứ: Vườn miệt vườn Cô Lan, Ấp 4",
      approvalStatus: "approved",
      soldCount: 22,
    },
    {
      farmer: coLan._id,
      farm: farmLan._id,
      name: "Mật ong hoa vườn",
      category: "dac_san",
      description: "Mật ong nuôi ven kênh, chai 500ml.",
      images: ["/img/best-product-6.jpg"],
      price: 180000,
      unit: "chai",
      stock: 25,
      originNote: "Xuất xứ: Vườn Cô Lan, Ấp 4",
      approvalStatus: "approved",
      soldCount: 18,
    },
    {
      farmer: nhaMuoi._id,
      farm: farmRau._id,
      name: "Rau dền (chờ duyệt)",
      category: "rau",
      description: "Lô rau dền mới, đang chờ admin duyệt.",
      images: ["/img/vegetable-item-4.jpg"],
      price: 15000,
      unit: "bó",
      stock: 40,
      originNote: "Xuất xứ: Vườn rau Nhà Mười",
      approvalStatus: "pending",
      soldCount: 0,
    },
  ]);

  const tours = await Tour.create([
    {
      business: tourBiz._id,
      title: "Tour 1 ngày miệt vườn Bình Mỹ từ TP.HCM",
      durationType: "mot_ngay",
      startFrom: "tphcm",
      description:
        "Đón tại trung tâm TP.HCM, tham quan vườn Út Tám, ăn cơm vườn Cô Lan, ghé trang trại bò sữa. Về lại thành phố buổi chiều.",
      coverImage: "/img/hero-img-2.jpg",
      price: 650000,
      seats: 16,
      departureSchedule: "Thứ 7 & Chủ nhật, khởi hành 07:00 tại chợ Bến Thành",
      destinations: [farmUtTam._id, farmLan._id, farmBo._id],
      approvalStatus: "approved",
    },
    {
      business: tourBiz._id,
      title: "Nửa ngày hái rau – hái trái nội vùng Củ Chi",
      durationType: "nua_ngay",
      startFrom: "cu_chi",
      description: "Xuất phát Củ Chi, hái rau Nhà Mười và trái Út Tám, về trước 12:00.",
      coverImage: "/img/vegetable-item-1.jpg",
      price: 280000,
      seats: 12,
      departureSchedule: "Sáng thứ 7, 07:30 tại ngã tư Củ Chi",
      destinations: [farmRau._id, farmUtTam._id],
      approvalStatus: "approved",
    },
    {
      business: tourBiz._id,
      title: "Tour chèo xuồng kênh rạch Bình Mỹ",
      durationType: "mot_ngay",
      startFrom: "tphcm",
      description: "Chèo xuồng tại vườn Cô Lan, đãi trái, trưa cơm cá đồng.",
      coverImage: "/img/banner-fruits.jpg",
      price: 590000,
      seats: 10,
      departureSchedule: "Chủ nhật, 07:30",
      destinations: [farmLan._id],
      approvalStatus: "approved",
    },
  ]);

  const vehicles = await Vehicle.create([
    {
      business: xeBiz._id,
      name: "Xe 4 chỗ đưa đón trung tâm TP – Bình Mỹ",
      vehicleType: "xe_4_cho",
      description: "Xe gia đình, tài xế biết đường ấp xã Bình Mỹ.",
      image: "/img/featur-1.jpg",
      price: 450000,
      priceUnit: "chuyến",
    },
    {
      business: xeBiz._id,
      name: "Xe 7 chỗ Củ Chi – Bình Mỹ",
      vehicleType: "xe_7_cho",
      description: "Phù hợp nhóm bạn / gia đình nhỏ, có ghế trẻ em theo yêu cầu.",
      image: "/img/featur-2.jpg",
      price: 650000,
      priceUnit: "chuyến",
    },
    {
      business: xeBiz._id,
      name: "Xe đưa đón nhóm 16 chỗ",
      vehicleType: "dua_don_nhom",
      description: "Đưa đón đoàn trải nghiệm, kết hợp tour vườn.",
      image: "/img/featur-3.jpg",
      price: 1800000,
      priceUnit: "chuyến",
    },
  ]);

  const now = new Date();
  await News.create([
    {
      author: admin._id,
      title: "Mùa sầu riêng Bình Mỹ: vườn Út Tám mở hái tại chỗ",
      category: "nong_nghiep",
      coverImage: "/img/fruite-item-1.jpg",
      content:
        "Tuần này sầu riêng Ri6 tại ấp 3 cho trái đều. Hộ Út Tám nhận khách cuối tuần, có thể hái tại vườn hoặc đặt giao nội thành qua Bình Mỹ Connect.",
      approvalStatus: "approved",
      publishedAt: new Date(now - 2 * 86400000),
    },
    {
      author: admin._id,
      title: "Ngày hội nông sản xã Bình Mỹ tháng này",
      category: "su_kien",
      coverImage: "/img/banner-fruits.jpg",
      content:
        "UBND xã phối hợp các hộ trưng bày rau hữu cơ, sữa tươi, mật ong. Khách nội thành có thể đi tour 1 ngày hoặc tự túc xe đưa đón trên nền tảng.",
      approvalStatus: "approved",
      publishedAt: new Date(now - 5 * 86400000),
    },
    {
      author: coLan._id,
      title: "Du lịch cộng đồng: chèo xuồng kênh ấp 4",
      category: "du_lich",
      coverImage: "/img/hero-img-2.jpg",
      content:
        "Vườn Cô Lan mở gói chèo xuồng + đãi trái. Doanh nghiệp tour có thể gửi đề nghị hợp tác đưa khách vào vườn ngay trên mục kết nối.",
      approvalStatus: "approved",
      publishedAt: new Date(now - 1 * 86400000),
    },
    {
      author: nhaMuoi._id,
      title: "Bản tin kỹ thuật: phòng sâu trên rau ăn lá (chờ duyệt)",
      category: "nong_nghiep",
      coverImage: "/img/vegetable-item-4.jpg",
      content: "Ghi chép kinh nghiệm nhà vườn, đang chờ admin duyệt trước khi hiện công khai.",
      approvalStatus: "pending",
    },
  ]);

  const [sauRieng, , rauMuong, , suaTuoi] = products;
  const [an, linh] = customers;

  const completedOrder = await Order.create({
    customer: an._id,
    farmer: utTam._id,
    farm: farmUtTam._id,
    items: [
      {
        product: sauRieng._id,
        name: sauRieng.name,
        price: sauRieng.price,
        unit: sauRieng.unit,
        quantity: 3,
      },
    ],
    total: sauRieng.price * 3,
    shippingAddress: "12 Nguyễn Huệ, Quận 1, TP.HCM",
    phone: an.phone,
    note: "Giao buổi chiều",
    status: "hoan_tat",
  });

  await Order.create({
    customer: linh._id,
    farmer: nhaMuoi._id,
    farm: farmRau._id,
    items: [
      {
        product: rauMuong._id,
        name: rauMuong.name,
        price: rauMuong.price,
        unit: rauMuong.unit,
        quantity: 5,
      },
    ],
    total: rauMuong.price * 5,
    shippingAddress: "45 Xô Viết Nghệ Tĩnh, Bình Thạnh",
    phone: linh.phone,
    status: "cho_xac_nhan",
  });

  await Order.create({
    customer: an._id,
    farmer: boSua._id,
    farm: farmBo._id,
    items: [
      {
        product: suaTuoi._id,
        name: suaTuoi.name,
        price: suaTuoi.price,
        unit: suaTuoi.unit,
        quantity: 2,
      },
    ],
    total: suaTuoi.price * 2,
    shippingAddress: "12 Nguyễn Huệ, Quận 1, TP.HCM",
    phone: an.phone,
    status: "dang_giao",
  });

  await ExperienceBooking.create({
    customer: linh._id,
    farm: farmLan._id,
    farmer: coLan._id,
    packageId: farmLan.packages[0]._id,
    packageName: farmLan.packages[0].name,
    date: new Date(now - 8 * 86400000),
    guests: 4,
    phone: linh.phone,
    total: farmLan.packages[0].price * 4,
    status: "hoan_tat",
  });

  await TourBooking.create({
    customer: an._id,
    tour: tours[0]._id,
    business: tourBiz._id,
    date: new Date(now - 10 * 86400000),
    guests: 2,
    phone: an.phone,
    total: tours[0].price * 2,
    status: "hoan_tat",
  });

  await TourBooking.create({
    customer: linh._id,
    tour: tours[1]._id,
    business: tourBiz._id,
    date: new Date(now + 3 * 86400000),
    guests: 3,
    phone: linh.phone,
    total: tours[1].price * 3,
    status: "cho_xac_nhan",
  });

  await VehicleBooking.create({
    customer: an._id,
    vehicle: vehicles[0]._id,
    business: xeBiz._id,
    pickupPoint: "Trung tâm TP.HCM (Quận 1)",
    dropoffPoint: "Xã Bình Mỹ, Củ Chi",
    pickupTime: new Date(now - 10 * 86400000),
    guests: 3,
    phone: an.phone,
    total: vehicles[0].price,
    status: "hoan_tat",
  });

  await Review.create([
    {
      author: an._id,
      targetType: "product",
      targetId: sauRieng._id,
      rating: 5,
      comment: "Sầu riêng chín cây, giao nhanh, đóng gói cẩn thận.",
    },
    {
      author: linh._id,
      targetType: "farm",
      targetId: farmLan._id,
      rating: 5,
      comment: "Chèo xuồng mát, cô Lan đãi trái nhiều, trẻ con thích.",
    },
    {
      author: an._id,
      targetType: "tour",
      targetId: tours[0]._id,
      rating: 4,
      comment: "Lịch trình vừa sức, cơm vườn ngon. Xe về hơi trễ một chút.",
    },
    {
      author: an._id,
      targetType: "vehicle",
      targetId: vehicles[0]._id,
      rating: 5,
      comment: "Tài xế đúng giờ, biết đường ấp, xe sạch.",
    },
  ]);

  await setTargetRating("product", sauRieng._id, Product);
  await setTargetRating("farm", farmLan._id, Farm);
  await setTargetRating("tour", tours[0]._id, Tour);
  await setTargetRating("vehicle", vehicles[0]._id, Vehicle);

  await Conversation.create({
    participants: [an._id, utTam._id],
    relatedType: "product",
    relatedId: sauRieng._id,
    lastMessageAt: now,
    messages: [
      { sender: an._id, text: "Chú ơi cuối tuần vườn còn sầu riêng Ri6 không ạ?" },
      { sender: utTam._id, text: "Còn cháu, đặt trên app hoặc nhắn số lượng chú để riêng." },
    ],
  });

  await Conversation.create({
    participants: [tourBiz._id, coLan._id],
    relatedType: "farm",
    relatedId: farmLan._id,
    lastMessageAt: now,
    messages: [
      { sender: tourBiz._id, text: "Cô ơi đoàn 12 khách chủ nhật, vườn nhận cơm trưa được không?" },
      { sender: coLan._id, text: "Được, cô nấu cá đồng, gửi đề nghị hợp tác trên hệ thống giúp cô chốt." },
    ],
  });

  await Partnership.create([
    {
      business: tourBiz._id,
      farmer: coLan._id,
      farm: farmLan._id,
      type: "dua_khach_vao_vuon",
      message: "Đề nghị đưa khách tour 1 ngày vào vườn mỗi chủ nhật, 10–16 khách, có cơm vườn.",
      status: "chap_nhan",
    },
    {
      business: tourBiz._id,
      farmer: utTam._id,
      farm: farmUtTam._id,
      type: "bao_tieu",
      message: "Bao tiêu sầu riêng Ri6 vụ này, thu mua tại vườn mỗi thứ 6.",
      status: "cho_phan_hoi",
    },
  ]);

  an.cart = [{ product: products[2]._id, quantity: 3 }];
  await an.save();

  console.log("Đã seed dữ liệu mẫu Bình Mỹ Connect");
  console.log("Tài khoản thử (mật khẩu 123456, admin là admin123):");
  console.log("- Admin     admin@binhmyconnect.vn / admin123");
  console.log("- Khách     an.nguyen@gmail.com");
  console.log("- Nông dân  uttam@binhmyconnect.vn");
  console.log("- Doanh nghiệp tour  mietvuon@binhmyconnect.vn");
  console.log("- Xe        xebinhmy@binhmyconnect.vn");
  console.log("Đơn mẫu hoàn tất:", completedOrder._id.toString());

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
