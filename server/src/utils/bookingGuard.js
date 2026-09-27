const { ExperienceBooking, TourBooking, VehicleBooking } = require("../models/Booking");
const { ApiError } = require("./apiError");
const { ACTIVE, formatWhen } = require("./schedule");

function overlapQuery(start, end, extra) {
  return {
    ...extra,
    status: { $in: ACTIVE },
    startAt: { $lt: end },
    endAt: { $gt: start },
  };
}

function conflictLabel(hit, kind) {
  if (kind === "tour") return (hit.tour && hit.tour.title) || "một tour";
  if (kind === "vehicle") return (hit.vehicle && hit.vehicle.name) || "một chuyến xe";
  const farm = hit.farm && hit.farm.name ? hit.farm.name : "nông trại";
  return `${hit.packageName || "trải nghiệm"} tại ${farm}`;
}

async function assertCustomerFree(customerId, start, end) {
  const query = overlapQuery(start, end, { customer: customerId });
  const [experience, tour, vehicle] = await Promise.all([
    ExperienceBooking.findOne(query).populate("farm", "name"),
    TourBooking.findOne(query).populate("tour", "title"),
    VehicleBooking.findOne(query).populate("vehicle", "name"),
  ]);
  const hit = experience || tour || vehicle;
  if (!hit) return;
  const kind = experience ? "experience" : tour ? "tour" : "vehicle";
  const when = formatWhen(hit.startAt || hit.date || hit.pickupTime);
  throw new ApiError(
    400,
    `Bạn đã có lịch trùng giờ: ${conflictLabel(hit, kind)} (${when}). Hãy hủy lịch đó trong tài khoản hoặc chọn giờ khác.`
  );
}

async function assertTourSeats(tour, start, guests) {
  const windowStart = new Date(start.getTime() - 60000);
  const windowEnd = new Date(start.getTime() + 60000);
  const rows = await TourBooking.find({
    tour: tour._id,
    status: { $in: ACTIVE },
    startAt: { $gte: windowStart, $lte: windowEnd },
  }).select("guests");
  const taken = rows.reduce((sum, row) => sum + (row.guests || 0), 0);
  const left = tour.seats - taken;
  if (guests > left) {
    throw new ApiError(
      400,
      left > 0
        ? `Chuyến này chỉ còn ${left} chỗ. Hãy giảm số khách hoặc chọn giờ khác.`
        : "Chuyến này đã đủ chỗ. Hãy chọn giờ khác."
    );
  }
}

async function assertVehicleFree(vehicleId, start, end) {
  const hit = await VehicleBooking.findOne(overlapQuery(start, end, { vehicle: vehicleId }));
  if (hit) {
    throw new ApiError(400, `Xe này đã có chuyến trùng giờ (${formatWhen(hit.startAt || hit.pickupTime)}). Hãy chọn giờ khác.`);
  }
}

module.exports = { assertCustomerFree, assertTourSeats, assertVehicleFree };
