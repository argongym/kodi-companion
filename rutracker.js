const fs = require('fs');
const execSync = require('child_process').execSync;
const config = require('./config.js');
const util = require('node:util');
const HTMLParser = require('node-html-parser');

if(!fs.existsSync('cache')) fs.mkdirSync('cache');

async function download(torrentId) {
	return execSync(util.format(
		'curl -s %s/forum/dl.php?t=%s -H "User-Agent: %s" --cookie %s',
		config.rutracker_hostname,
		torrentId,
		config.rutracker_useragent,
		config.curl_cookies_jar
	));
}

async function login(){
	let result = execSync(util.format(
		'curl -s -X POST %s/forum/login.php -d "redirect=index.php&login_username=%s&login_password=%s&login=%C2%F5%EE%E4" -H "Content-Type: application/x-www-form-urlencoded" -H "User-Agent: %s" --cookie-jar %s',
		config.rutracker_hostname,
		config.rutracker_user,
		config.rutracker_pass,
		config.rutracker_useragent,
		config.curl_cookies_jar
	)).toString();
	let captcha_src = result.match(/(https\:\/\/static\.t\-ru\.org\/captcha\/[a-z0-9]+\.jpg\?\d+)/);
	if(captcha_src && (captcha_src = captcha_src[1])){
		let captcha_sid = result.match(/name\=\"cap_sid\"\s+value\=\"([^"]+)\"/)[1];
		let captcha_name = result.match(/(cap_code_[^"]+)/)[1];
		let captcha = await antiGateImg(captcha_src);
		result = execSync(util.format(
			'curl -s -X POST %s/forum/login.php -d "cap_sid=%s&%s=%s&redirect=index.php&login_username=%s&login_password=%s&login=%C2%F5%EE%E4" -H "Content-Type: application/x-www-form-urlencoded" -H "User-Agent: %s" --cookie-jar %s',
			config.rutracker_hostname,
			captcha_sid, captcha_name, captcha,
			config.rutracker_user,
			config.rutracker_pass,
			config.rutracker_useragent,
			config.curl_cookies_jar
		)).toString();
	}
	if(fs.existsSync(config.rutracker_categories)) fs.unlinkSync(config.rutracker_categories);
	return result.match(/Added cookie bb_session/);
}

function getCategories(){
	if(fs.existsSync(config.rutracker_categories)) return JSON.parse(fs.readFileSync(config.rutracker_categories));
	let categories = [];
	let result = execSync(util.format(
		'curl -s %s/forum/tracker.php -H "User-Agent: %s" --cookie %s | iconv -f CP1251 -t UTF-8',
		config.rutracker_hostname,
		config.rutracker_useragent,
		config.curl_cookies_jar
	)).toString();
	if(result){
	    let matches = [...result.matchAll(/<option id="fs-\d+" value="(\d+)"[^>]+?>[^<]*?(фильм|кино|Фильм)[^<]*?<\/option>/g)];
	    for(const match of matches){
	    	categories.push(match[1]);
	    }
	    if(categories.length) fs.writeFileSync(config.rutracker_categories, JSON.stringify(categories));
	}

    return categories;
}

async function search(options){
	let categories = getCategories();
	let request = util.format(
		'curl -s %s/forum/tracker.php -d "f=%s&nm=%s&tm=%s&o=%s&s=%s&pn=%s" -H "Content-Type: application/x-www-form-urlencoded" -H "User-Agent: %s" --cookie %s | iconv -f CP1251 -t UTF-8',
		config.rutracker_hostname,
		categories.join(','),                       // categories
		options.phrase ?? '',                       // search phrase
		options.days ?? (options.phrase ? '' : 7),  // days
		options.order ?? 4,                         // order by downloads
		2,                                          // sort desc
		'',                                         // page number
		config.rutracker_useragent,
		config.curl_cookies_jar
	);
	let result = execSync(request).toString();

	let torrents = [];
	var root = HTMLParser.parse(result);
	root.querySelectorAll('tr.tCenter.hl-tr').forEach(function(tr){
		if(!tr.querySelector('a.med.tLink.tt-text.ts-text.hl-tags.bold')) return;
		let fullTitle = unescapeHTML(tr.querySelector('a.med.tLink.tt-text.ts-text.hl-tags.bold').innerHTML);
		torrents.push({
			tid: tr.attributes['data-topic_id'],
			label: fullTitle.replace(/\s*(.+?)\s*[\/\(].+/, "$1").trim(),
			sublabel: {...fullTitle.match(/.+?[\/]\s*(.+?)\s*\(.+/, "$1")}[1],
			meta: fullTitle.replace(/.+?\s*(\(.+)\s*/, "$1").trim().replaceAll(/(комедия|семейный|фантастика|приключения)/g, "<b>$1</b>"),
			category: tr.querySelector('a.gen.f.ts-text').innerHTML,
			size: unescapeHTML(tr.querySelector('a.small.tr-dl.dl-stub').innerHTML).replaceAll(/[^0-9A-Z\.\,]+/g, '').trim(),
			seeds: tr.querySelector('b.seedmed') ? tr.querySelector('b.seedmed').innerHTML : 0,
			downloads: numberWithCommas(tr.querySelector('td.row4.small.number-format').innerHTML)
		});
	});
	return torrents;
}

async function antiGateImg(src){
	let image = execSync('curl -s ' + src);
	let task = JSON.parse(execSync(util.format(
		'curl -s -H "Accept: application/json" -H "Content-Type: application/json" -X POST -d \'%s\' https://api.anti-captcha.com/createTask',
		JSON.stringify({
		    "clientKey": config.antigate_api_key,
		    "softId": 0,
		    "task": {
	            "type":"ImageToTextTask",
	            "body":Buffer.from(image).toString('base64'),
	            "phrase":false,
	            "case":false,
	            "numeric":0,
	            "math":false,
	            "minLength":0,
	            "maxLength":0
	        },
		})
	)));
	console.log('Captcha: ', task);

	for(var i = 0; i<20; i++){
		await sleep(3000);
		let result = JSON.parse(execSync(util.format(
			'curl -s -H "Accept: application/json" -H "Content-Type: application/json" -X POST -d \'%s\' https://api.anti-captcha.com/getTaskResult',
			JSON.stringify({
			    "clientKey": config.antigate_api_key,
			    "taskId": task.taskId
			})
		)));
		console.log('Captcha: ', result);
		if(result.status && result.status == 'ready') return result.solution.text;
	}
}

function unescapeHTML(str) {
	const htmlEntities = { nbsp: ' ', cent: '¢', pound: '£', yen: '¥', euro: '€', copy: '©', reg: '®', lt: '<', gt: '>', quot: '"', amp: '&', apos: '\'', raquo: '»', laquo: '«'};
    return str.replace(/\&([^;]+);/g, function (entity, entityCode) {
        let match;

        if (entityCode in htmlEntities) {
            return htmlEntities[entityCode];
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
            return String.fromCharCode(parseInt(match[1], 16));
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#(\d+)$/)) {
            return String.fromCharCode(~~match[1]);
        } else {
            return entity;
        }
    });
};

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = {
	search: async function(options){
		let torrents = search(options);
		if(!torrents.length){
			await login();
			torrents = search(options);
		}
		return torrents;
	},
	download: async function(tid){
		let result = await download(tid);
		if(!result.length){
			await login();
			result = await download(tid);
		}
		return result;
	},
};