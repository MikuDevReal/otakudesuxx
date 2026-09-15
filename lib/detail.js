const { getPage, clean, slugFromUrl } = require('./scraper');

// Ambil label ": value" dari baris <p><span>Label</span>: Value</p>
// yang jadi format standar kotak info di halaman detail otakudesu.
function extractInfo($, container) {
  const info = {};
  $(container)
    .find('p')
    .each((_, p) => {
      const label = clean($(p).find('span').first().text()).toLowerCase();
      const full = clean($(p).text());
      const value = clean(full.replace($(p).find('span').first().text(), '').replace(/^:/, ''));
      if (label) info[label] = value;
    });
  return info;
}

async function getAnimeDetail(slug) {
  const $ = await getPage(`/anime/${slug}/`);

  const infoBox = '.infozingle, .infoanime';
  const rawInfo = extractInfo($, infoBox);

  const title =
    clean($('.jdlrx h1').text()) ||
    clean($(infoBox).find('p:contains("Judul")').text().replace(/.*Judul\s*:?/i, '')) ||
    clean($('h1').first().text());

  const poster = $('.fotoanime img').attr('src') || $('.fotoanime img').attr('data-src') || '';

  const synopsis = clean($('.sinopc').text());

  const genreList = [];
  $(infoBox)
    .find('p:contains("Genre") a, .infozingle a')
    .each((_, a) => {
      const href = $(a).attr('href') || '';
      if (!href.includes('/genres/')) return;
      genreList.push({ genreId: slugFromUrl(href, 'genres'), title: clean($(a).text()) });
    });

  const episodeList = [];
  $('.episodelist ul li, .episodelist li').each((_, li) => {
    const a = $(li).find('a').first();
    const href = a.attr('href') || '';
    if (!href.includes('/episode/')) return;
    episodeList.push({
      episodeId: slugFromUrl(href, 'episode'),
      title: clean(a.text()),
      url: href,
    });
  });

  const batchLink = $('a:contains("BATCH")').attr('href') || $('.batchlink a').attr('href') || '';

  const recommendedAnimeList = [];
  $('.isi-anime a, .rand a').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (!href.includes('/anime/')) return;
    const poster2 = $(a).find('img').attr('src') || $(a).find('img').attr('data-src') || '';
    const t = clean($(a).find('h4, .judul').text() || $(a).text());
    if (!t) return;
    recommendedAnimeList.push({ animeId: slugFromUrl(href, 'anime'), title: t, poster: poster2 });
  });

  return {
    animeId: slug,
    title: title || rawInfo['judul'] || null,
    japanese: rawInfo['japanese'] || null,
    poster,
    score: rawInfo['skor'] || rawInfo['score'] || null,
    status: rawInfo['status'] || null,
    type: rawInfo['tipe'] || rawInfo['type'] || null,
    duration: rawInfo['durasi'] || null,
    studios: rawInfo['studio'] || null,
    aired: rawInfo['tanggal rilis'] || rawInfo['dirilis'] || null,
    synopsis,
    genreList,
    episodeList,
    batchId: batchLink ? slugFromUrl(batchLink, 'batch') : null,
    recommendedAnimeList,
  };
}

module.exports = { getAnimeDetail };
