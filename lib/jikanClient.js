// lib/jikanClient.js
// Klien untuk Jikan API v4 (https://jikan.moe) -- wrapper REST GRATIS dan
// TIDAK RESMI untuk data publik MyAnimeList (metadata saja: judul, poster,
// sinopsis, skor, genre, jadwal, dst). TIDAK menyediakan link video/streaming.
//
// Docs: https://docs.api.jikan.moe/
const axios = require('axios');

const BASE_URL = process.env.JIKAN_BASE_URL || 'https://api.jikan.moe/v4';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Jikan membatasi ~3 request/detik & ~60 request/menit per IP.
// Antrian sederhana ini menjaga jarak antar-request supaya nggak kena 429.
const MIN_INTERVAL_MS = 400;
let queue = Promise.resolve();

function throttle() {
  const gate = queue.then(() => new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS)));
  queue = gate;
  return gate;
}

async function jikanGet(path, params = {}, attempt = 1) {
  await throttle();
  try {
    const res = await client.get(path, { params });
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 429 && attempt <= 3) {
      await new Promise((r) => setTimeout(r, 800 * attempt));
      return jikanGet(path, params, attempt + 1);
    }
    throw err;
  }
}

// Ubah 1 objek anime dari Jikan jadi bentuk ringkas & konsisten yang
// dipakai di seluruh endpoint API ini.
function mapAnime(a) {
  if (!a) return null;
  return {
    animeId: a.mal_id != null ? String(a.mal_id) : '',
    title: a.title ?? a.title_english ?? '',
    titleEnglish: a.title_english ?? null,
    poster: a.images?.jpg?.large_image_url ?? a.images?.jpg?.image_url ?? '',
    episodes: a.episodes ?? null,
    score: a.score ?? null,
    status: a.status ?? null,
    type: a.type ?? null,
    year: a.year ?? (a.aired?.from ? new Date(a.aired.from).getFullYear() : null),
    synopsis: a.synopsis ?? '',
    genres: (a.genres ?? []).map((g) => g.name),
    url: a.url ?? '',
  };
}

module.exports = { jikanGet, mapAnime };
