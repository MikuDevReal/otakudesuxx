const { clean, slugFromUrl } = require('./scraper');

/**
 * Parse halaman berformat grid ".venz > ul > li" yang dipakai otakudesu
 * untuk ongoing-anime, complete-anime, dan genre/{slug}.
 * Mengembalikan array item dengan bentuk:
 * { animeId, title, poster, episodes, latestReleaseDate, lastReleaseDate, day }
 */
function parseAnimeGrid($) {
  const list = [];

  $('.venz > ul > li, .venz ul li').each((_, el) => {
    const $el = $(el);
    const href = $el.find('a').first().attr('href') || '';
    const animeId = slugFromUrl(href, 'anime');

    const title = clean(
      $el.find('h2.jdlflm').text() || $el.find('.jdlflm').text() || $el.find('h2').text()
    );

    let poster =
      $el.find('img').attr('src') ||
      $el.find('img').attr('data-src') ||
      '';

    const episodeText = clean($el.find('.epz').text());
    const dateText = clean($el.find('.newnime').text());
    const typeText = clean($el.find('.epztipe').text());

    if (!title && !href) return; // lewati elemen yang bukan kartu anime

    list.push({
      animeId,
      title,
      poster,
      episodes: episodeText || null,
      latestReleaseDate: dateText || null,
      lastReleaseDate: dateText || null,
      type: typeText || null,
      url: href,
    });
  });

  return list;
}

/**
 * Parse info pagination umum otakudesu, contoh markup:
 * <div class="pagination"> <a class="next page-numbers">...</a> ... <a class="prev page-numbers">...</a> </div>
 * atau daftar <a class="page-numbers">2</a>...
 */
function parsePagination($) {
  const hasNextPage = $('a.next.page-numbers, .pagination .next').length > 0;
  const hasPrevPage = $('a.prev.page-numbers, .pagination .prev').length > 0;

  let totalPages = 1;
  $('a.page-numbers, .pagination a').each((_, el) => {
    const n = parseInt($(el).text().trim(), 10);
    if (!Number.isNaN(n) && n > totalPages) totalPages = n;
  });

  return {
    hasNextPage,
    hasPrevPage,
    has_next_page: hasNextPage,
    has_previous_page: hasPrevPage,
    totalPages,
    total_pages: totalPages,
  };
}

module.exports = { parseAnimeGrid, parsePagination };
