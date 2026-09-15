const express = require('express');
const cors = require('cors');

const { getHome } = require('./lib/home');
const { searchAnime } = require('./lib/search');
const { getAnimeDetail } = require('./lib/detail');
const { getEpisodeList, getEpisodeDetail } = require('./lib/episode');
const { getSchedule } = require('./lib/schedule');
const {
  getOngoing,
  getComplete,
  getGenreList,
  getByGenre,
  getTopAnime,
} = require('./lib/lists');

const app = express();
app.use(cors());

// Bungkus tiap handler supaya error (mis. Jikan lagi down/rate-limit)
// selalu jadi respons JSON yang rapi, bukan crash server.
function handle(fn) {
  return async (req, res) => {
    try {
      const data = await fn(req);
      res.json({ status: 'Ok', data });
    } catch (err) {
      console.error(err);
      const upstreamStatus = err.response?.status;
      // Info tambahan untuk debugging: header & potongan body dari respons
      // upstream (Jikan), supaya kelihatan kalau ternyata itu bukan 504 asli
      // dari Jikan, tapi mis. halaman blokir Cloudflare atau semacamnya.
      const upstreamServer = err.response?.headers?.server ?? null;
      const upstreamBodyRaw = typeof err.response?.data === 'string'
        ? err.response.data
        : JSON.stringify(err.response?.data ?? '');
      const upstreamBodySnippet = upstreamBodyRaw ? upstreamBodyRaw.slice(0, 300) : null;

      res.status(upstreamStatus === 404 ? 404 : 500).json({
        status: 'Error',
        message: upstreamStatus === 404
          ? 'Data tidak ditemukan di MyAnimeList.'
          : 'Gagal mengambil data dari Jikan API (MyAnimeList).',
        detail: err.message,
        debug: {
          upstreamStatus: upstreamStatus ?? null,
          upstreamServer,
          upstreamBodySnippet,
        },
      });
    }
  };
}

app.get('/', (req, res) => {
  res.json({
    status: 'Ok',
    message: 'Miku Anime API aktif (sumber data: Jikan API / MyAnimeList, resmi & legal)',
    endpoints: [
      '/anime/home',
      '/anime/search/:query',
      '/anime/anime/:id',
      '/anime/episode/:id',
      '/anime/episode/:id/:number',
      '/anime/genre',
      '/anime/genre/:id',
      '/anime/ongoing-anime',
      '/anime/complete-anime',
      '/anime/top',
      '/anime/schedule',
      '/anime/schedule/:day',
    ],
  });
});

app.get('/anime/home', handle(() => getHome()));

app.get('/anime/search/:query', handle((req) => searchAnime(req.params.query, Number(req.query.page) || 1)));

// :id = MyAnimeList ID (angka), didapat dari field "animeId" di respons lain
app.get('/anime/anime/:id', handle((req) => getAnimeDetail(req.params.id)));

app.get('/anime/episode/:id', handle((req) => getEpisodeList(req.params.id, Number(req.query.page) || 1)));
app.get('/anime/episode/:id/:number', handle((req) => getEpisodeDetail(req.params.id, req.params.number)));

app.get('/anime/genre', handle(() => getGenreList()));
app.get('/anime/genre/:id', handle((req) => getByGenre(req.params.id, Number(req.query.page) || 1)));

app.get('/anime/ongoing-anime', handle((req) => getOngoing(Number(req.query.page) || 1)));
app.get('/anime/complete-anime', handle((req) => getComplete(Number(req.query.page) || 1)));
app.get('/anime/top', handle((req) => getTopAnime(Number(req.query.page) || 1)));

app.get('/anime/schedule', handle(() => getSchedule()));
app.get('/anime/schedule/:day', handle((req) => getSchedule(req.params.day)));

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`API jalan di http://localhost:${PORT}`));
}

module.exports = app;
