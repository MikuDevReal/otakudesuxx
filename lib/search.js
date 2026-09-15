// lib/search.js
const { jikanGet, mapAnime } = require('./jikanClient');

async function searchAnime(query, page = 1) {
  const data = await jikanGet('/anime', { q: query, page, limit: 20 });
  return {
    animeList: (data.data ?? []).map(mapAnime),
    pagination: data.pagination ?? null,
  };
}

module.exports = { searchAnime };
