const { getPage, clean, slugFromUrl } = require('./scraper');

async function getBatch(slug) {
  const $ = await getPage(`/batch/${slug}/`);

  const title = clean($('.venutama h1, h1').first().text());

  const info = {};
  $('.infozeus p, .keterangananime p').each((_, p) => {
    const label = clean($(p).find('span').first().text()).toLowerCase();
    const value = clean($(p).text().replace($(p).find('span').first().text(), '').replace(/^:/, ''));
    if (label) info[label] = value;
  });

  const batchList = [];
  $('.download2, .download-eps').each((_, block) => {
    const quality = clean($(block).find('strong, h4').first().text());
    const urls = [];
    $(block)
      .find('a')
      .each((__, a) => {
        urls.push({ provider: clean($(a).text()), url: $(a).attr('href') || '' });
      });
    if (quality || urls.length) batchList.push({ quality, urls });
  });

  return {
    batchId: slug,
    title,
    info: {
      duration: info['durasi'] || null,
      type: info['tipe'] || null,
      credit: info['credit'] || null,
      encoder: info['encoder'] || null,
    },
    batchList,
  };
}

async function getSchedule() {
  const $ = await getPage('/jadwal-rilis/');
  const schedule = [];

  $('.kglist321, .kgtable').each((_, block) => {
    const day = clean($(block).find('h2, .haribesar').first().text());
    const animeList = [];
    $(block)
      .find('li a, ul li')
      .each((__, a) => {
        const href = $(a).attr('href') || $(a).find('a').attr('href') || '';
        const t = clean($(a).text());
        if (!t || !href.includes('/anime/')) return;
        animeList.push({ animeId: slugFromUrl(href, 'anime'), title: t });
      });
    if (day) schedule.push({ day, animeList });
  });

  return schedule;
}

module.exports = { getBatch, getSchedule };
