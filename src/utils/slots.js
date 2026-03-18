const pad2 = (n) => String(n).padStart(2, "0");

// Generate start times: ["06:00", ..., "22:00"]
exports.generateStartTimes = ({ openHour = 6, closeHour = 23 } = {}) => {
  const starts = [];
  for (let h = openHour; h < closeHour; h += 1) {
    starts.push(`${pad2(h)}:00`);
  }
  return starts;
};

exports.addOneHour = (hhmm) => {
  const [hh] = hhmm.split(":").map(Number);
  return `${pad2(hh + 1)}:00`;
};

exports.isWeekend = (dateObj) => {
  const d = dateObj.getDay();
  return d === 0 || d === 6;
};

exports.parseISODateOnly = (yyyyMmDd) => {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

exports.formatDate = (date) => {
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
};