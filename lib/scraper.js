const axios = require('axios');
const cheerio = require('cheerio');

// Domain sumber. Kalau domain otakudesu berubah suatu saat nanti,
// cukup ganti nilai ini (atau set environment variable BASE_URL di Vercel),
// tidak perlu ubah kode scraping di file lain.
const BASE_URL = process.env.BASE_URL || 'https://otakudesu.blog';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  },
});

/**
 * Ambil HTML dari path relatif terhadap BASE_URL dan langsung load ke cheerio.
 * @param {string} path
 * @param {object} [params]
 */
async function getPage(path, params) {
  const res = await client.get(path, { params });
  return cheerio.load(res.data);
}

/**
 * Bersihkan whitespace berlebih pada teks hasil scraping.
 */
function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

/**
 * Ambil slug dari URL otakudesu, misal
 * https://otakudesu.cloud/anime/judul-sub-indo/ -> judul-sub-indo
 */
function slugFromUrl(url, segment) {
  if (!url) return '';
  const parts = url.split('/').filter(Boolean);
  const idx = segment ? parts.indexOf(segment) : -1;
  if (segment && idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  return parts[parts.length - 1] || '';
}

module.exports = { BASE_URL, client, getPage, clean, slugFromUrl };
