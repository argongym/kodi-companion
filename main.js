const config = require('./config.js');
const server = require('./server.js');
const movies = require('./movies.js');
const torrents = require('./torrents.js');
const templates = require('./templates.js');
const rutracker = require('./rutracker.js');

server.start({ port: config.http_port }).addRoutes({

	'/': async (req, res) => {
		let list = await movies.getAll();
		let unknowns = await movies.unknowns();
		let content = templates.fetch('media', { URL: req.url, movies: list, unknowns: unknowns } );
		res.html(content);
	},

	'/search': async (req, res) => {
		let items = await rutracker.search({ days: req.parsedURL.query.days, phrase: req.parsedURL.query.phrase, order: req.parsedURL.query.order });
		let content = templates.fetch('search', { URL: req.url, torrents: items, phrase: req.parsedURL.query.phrase} );
		res.html(content);
	},

	'/torrents/add': async (req, res) => {
		const filename = req.parsedURL.query.name + '.' + req.parsedURL.query.year;
		const torrentData = await rutracker.download(req.parsedURL.query.tid);
		const info = await torrents.add(torrentData, req.parsedURL.query.tid, filename);
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
		let info = await movies.deletePath(req.parsedURL.query.path);
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

	'/movies/wakeup/': async (req, res) => {
		let info = movies.wakeup();
		res.stringify(info);
	},
});