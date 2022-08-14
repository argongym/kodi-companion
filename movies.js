const fs = require('fs');
const config = require('./config.js');
const execSync = require('child_process').execSync;
const automagic = require('./automagic.js');
const server = require('./server.js');

if(!fs.existsSync('cache')) fs.mkdirSync('cache');

async function getAll(){
	let movies = {};
	try {
		if (fs.existsSync(config.kodi_db)){
			movies = getAllSql();
		} else {
			movies = await getAllRpc();
		}
	} catch (e) {

	};
	return movies;
}
function getAllSql(){
	let cmd = 'sqlite3 '+config.kodi_db+' ".mode json" "SELECT  idMovie AS movieid, c00 AS label, c01 AS plot, c11 AS runtime, c14 AS genres, c16 AS originaltitle, c19 AS trailer, c22 AS file, movie.premiered,  sets.strSet AS strSet,  sets.strOverview AS strSetOverview,  files.strFileName AS strFileName,  path.strPath AS strPath,  files.playCount AS playCount,  files.lastPlayed AS lastPlayed,   files.dateAdded AS dateAdded,   bookmark.timeInSeconds AS resumeTimeInSeconds,   bookmark.totalTimeInSeconds AS totalTimeInSeconds,   bookmark.playerState AS playerState,   rating.rating AS rating,   rating.votes AS votes,   rating.rating_type AS rating_type,   uniqueid.value AS uniqueid_value,   uniqueid.type AS uniqueid_type, (SELECT value FROM uniqueid AS uniqueid2 WHERE uniqueid2.type=\'imdb\' AND media_id=uniqueid.media_id) AS imdbnumber FROM movie  LEFT JOIN sets ON    sets.idSet = movie.idSet  JOIN files ON    files.idFile=movie.idFile  JOIN path ON    path.idPath=files.idPath  LEFT JOIN bookmark ON    bookmark.idFile=movie.idFile AND bookmark.type=1  LEFT JOIN rating ON rating.rating_id=movie.c05  LEFT JOIN uniqueid ON uniqueid.uniqueid_id=movie.c09 ORDER BY movie.idMovie DESC"';
	let movies = JSON.parse(execSync(cmd));
	movies.map(function(val){
		val.trailerid = val.trailer.replace(/.+\=/, '');
		val.rating = val.rating.toFixed(1);
		val.votes = Math.round(val.votes / 1000) + 'K';
		val.rating = (val.rating == 10 || val.votes == '0K') ? 0 : val.rating;
		val.genres = val.genres.replaceAll(/(комедия|семейный|фантастика|приключения)/g, "<b>$1</b>");
		val.runtime = toHHMM(val.runtime);
		val.year = val.premiered.replace(/\-\d+\-\d+/, '');
		return val;
	});
	return movies;	
}

async function getAllRpc(){
	let request = {"jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "params": { "properties" : ["title", "genre", "year", "rating", "trailer", "tagline", "plot", "originaltitle", "studio", "country", "imdbnumber", "runtime", "top250", "votes", "thumbnail", "file", "dateadded", "ratings", "premiered"], "sort": { "order": "descending", "method": "dateadded", "ignorearticle": true } }, "id": "libMovies"};
	let response = await server.httpGet(config.kodi_url+'/jsonrpc?request='+ encodeURIComponent(JSON.stringify(request)));
	let movies = JSON.parse(response);
	movies = movies.result.movies;
	movies.map(function(val){
		val.trailerid = val.trailer.replace(/.+\=/, '');
		val.rating = val.rating.toFixed(1);
		val.votes = Math.round(val.votes / 1000) + 'K';
		val.rating = (val.rating == 10 || val.votes == '0K') ? 0 : val.rating;
		val.genres = val.genre.join(' / ').replaceAll(/(комедия|семейный|фантастика|приключения)/g, "<b>$1</b>");
		val.runtime = toHHMM(val.runtime);
		val.year = val.premiered.replace(/\-\d+\-\d+/, '');
		return val;
	});
	return movies;
}

async function unknowns(){
	let missing = [];
	try {
		let kodiDb = await getAll();
		let kodiFiles = kodiDb.map((item) => {
			return item.file;
		});
		let files = scanDir(config.movies_dest, /\.(avi|mkv|mp4|mov|wmv|mpg|mpeg|m4v|mpe|mpv)/);
		files.forEach((item) => {
			if(!kodiFiles.includes(item)) missing.push(item);
		});
	} catch (e){
		
	}
	return missing;
}

async function cleanGarbage(origin){
    let paths = [];
    let deletes = [];
    let originHasMovie = false;
    let queue = Promise.resolve();

    fs.readdirSync(origin).forEach(path => {
    	path = origin + '/' + path;
    	if(fs.lstatSync(path).isDirectory()){
    		queue = queue.then(() => cleanGarbage(path));
    	} else if(path.match(/\.(srt|ac3|mcoll)/)){
			deletes.push(path);
		} else if(path.match(/\.(avi|mkv|mp4|mov|wmv|mpg|mpeg|m4v|mpe|mpv)/)) {
			originHasMovie = true;
		} else {
			console.log('Not movie, not garbage: ', path)
		}
    });

    // delete garbage files if there is no movie file in the directory
    if(!originHasMovie) deletes.forEach((path) => {
    	queue = queue.then(() => deletePath(path));
    });

	// delete origin path if it's empty
	queue = queue.then(() => {
		if(fs.lstatSync(origin).isDirectory() && !fs.readdirSync(origin).length){
			queue = queue.then(() => deletePath(origin));
		}
	});

	return queue;
}

function scanDir(src, filter){
    let paths = [];
    fs.readdirSync(src).forEach(path => {
    	path = src + '/' + path;
		if(!filter || path.match(filter)) paths.push(path);
		if(fs.lstatSync(path).isDirectory()) {
			paths = [...paths, ...(scanDir(path, filter))];
		}
    });
    return paths;	
}

async function play(path){
	if(config.with_automagic_app){
		return automagic.play(path);
	} else {
		execSync('if [ -x "$(command -v termux-open)" ]; then termux-open '+path+'; elif [ -x "$(command -v xdg-open)" ]; then xdg-open '+path+'; elif [ -x "$(command -v open)" ]; then open '+path+'; elif [ -x "$(command -v start)" ]; then start '+path+'; else python -m webbrowser '+path+'; fi');
		return Promise.resolve();
	}
}

async function kodi(){
	if(config.with_automagic_app){
		return automagic.kodi();
	} else {
		let path = 'some.avi';
		execSync('if [ -x "$(command -v termux-open)" ]; then termux-open '+path+'; elif [ -x "$(command -v xdg-open)" ]; then xdg-open '+path+'; elif [ -x "$(command -v open)" ]; then open '+path+'; elif [ -x "$(command -v start)" ]; then start '+path+'; else python -m webbrowser '+path+'; fi');
		return Promise.resolve();
	}
}

async function wakeup(){
	return automagic.wakeup().catch((e)=>{});
}

async function deletePath(path){
	console.log('Removing '+path);
	if(config.with_automagic_app){
		console.log('...with Automagic');
		return await automagic.rm(path);
	} else {
		console.log('...with fs.rmSync');
		fs.rmSync(path, {recursive:true, force:true});
		return Promise.resolve({ complete: 'delete' });
	}
}

async function rename(source, target){
	if(config.with_automagic_app){
		return automagic.rename(source, target);
	} else {
		fs.renameSync(source, target);
		return Promise.resolve({ complete: 'rename' });
	}
}

function toHHMM(sec_num) {
    let hours   = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);

    return hours + 'h ' + minutes + 'm';
}

module.exports = {
	getAll: getAll,
	rename: rename,
	play: play,
	kodi: kodi,
	deletePath: deletePath,
	unknowns: unknowns,
	cleanGarbage: () => {
		cleanGarbage(config.movies_dest).then(() => {
			automagic.notify("Library is Cleaned.");
		});
		return { complete: 'cleaning' };
	},
};
