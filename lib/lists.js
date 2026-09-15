// lib/lists.js
const { jikanGet, mapAnime } = require('./jikanClient');

async function getOngoing(page = 1) {
  const data = await jikanGet('/seasons/now', { page });
  return { animeList: (data.data ?? []).map(mapAnime), pagination: data.pagination ?? null };
}

async function getComplete(page = 1) {
  const data = await jikanGet('/anime', { status: 'complete', order_by: 'popularity', sort: 'asc', page });
  return { animeList: (data.data ?? []).map(mapAnime), pagination: data.pagination ?? null };
}

async function getGenreList() {
  const data = await jikanGet('/genres/anime');
  return (data.data ?? []).map((g) => ({ genreId: String(g.mal_id), title: g.name, count: g.count }));
}

// genreId = angka ID genre dari getGenreList(), BUKAN slug teks
async function getByGenre(genreId, page = 1) {
  const data = await jikanGet('/anime', { genres: genreId, page });
  return { animeList: (data.data ?? []).map(mapAnime), pagination: data.pagination ?? null };
}

// Pengganti "unlimited": daftar anime paling populer sepanjang masa
async function getTopAnime(page = 1) {
  const data = await jikanGet('/top/anime', { page });
  return { animeList: (data.data ?? []).map(mapAnime), pagination: data.pagination ?? null };
}

module.exports = { getOngoing, getComplete, getGenreList, getByGenre, getTopAnime };
