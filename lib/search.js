const { getPage, clean, slugFromUrl } = require('./scraper');

async function searchAnime(query) {
  const $ = await getPage('/', { s: query, post_type: 'anime' });
  const animeList = [];

  $('ul.chivsrc li, .chivsrc li').each((_, el) => {
    const $el = $(el);
    const href = $el.find('h2 a, a').first().attr('href') || '';
    const title = clean($el.find('h2 a, h2').first().text());
    const poster = $el.find('img').attr('src') || $el.find('img').attr('data-src') || '';

    const details = {};
    $el.find('.set').each((__, s) => {
      const text = clean($(s).text());
      const [label, ...rest] = text.split(':');
      if (rest.length) details[clean(label).toLowerCase()] = clean(rest.join(':'));
    });

    if (!title) return;

    animeList.push({
      animeId: slugFromUrl(href, 'anime'),
      title,
      poster,
      status: details['status'] || null,
      rating: details['rating'] || null,
      genres: details['genre'] || null,
      url: href,
    });
  });

  return { animeList };
}

module.exports = { searchAnime };
