// lib/home.js
const { jikanGet, mapAnime } = require('./jikanClient');

async function getHome() {
  // Berurutan (bukan Promise.all) supaya tidak nembak 2 request sekaligus
  // ke Jikan -- lebih ramah ke rate limit & mengurangi risiko 504.
  const ongoing = await jikanGet('/seasons/now', { limit: 20 });
  const popular = await jikanGet('/anime', { status: 'complete', order_by: 'popularity', sort: 'asc', limit: 20 });

  return {
    ongoing: { animeList: (ongoing.data ?? []).map(mapAnime) },
    completed: { animeList: (popular.data ?? []).map(mapAnime) },
  };
}

module.exports = { getHome };
