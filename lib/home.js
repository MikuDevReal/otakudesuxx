// lib/home.js
const fs = require('fs');
const path = require('path');
const { jikanGet, mapAnime } = require('./jikanClient');

// Data cadangan statis, dipakai HANYA kalau live call ke Jikan gagal total
// (setelah retry) dan tidak ada cache in-memory yang bisa dipakai --
// misalnya saat MyAnimeList sedang menolak koneksi dari Jikan.
const seedPath = path.join(__dirname, '..', 'data', 'homeSeed.json');
let homeSeed = null;
try {
  homeSeed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
} catch (e) {
  console.warn('Gagal load homeSeed.json:', e.message);
}

async function getHome() {
  try {
    // Berurutan (bukan Promise.all) supaya tidak nembak 2 request sekaligus
    // ke Jikan -- lebih ramah ke rate limit & mengurangi risiko 504.
    const ongoing = await jikanGet('/seasons/now', { limit: 20 });
    const popular = await jikanGet('/anime', { status: 'complete', order_by: 'popularity', sort: 'asc', limit: 20 });

    return {
      ongoing: { animeList: (ongoing.data ?? []).map(mapAnime) },
      completed: { animeList: (popular.data ?? []).map(mapAnime) },
    };
  } catch (err) {
    // Live call + retry + cache semuanya gagal -- daripada error total,
    // tampilkan data cadangan statis (kalau ada) supaya app tidak blank.
    if (homeSeed) {
      console.warn('getHome() gagal, pakai homeSeed.json:', err.message);
      return homeSeed;
    }
    throw err;
  }
}

module.exports = { getHome };
