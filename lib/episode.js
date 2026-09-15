// lib/episode.js
const { jikanGet } = require('./jikanClient');

function mapEpisode(e) {
  return {
    number: e.mal_id,
    title: e.title ?? null,
    titleJapanese: e.title_japanese ?? null,
    aired: e.aired ?? null,
    score: e.score ?? null,
    filler: e.filler ?? false,
    recap: e.recap ?? false,
    forumUrl: e.forum_url ?? null,
  };
}

// Daftar semua episode (metadata saja -- judul episode, tanggal tayang, dst)
async function getEpisodeList(id, page = 1) {
  const data = await jikanGet(`/anime/${id}/episodes`, { page });
  return {
    episodes: (data.data ?? []).map(mapEpisode),
    pagination: data.pagination ?? null,
  };
}

// Detail 1 episode tertentu
async function getEpisodeDetail(id, episodeNumber) {
  const data = await jikanGet(`/anime/${id}/episodes/${episodeNumber}`);
  if (!data.data) throw new Error('Episode tidak ditemukan');
  return mapEpisode(data.data);
}

module.exports = { getEpisodeList, getEpisodeDetail };
