const cheerio = require('cheerio');
const { getPage, clean, slugFromUrl } = require('./scraper');

// Otakudesu menyimpan tiap pilihan server streaming sebagai <li> dengan
// atribut data-content berisi HTML <iframe> yang di-encode base64.
// Kita decode lalu ambil src iframe-nya.
function decodeServerContent(base64) {
  try {
    const html = Buffer.from(base64, 'base64').toString('utf-8');
    const $frame = cheerio.load(html);
    return $frame('iframe').attr('src') || null;
  } catch (e) {
    return null;
  }
}

async function getEpisode(slug) {
  const $ = await getPage(`/episode/${slug}/`);

  const title = clean($('.venutama h1, h1').first().text());

  const defaultStreamingUrl = $('.responsive-embed-stream iframe, .venser iframe').attr('src') || null;

  const servers = [];
  $('.mirrorstream ul li a, .mirrorstream li a').each((_, a) => {
    const $a = $(a);
    const content = $a.attr('data-content');
    servers.push({
      // serverId = data-content asli (di-encode supaya aman dipakai di path URL),
      // nanti didekode lagi oleh endpoint /anime/server/:serverId
      serverId: content ? encodeURIComponent(content) : `${slug}-${servers.length}`,
      server: clean($a.text()),
      quality: clean($a.closest('div,ul').prev('.mirrorstream-title, .kualitas').text()) || null,
      streamUrl: content ? decodeServerContent(content) : null,
    });
  });

  const qualities = [];
  $('.download-eps, .download2, .dl-eps').each((_, block) => {
    const quality = clean($(block).find('strong, h4').first().text());
    const urls = [];
    $(block)
      .find('a')
      .each((__, a) => {
        urls.push({ provider: clean($(a).text()), url: $(a).attr('href') || '' });
      });
    if (quality || urls.length) qualities.push({ quality, urls });
  });

  const info = {
    duration: null,
    type: null,
    credit: null,
    encoder: null,
  };
  $('.infozeus p, .keterangananime p').each((_, p) => {
    const label = clean($(p).find('span').first().text()).toLowerCase();
    const value = clean($(p).text().replace($(p).find('span').first().text(), '').replace(/^:/, ''));
    if (label.includes('durasi')) info.duration = value;
    if (label.includes('tipe')) info.type = value;
    if (label.includes('credit')) info.credit = value;
    if (label.includes('encoder')) info.encoder = value;
  });

  const animeLink = $('.venutama a[href*="/anime/"]').first().attr('href') || '';

  return {
    episodeId: slug,
    title,
    anime: { animeId: slugFromUrl(animeLink, 'anime') },
    defaultStreamingUrl,
    servers,
    qualities,
    info,
  };
}

module.exports = { getEpisode, decodeServerContent };
