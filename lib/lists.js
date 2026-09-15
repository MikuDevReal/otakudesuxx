const { getPage, clean, slugFromUrl } = require('./scraper');
const { parseAnimeGrid, parsePagination } = require('./parseList');

async function getOngoing(page = 1) {
  const path = page > 1 ? `/ongoing-anime/page/${page}/` : '/ongoing-anime/';
  const $ = await getPage(path);
  return { animeList: parseAnimeGrid($), pagination: parsePagination($) };
}

async function getComplete(page = 1) {
  const path = page > 1 ? `/complete-anime/page/${page}/` : '/complete-anime/';
  const $ = await getPage(path);
  return { animeList: parseAnimeGrid($), pagination: parsePagination($) };
}

async function getGenreList() {
  const $ = await getPage('/genre-list/');
  const genres = [];
  $('.genres li a, .genre-list li a, ul.genres li a').each((_, el) => {
    const href = $(el).attr('href') || '';
    genres.push({
      genreId: slugFromUrl(href, 'genres'),
      title: clean($(el).text()),
      url: href,
    });
  });
  return genres;
}

async function getByGenre(slug, page = 1) {
  const path = page > 1 ? `/genres/${slug}/page/${page}/` : `/genres/${slug}/`;
  const $ = await getPage(path);
  return { animeList: parseAnimeGrid($), pagination: parsePagination($) };
}

// Daftar semua anime, dikelompokkan per abjad (#, A, B, C, ...)
// sesuai bentuk yang dipakai app: data.list = [{ animeList: [...] }, ...]
async function getUnlimitedList() {
  const $ = await getPage('/anime-list/');
  const groups = [];

  $('.bariskelom, .daftarkelom, .warna1').each((_, groupEl) => {
    const animeList = [];
    $(groupEl)
      .find('a')
      .each((__, a) => {
        const href = $(a).attr('href') || '';
        const title = clean($(a).text());
        if (!title || !href.includes('/anime/')) return;
        animeList.push({
          animeId: slugFromUrl(href, 'anime'),
          title,
          url: href,
        });
      });
    if (animeList.length) groups.push({ animeList });
  });

  // Fallback kalau markup halaman berbeda dari yang diperkirakan:
  // ambil semua link /anime/ di halaman jadi satu grup saja.
  if (!groups.length) {
    const animeList = [];
    $('a[href*="/anime/"]').each((_, a) => {
      const href = $(a).attr('href') || '';
      const title = clean($(a).text());
      if (!title) return;
      animeList.push({ animeId: slugFromUrl(href, 'anime'), title, url: href });
    });
    if (animeList.length) groups.push({ animeList });
  }

  return { list: groups };
}

module.exports = { getOngoing, getComplete, getGenreList, getByGenre, getUnlimitedList };
