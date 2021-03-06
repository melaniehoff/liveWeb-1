// Use the http module: http://nodejs.org/api/http.html
var http = require('https');
var fs = require('fs');
var PeerServer = require('peer').PeerServer;
var url =  require('url');
var options = {
	key: fs.readFileSync('my-key.pem'),
	cert: fs.readFileSync('my-cert.pem')
};
var server = PeerServer({
  port: 9000,
  ssl: options
});


// http://nodejs.org/api/http.html#http_event_request
function handleIt(req, res) {
	console.log("The URL is: " + req.url);

	var parsedUrl = url.parse(req.url);
	console.log("They asked for " + parsedUrl.pathname);

	var path = parsedUrl.pathname;
	if (path == "/") {
		path = "index.html";
	}

	fs.readFile(__dirname + path,

		// Callback function for reading
		function (err, fileContents) {
			// if there is an error
			if (err) {
				res.writeHead(500);
				return res.end('Error loading ' + req.url);
			}
			// Otherwise, send the data, the contents of the file
			res.writeHead(200);
			res.end(fileContents);
  		}
  	);	
	
	// Send a log message to the console
	console.log("Got a request " + req.url);
}



// Call the createServer method, passing in an anonymous callback function that will be called when a request is made
var httpServer = http.createServer(options, handleIt);

// Tell that server to listen on port 8081
httpServer.listen(8081);  

console.log('Server listening on port 8081');

//////////////////////////


var clients = [];

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection', 
	// We are given a websocket object in our function
	function (socket) {
		console.log("We have a new client: " + socket.id);
		
		socket.on('peerid', function(data) {
			//io.sockets.emit("peerid", data);
			socket.broadcast.emit('peerid', data);

			for (var c = 0; c < clients.length; c++) {
				socket.emit('peerid',clients[c].peerId);
			}

			clients.push({socketId:socket.id, peerId:data});
			console.log("#############")
			console.log(clients);
			console.log("#############")
		});

		socket.on('message', function (data) {
				console.log("message: " + data);
			
			// Call "broadcast" to send it to all clients (except sender), this is equal to
			// socket.broadcast.emit('message', data);
			//socket.broadcast.send(data);
			
			// To all clients, on io.sockets instead
			io.sockets.emit('message', data);
		});
			// When this user emits, client side: socket.emit('otherevent',some data);
		socket.on('otherevent', function(data) {
			// Data comes in as whatever was sent, including objects
			console.log("Received: 'otherevent' " + data);
		});

		socket.on('drawing', function(data) {
			console.log(data);
			io.sockets.emit('drawing', data);
		});

		socket.on('disconnect', function() {
			console.log("Client has disconnected", socket.id);
			for (var c = 0; c < clients.length; c++) {
				if(clients[c].socketId == socket.id) {
					io.sockets.emit('disconnect', clients[c].peerId);		
				}
			}
			
		});		
	}
);