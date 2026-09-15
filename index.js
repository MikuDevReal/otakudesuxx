const express = require('express');
const cors = require('cors');

const { getHome } = require('./lib/home');
const { searchAnime } = require('./lib/search');
const { getAnimeDetail } = require('./lib/detail');
const { getEpisode } = require('./lib/episode');
const { getBatch, getSchedule } = require('./lib/batchSchedule');
const { decodeServerContent } = require('./lib/episode');
const {
  getOngoing,
  getComplete,
  getGenreList,
  getByGenre,
  getUnlimitedList,
} = require('./lib/lists');

const app = express();
app.use(cors());

// Bungkus setiap handler supaya error scraping (situs sumber berubah,
// timeout, dll) selalu jadi respons JSON yang rapi, bukan crash server.
function handle(fn) {
  return async (req, res) => {
    try {
      const data = await fn(req);
      res.json({ status: 'Ok', data });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: 'Error',
        message: 'Gagal mengambil data dari sumber. Kemungkinan struktur halaman sumber berubah.',
        detail: err.message,
      });
    }
  };
}

app.get('/', (req, res) => {
  res.json({
    status: 'Ok',
    message: 'Miku Otakudesu API aktif',
    endpoints: [
      '/anime/home',
      '/anime/search/:query',
      '/anime/anime/:slug',
      '/anime/episode/:slug',
      '/anime/batch/:slug',
      '/anime/genre',
      '/anime/genre/:slug',
      '/anime/ongoing-anime',
      '/anime/complete-anime',
      '/anime/unlimited',
      '/anime/schedule',
    ],
  });
});

app.get('/anime/home', handle(() => getHome()));

app.get('/anime/search/:query', handle((req) => searchAnime(req.params.query)));

app.get('/anime/anime/:slug', handle((req) => getAnimeDetail(req.params.slug)));

app.get('/anime/episode/:slug', handle((req) => getEpisode(req.params.slug)));

app.get('/anime/batch/:slug', handle((req) => getBatch(req.params.slug)));

app.get('/anime/genre', handle(() => getGenreList()));

app.get('/anime/genre/:slug', handle((req) => getByGenre(req.params.slug, Number(req.query.page) || 1)));

app.get('/anime/ongoing-anime', handle((req) => getOngoing(Number(req.query.page) || 1)));

app.get('/anime/complete-anime', handle((req) => getComplete(Number(req.query.page) || 1)));

app.get('/anime/unlimited', handle(() => getUnlimitedList()));

app.get('/anime/schedule', handle(() => getSchedule()));

// serverId dikirim dalam bentuk sudah di-encodeURIComponent oleh /anime/episode/:slug
app.get(
  '/anime/server/:serverId',
  handle((req) => {
    const decoded = decodeURIComponent(req.params.serverId);
    const stream_url = decodeServerContent(decoded);
    if (!stream_url) throw new Error('Tidak bisa menemukan URL streaming dari server ini');
    return { stream_url };
  })
);

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`API jalan di http://localhost:${PORT}`));
}

module.exports = app;
