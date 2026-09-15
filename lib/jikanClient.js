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
  // Beberapa layanan (termasuk yang di belakang Cloudflare) memperlakukan
  // request tanpa User-Agent yang jelas (mis. default "axios/x.x" dari
  // datacenter/serverless IP seperti Vercel) lebih ketat / gampang kena
  // limit dibanding request dari browser biasa. Header di bawah membuat
  // request kita terlihat seperti browser normal.
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    Accept: 'application/json',
  },
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

// Cache sederhana di memory (per instance serverless).
// Tujuannya: kalau Jikan lagi down/504/timeout, kita masih bisa
// menyajikan data lama daripada langsung error total ke user.
const CACHE_TTL_MS = 5 * 60 * 1000; // data "segar" dianggap valid 5 menit
const cache = new Map(); // key -> { data, timestamp }

function cacheKey(path, params) {
  return `${path}?${JSON.stringify(params)}`;
}

async function jikanGet(path, params = {}, attempt = 1) {
  const key = cacheKey(path, params);
  const cached = cache.get(key);

  // Data masih segar -> langsung pakai, tidak perlu nembak Jikan lagi.
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  await throttle();
  try {
    const res = await client.get(path, { params });
    cache.set(key, { data: res.data, timestamp: Date.now() });
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    // Retry untuk rate-limit (429) maupun error server Jikan (5xx, termasuk 504).
    if ((status === 429 || status >= 500) && attempt <= 4) {
      await new Promise((r) => setTimeout(r, 500 * attempt));
      return jikanGet(path, params, attempt + 1);
    }
    // Kalau masih ada data lama di cache (walau sudah "basi"), lebih baik
    // pakai itu daripada gagal total -- terutama saat Jikan lagi down.
    if (cached) {
      console.warn(`Jikan gagal (${status ?? err.message}), pakai cache basi untuk ${key}`);
      return cached.data;
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
