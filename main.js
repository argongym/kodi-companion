const movies = require('./movies.js');
const server = require('./server.js');
const config = require('./config.js');
const torrents = require('./torrents.js');
const templates = require('./templates.js');
const rutracker = require('./rutracker.js');

server.start({ port: config.http_port }).addRoutes({

	'/': async (req, res) => {
		let list = await movies.getAll();
		let unknowns = movies.unknowns();
		let content = templates.fetch('media', { URL: req.url, movies: list, unknowns: unknowns } );
		res.html(content);
	},

	'/search': async (req, res) => {
		let items = await rutracker.search({ days: req.parsedURL.query.days, phrase: req.parsedURL.query.phrase });
		let content = templates.fetch('search', { URL: req.url, torrents: items, phrase: req.parsedURL.query.phrase} );
		res.html(content);
	},

	'/torrents/add': async (req, res) => {
		let torrent = await rutracker.download(req.parsedURL.query.tid);
		let info = await torrents.add(torrent, req.parsedURL.query.tid);
		res.stringify(info);
	},

	'/torrents/status': async (req, res) => {
		let info = await torrents.status();
		res.stringify(info);
	},

	'/torrents/remove': async (req, res) => {
		let info = await torrents.remove(req.parsedURL.query.tid);
		res.stringify(info);
	},

	'/torrents/pause': async (req, res) => {
		let info = await torrents.pause(req.parsedURL.query.tid);
		res.stringify(info);
	},

	'/torrents/resume': async (req, res) => {
		let info = await torrents.resume(req.parsedURL.query.tid);
		res.stringify(info);
	},

	'/movies/rename': async (req, res) => {
		let info = await movies.rename(req.parsedURL.query.source, req.parsedURL.query.target);
		res.stringify(info);
	},

	'/movies/play': async (req, res) => {
		let info = await movies.play(req.parsedURL.query.path);
		res.stringify(info);
	},

	'/movies/delete': async (req, res) => {
		let info = await movies.delete(req.parsedURL.query.path);
		res.stringify(info);
	},

	'/movies/clean': async (req, res) => {
		let info = movies.cleanGarbage();
		res.stringify(info);
	},

	'/movies/kodi': async (req, res) => {
		let info = movies.kodi();
		res.stringify(info);
	},
});