var http = require("http"), fs = require("fs"), server;
function repeat(str, times) {
	var s = "";
	for (var i = 0; i < times; i++) {
		s += str;
	}
	return s;
}
console.log("Running Node.js Server");
console._log = console.log;
if (process.argv.includes("--silent") || process.argv.includes("-s")) {
	console.log = () => {};
	console._log("- Supressed");
}
if (process.argv.includes("--log") || process.argv.includes("-l")) {
	try {
		if (!fs.existsSync("./server.log")) {
			console._log("- Cannot log in file\n  Please create file 'server.log' in the same directory");
			throw new Error;
		}
	}
	catch (_) {
		console._log("- Cannot log in file\n  Please create file 'server.log' in the same directory");
		throw new Error;
	}
	console._log("- Logging in file");
	console.log = async(...data) => {
		data.join(" ");
		var old = await new Promise((resolve, reject) => {
			fs.readFile("./server.log", "utf8", (err, old) => {
				if (err) {
					reject(err);
					throw err;
				}
				resolve(old);
			});
		});
		fs.writeFile("./server.log", old + "\n" + data, err => {if (err) throw err});
	}
}
console.log("\nFile" + repeat(" ", 46) + "\tIP Address\tResult\tDate");
server = http.createServer(function (req, res) {
	var url = "." + decodeURI(req.url);
	if (url.indexOf("./forbidden") == 0) {
		res.writeHead(403);
		res.end();
		logResponse(403);
		return;
	}
	if (url.includes(".node.js?")) {
		fs.readFile(url.substr(0, url.indexOf("?")), "utf8", (err, data) => {
			if (err) {
				res.writeHead(404);
				res.end();
				url = url.substr(0, url.indexOf("?"));
				logResponse(404);
			}
			else {
				try {
					var arguments = decodeURIComponent(url.substr(url.indexOf("?") + 1));
					res.writeHead(202, {"Content-Type": "text/plain"});
					{eval(data)};
					logResponse(202);
					return;
				}
				catch (e) {
					res.writeHead(500, {"Content-Type": "text/plain"});
					res.end(e.toString());
					logResponse(500);
					return;
				}
			}
		});
	}
	else {
		var pageArgs = "";
		if (url.includes("?")) {
			pageArgs = url.substr(url.indexOf("?"));
			url = url.substr(0, url.indexOf("?"));
		}
		if (url.at(-1) == "/")
			url += "index.html";
		else {
			try {
				if (fs.existsSync(url + "/index.html")) {
					res.writeHead(307, {location: url + "/" + pageArgs});
					res.end();
					return;
				}
			}
			catch (_) {}
		}
		fs.readFile(url, null, (err, data) => {
			if (err) {
				res.writeHead(404);
				res.end();
				logResponse(404);
			}
			else {
				const types = {
					css: "text/css",
					gif: "image/gif",
					htm: "text/html",
					html: "text/html",
					ico: "image/vnd.microsoft.icon",
					jpg: "image/jpeg",
					jpeg: "image/jpeg",
					js: "text/javascript",
					json: "application/json",
					mp3: "audio/mpeg",
					mp4: "video/mp4",
					mpeg: "video/mpeg",
					png: "image/png",
					svg: "image/svg+xml",
					tif: "image/tiff",
					txt: "text/plain",
					ttf: "font/ttf",
					wav: "audio/wav"
				};
				res.writeHead(200, {"Content-Type": types[url.substr(url.lastIndexOf(".") + 1)]});
				res.end(data);
				logResponse(200);
			}
		});
	}
	function logResponse(responseCode) {
		console.log(
			url.substr(0, 50)
		  + repeat(" ", 50 - url.length)
		  + "\t" + res.socket.remoteAddress
		  + "\t" + responseCode
		  + "\t" + new Date().toString());
	}
}).listen(80, "0.0.0.0");