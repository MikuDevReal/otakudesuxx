// lib/home.js
const { jikanGet, mapAnime } = require('./jikanClient');

async function getHome() {
  const [ongoing, popular] = await Promise.all([
    jikanGet('/seasons/now', { limit: 20 }),
    jikanGet('/anime', { status: 'complete', order_by: 'popularity', sort: 'asc', limit: 20 }),
  ]);

  return {
    ongoing: { animeList: (ongoing.data ?? []).map(mapAnime) },
    completed: { animeList: (popular.data ?? []).map(mapAnime) },
  };
}

module.exports = { getHome };
