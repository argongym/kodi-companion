const fs = require('fs');
const path = require('path');
const client = new (require('webtorrent'))();
const movies = require('./movies.js');
const config = require('./config.js');

let torrents = {};

resumeTorrents();

async function add(torrentFile, tid, name, year){
	return new Promise(function(resolve, reject){
		client.add(torrentFile, { path: config.torrents_tmp }, function (torrent){
			fs.writeFileSync(config.torrents_tmp + '/' + tid + '.torrent', torrentFile);
			console.log('Downloading torrent: ', tid, '/', torrent.name, name, year);
			torrent.tid = tid;
			torrents[tid] = torrent;
			torrent.on('done', function(){
				console.log('Finished downloading: ', tid, '/', torrent.name);
				const movieFiles = torrent.files.filter(file => isMovieFile(file.path));
				movieFiles.forEach((file, index) => {
					const ext = path.extname(file.path); // Get file extension
					const newName = `${config.movies_dest}/${name}${movieFiles.length > 1 ? `.${index + 1}` : ''}${year > 0 ? year + '.' : ""}${ext}`;
					fs.renameSync(file.path, newName);
					console.log(`Renamed: ${file.path} -> ${newName}`);
				});				
				torrent.files.forEach(function(file){
					let dest = config.torrents_dest + file.path.replace(config.torrents_tmp, '');
					if(config.torrents_tmp != config.torrents_dest){
						fs.cpSync(file.path, dest, {recursive:true, force:true});
						fs.rmSync(file.path, {recursive:true, force:true});
					};
					if(config.movies_dest != config.torrents_dest){
						let target = config.movies_dest + file.path.replace(config.torrents_tmp, '');
						movies.rename(dest, target);
					}
				});
				remove(tid);
			});
			return resolve({
				tid: tid,
				name: torrent.name,
				downloaded: torrent.downloaded,
				downloadSpeed: torrent.downloadSpeed,
				progress: torrent.progress,
				size: torrent.length,
			});
		});
	});
}

async function remove(tid){
	return new Promise(function(resolve, reject){
		client.remove(torrents[tid], function(){
			[
				config.torrents_tmp + '/' + torrents[tid].name + '/',
				config.torrents_tmp + '/' + torrents[tid].name,
				config.torrents_tmp + '/' + tid + '.torrent'
			].forEach(function(file){
				if((config.torrents_tmp == config.torrents_dest) && !file.match('.torrent')) return;
				if(fs.existsSync(file)) fs.rmSync(file, {recursive:true, force:true});
			})
			torrents[tid].destroy();
			delete torrents[tid];
			resolve({ status:"removed" });
		});
	});
}

function pause(tid){
	torrents[tid].pause();
	return { status:"paused" };
}

function resume(tid){
	torrents[tid].resume();
	return { status:"resumed" };
}

function status(){
	let status = {
		progress: formatProgress(client.progress),
		downloadSpeed: formatSpeed(client.downloadSpeed),
		uploadSpeed: formatSpeed(client.uploadSpeed),
		size: 0,
		torrents:[]
	};
	for(let tid in torrents){
		status.torrents.push({
			tid: tid,
			name: torrents[tid].name,
			downloaded: formatBytes(torrents[tid].downloaded),
			downloadSpeed: formatSpeed(torrents[tid].downloadSpeed),
			progress: formatProgress(torrents[tid].progress),
			size: formatBytes(torrents[tid].length),
		});
		status.size += torrents[tid].length;
	}
	status.active = status.torrents.length;
	status.size = formatBytes(status.size);
	return status;
}

async function resumeTorrents(){
	if(!fs.existsSync(config.torrents_tmp)){
		fs.mkdirSync(config.torrents_tmp);
		return false;
	}
	fs.readdirSync(config.torrents_tmp).forEach(file => {
		if (file.match('.torrent')) {
			console.log('Resuming torrent ' + file);
			let tid = path.basename(file, '.torrent');
			add(fs.readFileSync(config.torrents_tmp + '/' + file), tid);
		}
	});
}

function isMovieFile(filePath) {
    const movieExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv']; // Add more extensions as needed
    return movieExtensions.includes(path.extname(filePath).toLowerCase());
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatSpeed(bps){
	return (bps / 1024 / 1024).toFixed(2) + ' MBps';
}

function formatProgress(num){
	return (num * 100).toFixed(2) + '%';
}

module.exports = {
	add: add,
	status: status,
	remove: remove,
	pause: pause,
	resume: resume,
};
