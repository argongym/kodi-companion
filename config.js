const fs = require('fs');

let config = {};
let confile = './config.json';
if(process.env.STAGE == 'dev') confile = './config-dev.json';

if(fs.existsSync(confile)){
	config = require(confile);
	module.exports.original = JSON.parse(JSON.stringify(config));
	for(let key in config){
		if(typeof config[key] === 'string' || config[key] instanceof String){
			config[key] = config[key].replace(/^\./, process.cwd());
		}
		module.exports[key] = config[key];
	}
	module.exports.props = config;
} else {
	// handle situation with no config.json
}

module.exports.defaults = function() {
	return require('./config-default.json');
};
