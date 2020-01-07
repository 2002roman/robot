var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io0 = require('socket.io')(http);
var io1 = require('socket.io')(3001);
var io2 = require('socket.io')(3002);
var io3 = require('socket.io')(3003);

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io0.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io0.emit('chat message', msg);
  });
});
io1.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io1.emit('chat message', msg);
  });
});

http.listen(9090, function(){
  console.log('listening on *:9090');
});