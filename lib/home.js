const { getPage } = require('./scraper');
const { parseAnimeGrid } = require('./parseList');

// Otakudesu tidak punya satu halaman "home" berisi ongoing + complete sekaligus,
// jadi kita ambil dari dua halaman resminya lalu digabung ke satu bentuk JSON
// yang dipakai app: { ongoing: { animeList }, completed: { animeList } }
async function getHome() {
  const [$ongoing, $complete] = await Promise.all([
    getPage('/ongoing-anime/'),
    getPage('/complete-anime/'),
  ]);

  return {
    ongoing: { animeList: parseAnimeGrid($ongoing) },
    completed: { animeList: parseAnimeGrid($complete) },
  };
}

module.exports = { getHome };
