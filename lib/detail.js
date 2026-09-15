// lib/detail.js
const { jikanGet, mapAnime } = require('./jikanClient');

// id = MyAnimeList ID (angka), diambil dari field "animeId" hasil endpoint lain.
async function getAnimeDetail(id) {
  const data = await jikanGet(`/anime/${id}/full`);
  const a = data.data;
  if (!a) throw new Error('Anime tidak ditemukan');

  const base = mapAnime(a);

  // Ambil daftar episode (metadata saja, tanpa link video) -- dibungkus
  // try/catch sendiri supaya kalau gagal/kosong, detail anime tetap tampil.
  let episodeList = [];
  try {
    const eps = await jikanGet(`/anime/${id}/episodes`, { page: 1 });
    episodeList = (eps.data ?? []).map((e) => ({
      episodeId: String(e.mal_id),
      eps: e.mal_id,
      title: e.title || `Episode ${e.mal_id}`,
    }));
  } catch (e) {
    console.warn(`Gagal ambil episode utk anime ${id}:`, e.message);
  }

  // Rekomendasi anime terkait -- juga dibungkus try/catch tersendiri.
  let recommendedAnimeList = [];
  try {
    const recs = await jikanGet(`/anime/${id}/recommendations`);
    recommendedAnimeList = (recs.data ?? []).slice(0, 12).map((r) => ({
      animeId: r.entry?.mal_id != null ? String(r.entry.mal_id) : '',
      title: r.entry?.title ?? '',
      poster: r.entry?.images?.jpg?.large_image_url ?? r.entry?.images?.jpg?.image_url ?? '',
    }));
  } catch (e) {
    console.warn(`Gagal ambil rekomendasi utk anime ${id}:`, e.message);
  }

  return {
    ...base,
    // Field di bawah sengaja mengikuti bentuk yang dipakai UI Flutter kamu
    // (bukan bentuk default Jikan), supaya tidak perlu ubah kode Flutter.
    japanese: a.title_japanese ?? null,
    aired: a.aired?.string ?? null,
    studios: (a.studios ?? []).map((s) => s.name).join(', ') || null,
    genreList: (a.genres ?? []).map((g) => ({ genreId: String(g.mal_id), title: g.name })),
    synopsis: { paragraphs: base.synopsis ? [base.synopsis] : [] },
    episodeList,
    recommendedAnimeList,
    trailerUrl: a.trailer?.url ?? null,
    duration: a.duration ?? null,
    rating: a.rating ?? null,
    background: a.background ?? null,
    // Catatan penting: Jikan hanya menyediakan METADATA resmi dari
    // MyAnimeList, BUKAN link video. Field episodeList di atas TIDAK berisi
    // link streaming apa pun -- tombol "Tonton" perlu diarahkan ke platform
    // legal (Crunchyroll, Muse Indonesia, Netflix, dll), bukan ke sumber
    // streaming tidak resmi.
    streamingNote: 'Endpoint ini hanya menyediakan info anime & judul episode, bukan video. Integrasikan tombol "Tonton" ke platform streaming legal secara terpisah.',
  };
}

module.exports = { getAnimeDetail };
