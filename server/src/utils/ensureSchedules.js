const Tour = require("../models/Tour");
const Vehicle = require("../models/Vehicle");
const Farm = require("../models/Farm");
const { ExperienceBooking, TourBooking, VehicleBooking } = require("../models/Booking");
const { inferDepartures, durationMinutes, listDepartures } = require("./schedule");

const VEHICLE_SEATS = { xe_4_cho: 4, xe_7_cho: 7, dua_don_nhom: 16 };
const VEHICLE_MINUTES = { xe_4_cho: 180, xe_7_cho: 180, dua_don_nhom: 240 };

async function ensureSchedules() {
  const tours = await Tour.find();
  for (const tour of tours) {
    let changed = false;
    if (!tour.departures || !tour.departures.length) {
      tour.departures = inferDepartures(tour.departureSchedule, tour.durationType);
      changed = true;
    }
    if (!tour.durationMinutes) {
      tour.durationMinutes = durationMinutes(tour);
      changed = true;
    }
    if (changed) await tour.save();
  }

  const vehicles = await Vehicle.find();
  for (const vehicle of vehicles) {
    let changed = false;
    const expectedSeats = VEHICLE_SEATS[vehicle.vehicleType] || 4;
    const expectedMinutes = VEHICLE_MINUTES[vehicle.vehicleType] || 180;
    if (vehicle.seats !== expectedSeats) {
      vehicle.seats = expectedSeats;
      changed = true;
    }
    if (vehicle.durationMinutes !== expectedMinutes) {
      vehicle.durationMinutes = expectedMinutes;
      changed = true;
    }
    if (changed) await vehicle.save();
  }

  const tourMap = new Map(tours.map((tour) => [String(tour._id), tour]));
  const tourBookings = await TourBooking.find({ $or: [{ startAt: null }, { startAt: { $exists: false } }] });
  for (const booking of tourBookings) {
    const tour = tourMap.get(String(booking.tour));
    const minutes = tour ? durationMinutes(tour) : 480;
    let start = booking.date ? new Date(booking.date) : new Date();
    if (tour && ["cho_xac_nhan", "da_xac_nhan"].includes(booking.status)) {
      const slots = listDepartures(tour, 45, start);
      if (slots[0]) start = slots[0].start;
    }
    booking.startAt = start;
    booking.endAt = new Date(start.getTime() + minutes * 60000);
    booking.date = start;
    await booking.save();
  }

  const vehicleMap = new Map(vehicles.map((vehicle) => [String(vehicle._id), vehicle]));
  const vehicleBookings = await VehicleBooking.find({ $or: [{ startAt: null }, { startAt: { $exists: false } }] });
  for (const booking of vehicleBookings) {
    const vehicle = vehicleMap.get(String(booking.vehicle));
    const minutes = (vehicle && vehicle.durationMinutes) || 180;
    const start = booking.pickupTime ? new Date(booking.pickupTime) : new Date();
    booking.startAt = start;
    booking.endAt = new Date(start.getTime() + minutes * 60000);
    await booking.save();
  }

  const farms = await Farm.find();
  const packageMinutes = new Map();
  farms.forEach((farm) => {
    (farm.packages || []).forEach((pkg) => {
      packageMinutes.set(String(pkg._id), pkg.durationMinutes || 120);
    });
  });
  const experiences = await ExperienceBooking.find({ $or: [{ startAt: null }, { startAt: { $exists: false } }] });
  for (const booking of experiences) {
    const minutes = packageMinutes.get(String(booking.packageId)) || 120;
    const start = booking.date ? new Date(booking.date) : new Date();
    booking.startAt = start;
    booking.endAt = new Date(start.getTime() + minutes * 60000);
    await booking.save();
  }
}

module.exports = { ensureSchedules };
