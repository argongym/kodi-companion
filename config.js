const fs = require('fs');

let confile = './config.json';
if (process.env.STAGE == 'dev') confile = './config-dev.json';
if (process.env.STAGE == 'config') {
	if(!fs.existsSync('./config-tmp.json')){
		fs.cpSync('./config-default.json', './config-tmp.json');
	}
	confile = './config-tmp.json';
}

let config = require(confile);
for (let key in config){
	// replacing leading "." in paths with a current working dir
	if(typeof config[key] === 'string' || config[key] instanceof String){
		config[key] = config[key].replace(/^\./, process.cwd());
	}
}

if (process.env.STAGE == 'config') {
	const server = require('./server.js');
	const templates = require('./templates.js');
	server.start({ port: 3000 })
	.addRoute('/', (req, res) => {
		let content = templates.fetch('config', {configs: config});
		res.html(content);
	})
	.addRoute('/save', (req, res) => {
		fs.writeFileSync('./config-tmp.json', req.parsedURL.query.config);
		res.json(req.parsedURL.query.config);
	})
	.addRoute('/stop', (req, res) => {
		res.stringify({status:"stopped"});
		process.exit();
	});
}

module.exports = config;