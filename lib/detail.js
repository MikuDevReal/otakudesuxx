// lib/detail.js
const { jikanGet, mapAnime } = require('./jikanClient');

// id = MyAnimeList ID (angka), diambil dari field "animeId" hasil endpoint lain.
async function getAnimeDetail(id) {
  const data = await jikanGet(`/anime/${id}/full`);
  const a = data.data;
  if (!a) throw new Error('Anime tidak ditemukan');

  return {
    ...mapAnime(a),
    trailerUrl: a.trailer?.url ?? null,
    studios: (a.studios ?? []).map((s) => s.name),
    duration: a.duration ?? null,
    rating: a.rating ?? null,
    background: a.background ?? null,
    airedString: a.aired?.string ?? null,
    // Catatan penting: Jikan hanya menyediakan METADATA resmi dari
    // MyAnimeList, BUKAN link video. Untuk pemutaran, arahkan pengguna ke
    // platform berlisensi (mis. Crunchyroll, Muse Indonesia, Netflix, dll)
    // -- jangan sambungkan endpoint ini ke sumber streaming tidak resmi.
    streamingNote: 'Endpoint ini hanya menyediakan info anime, bukan video. Integrasikan tombol "Tonton" ke platform streaming legal secara terpisah.',
  };
}

module.exports = { getAnimeDetail };
