const fs = require('fs');
const config = require('./config.js');
const execSync = require('child_process').execSync;
const automagic = require('./automagic.js');

if(!fs.existsSync('cache')) fs.mkdirSync('cache');

function getAll(){
	let cmd = 'sqlite3 '+config.kodi_db+' ".mode json" "SELECT  idMovie AS movieid, c00 AS label, c01 AS plot, c11 AS runtime, c14 AS genres, c16 AS originaltitle, c19 AS trailer, c22 AS file, movie.premiered,  sets.strSet AS strSet,  sets.strOverview AS strSetOverview,  files.strFileName AS strFileName,  path.strPath AS strPath,  files.playCount AS playCount,  files.lastPlayed AS lastPlayed,   files.dateAdded AS dateAdded,   bookmark.timeInSeconds AS resumeTimeInSeconds,   bookmark.totalTimeInSeconds AS totalTimeInSeconds,   bookmark.playerState AS playerState,   rating.rating AS rating,   rating.votes AS votes,   rating.rating_type AS rating_type,   uniqueid.value AS uniqueid_value,   uniqueid.type AS uniqueid_type, (SELECT value FROM uniqueid AS uniqueid2 WHERE uniqueid2.type=\'imdb\' AND media_id=uniqueid.media_id) AS imdbid FROM movie  LEFT JOIN sets ON    sets.idSet = movie.idSet  JOIN files ON    files.idFile=movie.idFile  JOIN path ON    path.idPath=files.idPath  LEFT JOIN bookmark ON    bookmark.idFile=movie.idFile AND bookmark.type=1  LEFT JOIN rating ON rating.rating_id=movie.c05  LEFT JOIN uniqueid ON uniqueid.uniqueid_id=movie.c09 ORDER BY movie.idMovie DESC"';
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

function unknowns(){
	let kodiDb = getAll();
	let kodiFiles = kodiDb.map((item) => {
		return item.file;
	});
	let files = scanDir(config.movies_dest, /\.(avi|mkv|mp4|mov|wmv|mpg|mpeg|m4v|mpe|mpv)/);
	let missing = [];
	files.forEach((item) => {
		if(!kodiFiles.includes(item)) missing.push(item);
	});
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
		return Promise.reject('No way to play without Automagic');
	}
}

async function kodi(path){
	if(config.with_automagic_app){
		return automagic.kodi();
	} else {
		return Promise.reject('No way to open Kodi without Automagic');
	}
}

async function deletePath(path){
	if(config.with_automagic_app){
		return await automagic.rm(path);
	} else {
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
	delete: deletePath,
	unknowns: unknowns,
	cleanGarbage: () => {
		cleanGarbage(config.movies_dest).then(() => {
			automagic.notify("Library is Cleaned.");
		});
		return { complete: 'cleaning' };
	},
};
