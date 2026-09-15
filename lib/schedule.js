// lib/schedule.js
const { jikanGet, mapAnime } = require('./jikanClient');

// day (opsional): monday, tuesday, wednesday, thursday, friday, saturday,
// sunday, unknown. Kalau kosong, Jikan balikin jadwal semua hari.
async function getSchedule(day) {
  const data = await jikanGet('/schedules', day ? { filter: day } : {});
  return { animeList: (data.data ?? []).map(mapAnime), pagination: data.pagination ?? null };
}

module.exports = { getSchedule };
