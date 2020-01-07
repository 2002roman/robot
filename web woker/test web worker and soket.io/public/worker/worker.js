
importScripts('/socket.io/socket.io.js');
var socket = io('http://127.0.0.1:9090');
var socket1 = io('http://127.0.0.1:3001');
socket.on('chat message', function(msg){
    postMessage(msg);
});
socket1.on('chat message', function(msg){
    postMessage(msg);
});
addEventListener('message', ({ data }) => {
  	socket.emit('chat message', data);
  	socket1.emit('chat message', data);
});