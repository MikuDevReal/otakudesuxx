// lib/lists.js
const { jikanGet, mapAnime } = require('./jikanClient');

// Daftar genre resmi MyAnimeList -- ID & nama ini sudah stabil bertahun-tahun
// dan hampir tidak pernah berubah, jadi aman dipakai sebagai fallback statis
// kalau live call ke Jikan gagal (supaya tombol "Genre" tidak pernah blank).
const GENRE_SEED = [
  { genreId: '1', title: 'Action' }, { genreId: '2', title: 'Adventure' },
  { genreId: '4', title: 'Comedy' }, { genreId: '8', title: 'Drama' },
  { genreId: '10', title: 'Fantasy' }, { genreId: '14', title: 'Horror' },
  { genreId: '7', title: 'Mystery' }, { genreId: '22', title: 'Romance' },
  { genreId: '24', title: 'Sci-Fi' }, { genreId: '36', title: 'Slice of Life' },
  { genreId: '30', title: 'Sports' }, { genreId: '37', title: 'Supernatural' },
  { genreId: '41', title: 'Thriller' }, { genreId: '27', title: 'Shounen' },
  { genreId: '42', title: 'Seinen' }, { genreId: '18', title: 'Mecha' },
];

async function getOngoing(page = 1) {
  try {
    const data = await jikanGet('/seasons/now', { page });
    return { animeList: (data.data ?? []).map(mapAnime), pagination: data.pagination ?? null };
  } catch (e) {
    console.warn('getOngoing gagal:', e.message);
    return { animeList: [], pagination: null, _note: 'Jikan sedang tidak bisa diakses, coba lagi nanti.' };
  }
}

async function getComplete(page = 1) {
  try {
    const data = await jikanGet('/anime', { status: 'complete', order_by: 'popularity', sort: 'asc', page });
    return { animeList: (data.data ?? []).map(mapAnime), pagination: data.pagination ?? null };
  } catch (e) {
    console.warn('getComplete gagal:', e.message);
    return { animeList: [], pagination: null, _note: 'Jikan sedang tidak bisa diakses, coba lagi nanti.' };
  }
}

async function getGenreList() {
  try {
    const data = await jikanGet('/genres/anime');
    return (data.data ?? []).map((g) => ({ genreId: String(g.mal_id), title: g.name, count: g.count }));
  } catch (e) {
    console.warn('getGenreList gagal, pakai GENRE_SEED:', e.message);
    return GENRE_SEED;
  }
}

// genreId = angka ID genre dari getGenreList(), BUKAN slug teks
async function getByGenre(genreId, page = 1) {
  const data = await jikanGet('/anime', { genres: genreId, page });
  return { animeList: (data.data ?? []).map(mapAnime), pagination: data.pagination ?? null };
}

// Pengganti "unlimited": daftar anime paling populer sepanjang masa
async function getTopAnime(page = 1) {
  try {
    const data = await jikanGet('/top/anime', { page });
    return { animeList: (data.data ?? []).map(mapAnime), pagination: data.pagination ?? null };
  } catch (e) {
    console.warn('getTopAnime gagal:', e.message);
    return { animeList: [], pagination: null, _note: 'Jikan sedang tidak bisa diakses, coba lagi nanti.' };
  }
}

module.exports = { getOngoing, getComplete, getGenreList, getByGenre, getTopAnime };
