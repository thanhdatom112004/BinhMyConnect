const TZ = "Asia/Ho_Chi_Minh";
const ACTIVE = ["cho_xac_nhan", "da_xac_nhan"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function vnParts(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  const weekday = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[get("weekday")];
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday,
  };
}

function vnDate(year, month, day, hour, minute) {
  return new Date(`${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+07:00`);
}

function addDays(year, month, day, days) {
  const base = vnDate(year, month, day, 12, 0);
  const next = new Date(base.getTime() + days * 86400000);
  const p = vnParts(next);
  return { year: p.year, month: p.month, day: p.day };
}

function parseWeekdays(text) {
  const raw = String(text || "");
  const found = new Set();
  if (/chủ\s*nhật/i.test(raw) || /\bcn\b/i.test(raw)) found.add(0);
  const block = raw.match(/thứ\s*([2-7](?:\s*[,&]\s*[2-7])*)/i);
  if (block) {
    for (const n of block[1].match(/[2-7]/g) || []) {
      const num = Number(n);
      found.add(num === 7 ? 6 : num - 1);
    }
  }
  return found.size ? [...found] : null;
}

function parseOpenHours(text) {
  const raw = String(text || "");
  const match = raw.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const open = Number(match[1]) * 60 + Number(match[2]);
  const close = Number(match[3]) * 60 + Number(match[4]);
  return {
    open,
    close,
    weekdays: parseWeekdays(raw),
    label: `${pad(match[1])}:${match[2]} - ${pad(match[3])}:${match[4]}`,
  };
}

function inferDepartures(text, durationType) {
  const match = String(text || "").match(/(\d{1,2}):(\d{2})/);
  const time = match ? `${pad(match[1])}:${match[2]}` : durationType === "nua_ngay" ? "07:30" : "07:00";
  const weekdays = parseWeekdays(text) || [6, 0];
  return weekdays.map((weekday) => ({ weekday, time }));
}

function durationMinutes(tour) {
  if (tour && tour.durationMinutes) return tour.durationMinutes;
  return tour && tour.durationType === "nua_ngay" ? 240 : 480;
}

function listDepartures(tour, days, fromDate) {
  const departures = tour.departures && tour.departures.length ? tour.departures : inferDepartures(tour.departureSchedule, tour.durationType);
  const minutes = durationMinutes(tour);
  const startFrom = fromDate ? new Date(fromDate) : new Date();
  const origin = vnParts(startFrom);
  const slots = [];
  for (let i = 0; i < days; i += 1) {
    const day = addDays(origin.year, origin.month, origin.day, i);
    const noon = vnDate(day.year, day.month, day.day, 12, 0);
    const weekday = vnParts(noon).weekday;
    for (const slot of departures) {
      if (slot.weekday !== weekday) continue;
      const [hour, minute] = String(slot.time).split(":").map(Number);
      const start = vnDate(day.year, day.month, day.day, hour, minute);
      if (start.getTime() <= Date.now()) continue;
      const end = new Date(start.getTime() + minutes * 60000);
      slots.push({ start, end, label: formatWhen(start) });
    }
  }
  return slots;
}

function formatWhen(date) {
  return new Date(date).toLocaleString("vi-VN", {
    timeZone: TZ,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseVnInput(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) return null;
  return vnDate(Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4]), Number(match[5]));
}

function combineDateTime(dateStr, timeStr) {
  const dateMatch = String(dateStr || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(timeStr || "").match(/^(\d{1,2}):(\d{2})/);
  if (!dateMatch || !timeMatch) return null;
  return vnDate(Number(dateMatch[1]), Number(dateMatch[2]), Number(dateMatch[3]), Number(timeMatch[1]), Number(timeMatch[2]));
}

function assertWithinOpenHours(openHoursText, start, end) {
  const rule = parseOpenHours(openHoursText);
  if (!rule) {
    const err = new Error("Vườn chưa có giờ mở cửa cố định. Hãy chọn giờ khác hoặc liên hệ chủ vườn.");
    err.status = 400;
    throw err;
  }
  const startParts = vnParts(start);
  const endParts = vnParts(end);
  if (rule.weekdays && !rule.weekdays.includes(startParts.weekday)) {
    const err = new Error(`Vườn không mở cửa ngày này (${openHoursText}). Hãy chọn ngày khác.`);
    err.status = 400;
    throw err;
  }
  const startMin = startParts.hour * 60 + startParts.minute;
  const endMin = endParts.hour * 60 + endParts.minute;
  const sameDay = startParts.year === endParts.year && startParts.month === endParts.month && startParts.day === endParts.day;
  if (!sameDay || startMin < rule.open || endMin > rule.close) {
    const err = new Error(`Giờ này ngoài giờ mở cửa (${rule.label}). Hãy đặt giờ khác.`);
    err.status = 400;
    throw err;
  }
}

module.exports = {
  ACTIVE,
  TZ,
  parseWeekdays,
  parseOpenHours,
  inferDepartures,
  durationMinutes,
  listDepartures,
  formatWhen,
  parseVnInput,
  combineDateTime,
  assertWithinOpenHours,
  vnParts,
};
