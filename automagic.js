const execSync = require('child_process').execSync;

let ackStart = 0;
let timeout = 5 * 60 * 1000;

let sendingQueue = Promise.resolve();

async function wakeup(){
	return send({action:'wakeup' });
}

async function kodi(){
	return send({action:'kodi' });
}

async function play(path){
	return send({action:'play', path: path });
}

async function rm(path){
	return send({action:'delete', path: path });
}

async function rename(source, target){
	return send({action:'rename', source: source, target: target });
}

async function notify(message){
	return send({action: 'notify', message: message });
}

async function test(options){
	return send({action: 'test', ...options });
}

async function send(cmd){
	return sendingQueue = sendingQueue.then( ()=>{
		return new Promise((resolve, reject)=>{
			let clip = JSON.stringify(cmd);
			//if [ -x \"$(command -v termux-clipboard-set)\" ]; then termux-clipboard-set 'automagic-run-flow:" + clip + "'; else echo 'automagic-run-flow:" + clip + "' | pbcopy; fi
			execSync("termux-clipboard-set 'automagic-run-flow:" + clip + "'");
			execSync("termux-notification -c 'Automagic, check the clipboard!'");
			ackStart = Date.now();
			return checkAck(cmd, clip, resolve, reject);
		});
	});
}

async function checkAck(cmd, clip, resolve, reject){
	return setTimeout( () => {
		//if [ -x \"$(command -v termux-clipboard-get)\" ]; then termux-clipboard-get; else pbpaste; fi
		let ack = execSync("termux-clipboard-get");
		if (ack == ('automagic-flow-complete:' + clip)){
			return resolve({ complete: cmd.action });
		} else {
			if ((Date.now() - ackStart) > timeout) reject('ACK timeout for ' + clip);
			return checkAck(cmd, clip, resolve, reject);
		}
	}, 100);
};

module.exports = {
	play: play,
	rm: rm,
	kodi: kodi,
	wakeup: wakeup,
	rename: rename,
	notify: notify,
	test: test,
	timeout: timeout,
};
