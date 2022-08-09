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
	const execSync = require('child_process').execSync;
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
	execSync('if [ -x "$(command -v termux-open)" ]; then termux-open http://127.0.0.1:3000/; elif [ -x "$(command -v xdg-open)" ]; then xdg-open http://127.0.0.1:3000/; elif [ -x "$(command -v open)" ]; then open http://127.0.0.1:3000/; elif [ -x "$(command -v start)" ]; then start http://127.0.0.1:3000/; else python -m webbrowser http://127.0.0.1:3000/; fi');
}

module.exports = config;