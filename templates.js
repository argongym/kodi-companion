const fs = require('fs');
const fspath = require('path');
const handlebars = require('handlebars');
const config = require('./config.js');

let compiled = {};
let templates = scanTemplates();
for(const key in templates) handlebars.registerPartial(key, templates[key]);
for(const key in templates) compiled[key] = handlebars.compile(templates[key]);

function fetch(template, vars){
	return compiled[template]({...vars, config: config});
}

function scanTemplates(path = ''){
    let templates = {};
    fs.readdirSync(fspath.join('templates', path)).forEach(component => {
      if (component.match('.html')) {
        let componentTag = (path + component).replace('.html', '').replace('/', '.');
        templates[componentTag] = fs.readFileSync(fspath.join('templates', path, component), 'utf8');
      } else if(fs.lstatSync(fspath.join('templates', path, component)).isDirectory()) {
        templates = {...templates, ...(scanTemplates(path + component + '/'))};
      }
    });
    return templates;
}

const helpers = {
	'is': function(arg1, arg2, options) {
	  return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
	},
	'not': function(arg1, arg2, options) {
	  return (arg1 !== arg2) ? options.fn(this) : options.inverse(this);
	},
	'urlencode': function(str, options) {
	  return encodeURI(str);
	},
	'uriencode': function(str, options) {
	  return encodeURIComponent(str);
	},
	'stringify': function(str, options) {
	  return JSON.stringify(str);
	},
	'selected': function(current, selection, options){
		return current == selection ? ' selected="selected"' : '';
	}
}
for(const key in helpers) handlebars.registerHelper(key, helpers[key]);

module.exports = {
	fetch: fetch,
};
