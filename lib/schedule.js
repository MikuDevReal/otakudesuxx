// lib/schedule.js
const { jikanGet, mapAnime } = require('./jikanClient');

// day (opsional): monday, tuesday, wednesday, thursday, friday, saturday,
// sunday, unknown. Kalau kosong, Jikan balikin jadwal semua hari.
async function getSchedule(day) {
  try {
    const data = await jikanGet('/schedules', day ? { filter: day } : {});
    return { animeList: (data.data ?? []).map(mapAnime), pagination: data.pagination ?? null };
  } catch (e) {
    console.warn('getSchedule gagal:', e.message);
    return { animeList: [], pagination: null, _note: 'Jikan sedang tidak bisa diakses, coba lagi nanti.' };
  }
}

module.exports = { getSchedule };
