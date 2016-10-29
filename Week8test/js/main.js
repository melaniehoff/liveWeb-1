			var socket = io.connect();

			//drawing
			var context;
			var canvas;
			var mouseIsDown = false;
			var col='hsl(' + 360 * Math.random() + ', 50%, 50%)';

			//video
			var clientID;
			var video;
			var clientList;
			var dataURL;
			var othercanvas;
			var thecontext;
			var othervideo;
			

			//chat
			var submitButton;
			var userinput;
			var messages;
			var message;

			//video
			// We'll use a global variable to hold on to our id from PeerJS
			var peer_id = null;
			var peer = null;
			var my_stream = null; // getUserMedia

			socket.on('connect', function() {
				console.log("Connected");
				clientID = socket.io.engine.id;
				console.log("My client id: " + clientID);

				//we send our client id back to the server
				socket.emit('client', clientID);

			});

			//checking to see if our client is already connected
  			//if not (if it's a newly connected), add new div with all data
  			socket.on('client', function (data){
  				//create a div only if is a new user
  				for (var i=0; i < data.length; i++){
  					if (document.getElementById(data[i])==null){
  					console.log("userlist "+data[i]);
  					}
  				}
  			});

			//drawing
			socket.on('drawing',function(data){
				console.log(data);

				context.arc(data.x,data.y,10,0,2*Math.PI);
				context.fillStyle = data.col;
				context.fill();
				context.closePath();
			});

			// chat // accepting from all events
			socket.on('message', function (data) {
				console.log("new message:", data);
				var previousMessages = document.getElementById('messages').innerHTML;
				document.getElementById('messages').innerHTML = previousMessages + '<br>' + data;
			});

			// --------- END OF SOCKETS

  			//sending messages
  			var sendmessage = function(message) {
  				console.log("sending message", message);
				socket.emit('message', message);
			};

			
			//drawing
			function init() {
				//get video streaming from each user and play it on their browser
				window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
				navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

				thevideo=document.getElementById("thevideo");
				othervideo=document.getElementById("othervideo");

				
				//video is not hidden, so we see it
				if (navigator.getUserMedia) {
					navigator.getUserMedia({video: true}, function(stream) {
						my_stream = stream;
						thevideo.src = window.URL.createObjectURL(stream) || stream;
						thevideo.play();
						connectPeer(); // run this function

						//
						}, function(error) {alert("Failure " + error.code);}
					);
				}

				console.log("video is not null");

				canvas = document.getElementById('mycanvas');
				context = canvas.getContext('2d');

				canvas.addEventListener('mousedown',function(evt){ //mousedragged turi cia buti
					mouseIsDown = true;
					console.log(evt);
					col='hsl(' + 360 * Math.random() + ', 50%, 50%)'; // if this is here, then everybody gets new random color when mousedown -- need to change that it changes for one user only others keep their own color

				});

				canvas.addEventListener('mousemove', function(evt){
					var canvasRect = canvas.getBoundingClientRect();
					if (mouseIsDown === true){
						console.log(evt);
						context.beginPath();
						context.arc(evt.clientX-canvasRect.left,evt.clientY-canvasRect.top,10,0,2*Math.PI);
						context.fillStyle = col;
						context.fill();
						context.closePath();

						var drawingobj = {x:evt.clientX-canvasRect.left, y:evt.clientY-canvasRect.top, col};

						socket.emit('drawing',drawingobj);
					}

				});

				canvas.addEventListener('mouseup', function(evt){
					mouseIsDown = false;
				});

				//chat
				submitButton = document.getElementById("submit-message");
				submitButton.addEventListener('click', submitClicked);

			}

			window.addEventListener('load',init);

			function submitClicked(){

				var newMessage = document.getElementById('message').value;
				sendmessage(newMessage);
			}

			function enter(evt) {
		        if (evt && evt.keyCode == 13) {
		            submitClicked();
		        }
		    }

		    //peer function
		    function connectPeer() {
				peer = new Peer({host: 'kcl389.itp.io', port: 9000, path: '/'});


				// Get an ID from the PeerJS server		
				peer.on('open', function(id) {
					console.log('My peer ID is: ' + id);
					peer_id = id;

					socket.emit('peerid', peer_id); // goes through with this one

					socket.on('disconnect', function(data){
						console.log("disconnected", data);
						var removedVideo = document.getElementById("cam-"+data);
						if(removedVideo !== null){
							document.body.removeChild(removedVideo);
						}
					})

					socket.on('peerid',function(data) {
						makeCall(data);
					});
				});

				peer.on('error', function(err) { 
					console.log(err);
				});

				//receive a call -- if someone is calling us and the video should be displayed on our page
				peer.on('call', function(incoming_call) {
					console.log("Got a call!", incoming_call);
					console.log(incoming_call.id, peer.id);
					incoming_call.answer(my_stream); // Answer the call with our stream from getUserMedia
					incoming_call.on('stream', function(remoteStream) {  // we receive a getUserMedia stream from the remote caller
						// And attach it to a video object
						var ovideoElement = document.createElement('video');
						ovideoElement.style.width = '150';
						ovideoElement.id = "cam-"+incoming_call.peer;
						ovideoElement.src = window.URL.createObjectURL(remoteStream) || remoteStream;
						ovideoElement.setAttribute("autoplay", "true");		
						ovideoElement.play();
						document.body.appendChild(ovideoElement);

					});
				});

			//if we're making a call and the video should be displayed on their page
			function makeCall(idToCall) {
				//var idToCall = document.getElementById('tocall').value;
				console.log("peer: " + peer);
				var call = peer.call(idToCall, my_stream);
				console.log("made a call: " + call);

				

			}
		}