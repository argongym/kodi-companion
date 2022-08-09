const fs = require('fs');
const url = require('url');
const http = require('http');
const mime = require('mime');

let routes = {
	error404: function(request, response){
		response.statusCode = 404;
		response.setHeader('Content-Type', 'text/plain');
		response.end('NOT FOUND');
	},
	static: function(request, response, path){
		response.statusCode = 200;
		response.setHeader('Content-Type', mime.getType(request.url));
		response.end(fs.readFileSync(request.parsedURL.fspath));
	}
};

function stop(server){
	process.send("STOP");	
	process.on("STOP", function(){
		console.log("Exiting NodeJS server...");
		server.close();
	})
}

function start(options){
	options.port = options.port ?? 3000;
	http.createServer().listen(options.port ?? 3000).on('request', processRequest);
	console.log('Server started. Now you can open http://127.0.0.1:' + options.port + '/ in your web browser...');
	return this;
}

function addRoute(pathname, fn){
	routes[pathname] = fn;
	return this;
};

function addRoutes(newRoutes){
	routes = {...routes, ...newRoutes};
	return this;
};

async function processRequest(request, response){
	console.log("Requested URL: ", request.url);
	const parsedURL = url.parse(request.url, true);
	parsedURL.fspath = '.' + parsedURL.pathname;
	request.parsedURL = parsedURL;
	response.html = (content) => output(response, content, 'text/html');
	response.json = (json) => output(response, json, 'application/json');
	response.stringify = (obj) => output(response, JSON.stringify(obj), 'application/json');
	if(parsedURL.pathname in routes){
		routes[parsedURL.pathname](request, response);
	} else if (fs.existsSync(parsedURL.fspath) && !fs.lstatSync(parsedURL.fspath).isDirectory()) {
		routes.static(request, response);
	} else {
		routes.error404(request, response);
	}
}

function output(response, content, type = 'html'){
	response.statusCode = 200;
	response.setHeader('Expires', 0);
	response.setHeader('Pragma', 'no-cache');
	response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	response.setHeader('Content-Type', type);
	response.end(content);
}

function httpGet(url){
	return new Promise((resolve, reject)=>{
		http.get(url, (resp) => {
		let data = '';

		// A chunk of data has been received.
		resp.on('data', (chunk) => {
			data += chunk;
		});

		// The whole response has been received. Print out the result.
		resp.on('end', () => {
			resolve(data);
		});

		}).on("error", (err) => {
			reject("Error: " + err.message);
		});

	});
}


module.exports = {
	routes: routes,
	start: start,
	stop: stop,
	httpGet: httpGet,
	addRoute: addRoute,
	addRoutes: addRoutes,
};