const pad2 = (n) => String(n).padStart(2, "0");

// Returns array like ["06:00","07:00",...,"22:00"] (start times)
exports.generateStartTimes = ({ openHour = 6, closeHour = 23 } = {}) => {
  const starts = [];
  for (let h = openHour; h < closeHour; h += 1) {
    starts.push(`${pad2(h)}:00`);
  }
  return starts;
};

exports.addOneHour = (hhmm) => {
  const [hh] = hhmm.split(":").map((x) => Number.parseInt(x, 10));
  const next = hh + 1;
  return `${pad2(next)}:00`;
};

exports.isWeekend = (dateObj) => {
  const d = dateObj.getDay(); // 0 Sun ... 6 Sat
  return d === 0 || d === 6;
};

exports.parseISODateOnly = (yyyyMmDd) => {
  // Interprets as local date at 00:00:00
  const [y, m, d] = yyyyMmDd.split("-").map((x) => Number.parseInt(x, 10));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
};

