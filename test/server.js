var app = require("express")();
var http = require("http").Server(app);
var fs = require("fs");
var io = require("socket.io")(http);
 
app.get('/', onRequest);
http.listen(process.env.PORT || 3000, function() {
    console.log('server started');
})
 
//404 response
function send404(response) {
    response.writeHead(404, {"Content-Type" : "text/plain"});
    response.write("Error 404: Page not found");
    response.end();
}
 
function onRequest(request, response) {
  if(request.method == 'GET' && request.url == '/') {
    response.writeHead(200, {"Content-Type" : "text/html"});
    fs.createReadStream("./index.html").pipe(response);
  } else {
    send404(response);
  }
}
 
io.on('connection', function(socket) {
  console.log("a user connected");
  socket.on('stream', function(stream) {
    socket.broadcast.emit("stream", stream);
  });
  socket.on('disconnect', function () {
    console.log("user disconnected");
  });
});